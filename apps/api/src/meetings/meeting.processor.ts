import {
  actionItems,
  clients,
  meetings,
  meetingSummaries,
  transcripts,
  user,
  type Database,
} from '@allfina/db';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { and, eq } from 'drizzle-orm';
import { AiClientService } from '../ai/ai-client.service';
import { AuditService } from '../audit/audit.service';
import { DB } from '../database/database.module';
import { MEETING_QUEUE, type ProcessMeetingJob } from '../queue/queue.module';
import { StorageService } from '../storage/storage.service';

/**
 * Background pipeline for one meeting:
 *   recording -> transcript (Deepgram via ai-service) -> analysis (Claude via ai-service)
 */
@Processor(MEETING_QUEUE, { concurrency: 2 })
export class MeetingProcessor extends WorkerHost {
  private readonly logger = new Logger(MeetingProcessor.name);

  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly ai: AiClientService,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
  ) {
    super();
  }

  async process(job: Job<ProcessMeetingJob>): Promise<void> {
    const { meetingId, firmId } = job.data;
    const [row] = await this.db
      .select({
        meeting: meetings,
        clientFirstName: clients.firstName,
        clientLastName: clients.lastName,
        advisorName: user.name,
      })
      .from(meetings)
      .leftJoin(clients, eq(clients.id, meetings.clientId))
      .innerJoin(user, eq(user.id, meetings.advisorId))
      .where(and(eq(meetings.id, meetingId), eq(meetings.firmId, firmId)));
    if (!row) {
      this.logger.warn(`Meeting ${meetingId} no longer exists; skipping`);
      return;
    }
    const { meeting } = row;

    // 1. Transcribe if we only have a recording.
    let [transcript] = await this.db
      .select()
      .from(transcripts)
      .where(eq(transcripts.meetingId, meetingId));
    if (!transcript) {
      if (!meeting.recordingKey) throw new Error('Meeting has no recording or transcript');
      await job.updateProgress(10);
      const audioUrl = await this.storage.createDownloadUrl(meeting.recordingKey);
      const result = await this.ai.transcribe(audioUrl);
      [transcript] = await this.db
        .insert(transcripts)
        .values({
          meetingId,
          text: result.text,
          segments: result.segments,
          provider: result.provider,
        })
        .returning();
      if (result.duration_seconds != null) {
        await this.db
          .update(meetings)
          .set({ durationSeconds: Math.round(result.duration_seconds) })
          .where(eq(meetings.id, meetingId));
      }
    }

    // 2. Analyze: summary, action items, follow-up email, compliance flags.
    await job.updateProgress(50);
    const analysis = await this.ai.analyzeMeeting({
      transcript: transcript!.text,
      meeting_title: meeting.title,
      client_name: row.clientFirstName ? `${row.clientFirstName} ${row.clientLastName}` : undefined,
      advisor_name: row.advisorName,
    });

    await this.db.transaction(async (tx) => {
      const summary = {
        summary: analysis.summary,
        keyPoints: analysis.key_points,
        followUpEmailSubject: analysis.follow_up_email.subject,
        followUpEmailBody: analysis.follow_up_email.body,
        complianceFlags: analysis.compliance_flags,
        model: analysis.model,
      };
      await tx
        .insert(meetingSummaries)
        .values({ meetingId, ...summary })
        .onConflictDoUpdate({ target: meetingSummaries.meetingId, set: summary });

      await tx.delete(actionItems).where(eq(actionItems.meetingId, meetingId));
      if (analysis.action_items.length > 0) {
        await tx.insert(actionItems).values(
          analysis.action_items.map((a) => ({
            firmId,
            meetingId,
            description: a.description,
            owner: a.owner,
            dueDate: a.due_date,
          })),
        );
      }
      await tx
        .update(meetings)
        .set({ status: 'completed', errorMessage: null })
        .where(eq(meetings.id, meetingId));
    });

    await this.audit.record({
      firmId,
      actorId: null,
      action: 'meeting.processed',
      entityType: 'meeting',
      entityId: meetingId,
      metadata: { model: analysis.model, actionItems: analysis.action_items.length },
    });
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job<ProcessMeetingJob> | undefined, err: Error) {
    if (!job) return;
    this.logger.error(`Meeting ${job.data.meetingId} failed (attempt ${job.attemptsMade})`, err);
    // Only mark as failed once BullMQ has used up all retries.
    if (job.attemptsMade < (job.opts.attempts ?? 1)) return;
    await this.db
      .update(meetings)
      .set({ status: 'failed', errorMessage: err.message.slice(0, 1000) })
      .where(eq(meetings.id, job.data.meetingId));
  }
}
