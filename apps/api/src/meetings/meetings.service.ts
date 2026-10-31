import {
  actionItems,
  clients,
  meetings,
  meetingSummaries,
  transcripts,
  type Database,
} from '@allfina/db';
import type {
  CreateMeetingInput,
  MeetingDetailDto,
  MeetingListItemDto,
  RecordingUploadInput,
} from '@allfina/shared';
import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Queue } from 'bullmq';
import { and, asc, desc, eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { AuditService } from '../audit/audit.service';
import type { AuthUser } from '../auth/auth.guard';
import { DB } from '../database/database.module';
import { MEETING_QUEUE, type ProcessMeetingJob } from '../queue/queue.module';
import { StorageService } from '../storage/storage.service';

const listColumns = {
  id: meetings.id,
  title: meetings.title,
  status: meetings.status,
  source: meetings.source,
  scheduledAt: meetings.scheduledAt,
  createdAt: meetings.createdAt,
  clientId: clients.id,
  clientFirstName: clients.firstName,
  clientLastName: clients.lastName,
};

type ListRow = {
  id: string;
  title: string;
  status: MeetingListItemDto['status'];
  source: MeetingListItemDto['source'];
  scheduledAt: Date | null;
  createdAt: Date;
  clientId: string | null;
  clientFirstName: string | null;
  clientLastName: string | null;
};

function toListItem(row: ListRow): MeetingListItemDto {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    source: row.source,
    scheduledAt: row.scheduledAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    client: row.clientId
      ? { id: row.clientId, firstName: row.clientFirstName!, lastName: row.clientLastName! }
      : null,
  };
}

@Injectable()
export class MeetingsService {
  constructor(
    @Inject(DB) private readonly db: Database,
    @InjectQueue(MEETING_QUEUE) private readonly queue: Queue<ProcessMeetingJob>,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
  ) {}

  async list(user: AuthUser): Promise<MeetingListItemDto[]> {
    const rows = await this.db
      .select(listColumns)
      .from(meetings)
      .leftJoin(clients, eq(clients.id, meetings.clientId))
      .where(eq(meetings.firmId, user.firmId))
      .orderBy(desc(meetings.createdAt))
      .limit(200);
    return rows.map(toListItem);
  }

  async get(user: AuthUser, id: string): Promise<MeetingDetailDto> {
    const [row] = await this.db
      .select({ ...listColumns, errorMessage: meetings.errorMessage })
      .from(meetings)
      .leftJoin(clients, eq(clients.id, meetings.clientId))
      .where(and(eq(meetings.firmId, user.firmId), eq(meetings.id, id)));
    if (!row) throw new NotFoundException('Meeting not found');

    const [[transcript], [summary], items] = await Promise.all([
      this.db.select().from(transcripts).where(eq(transcripts.meetingId, id)),
      this.db.select().from(meetingSummaries).where(eq(meetingSummaries.meetingId, id)),
      this.db
        .select()
        .from(actionItems)
        .where(eq(actionItems.meetingId, id))
        .orderBy(asc(actionItems.createdAt)),
    ]);

    await this.audit.record({
      firmId: user.firmId,
      actorId: user.id,
      action: 'meeting.viewed',
      entityType: 'meeting',
      entityId: id,
    });

    return {
      ...toListItem(row),
      errorMessage: row.errorMessage,
      transcript: transcript ? { text: transcript.text, segments: transcript.segments } : null,
      summary: summary
        ? {
            summary: summary.summary,
            keyPoints: summary.keyPoints,
            followUpEmailSubject: summary.followUpEmailSubject,
            followUpEmailBody: summary.followUpEmailBody,
            complianceFlags: summary.complianceFlags,
            model: summary.model,
          }
        : null,
      actionItems: items.map((i) => ({
        id: i.id,
        description: i.description,
        owner: i.owner,
        dueDate: i.dueDate,
        completed: i.completed,
      })),
    };
  }

  async create(user: AuthUser, input: CreateMeetingInput) {
    if (input.clientId) await this.assertClientInFirm(user, input.clientId);

    const meeting = await this.db.transaction(async (tx) => {
      const [created] = await tx
        .insert(meetings)
        .values({
          firmId: user.firmId,
          advisorId: user.id,
          clientId: input.clientId,
          title: input.title,
          scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
          source: input.transcriptText ? 'transcript' : 'upload',
          status: input.transcriptText ? 'ready' : 'draft',
        })
        .returning();
      if (input.transcriptText) {
        await tx.insert(transcripts).values({
          meetingId: created!.id,
          text: input.transcriptText,
          provider: 'manual',
        });
      }
      return created!;
    });

    await this.audit.record({
      firmId: user.firmId,
      actorId: user.id,
      action: 'meeting.created',
      entityType: 'meeting',
      entityId: meeting.id,
      metadata: { source: meeting.source },
    });

    // Pasted transcripts can be analyzed straight away.
    if (input.transcriptText) await this.enqueue(user, meeting.id);
    return { id: meeting.id };
  }

  /** Returns a presigned URL; the browser PUTs the recording directly to object storage. */
  async createRecordingUpload(user: AuthUser, id: string, input: RecordingUploadInput) {
    const meeting = await this.findOwned(user, id);
    if (meeting.status === 'processing') {
      throw new ConflictException('Meeting is already being processed');
    }
    const ext = input.fileName.includes('.') ? input.fileName.split('.').pop() : 'bin';
    const key = `firms/${user.firmId}/meetings/${id}/${randomUUID()}.${ext}`;
    const uploadUrl = await this.storage.createUploadUrl(key, input.contentType);

    await this.db
      .update(meetings)
      .set({ recordingKey: key, status: 'ready', errorMessage: null })
      .where(eq(meetings.id, id));
    return { uploadUrl, key };
  }

  /** Queue transcription (if needed) and AI analysis. */
  async process(user: AuthUser, id: string) {
    const meeting = await this.findOwned(user, id);
    if (meeting.status === 'processing') {
      throw new ConflictException('Meeting is already being processed');
    }
    const [transcript] = await this.db
      .select({ id: transcripts.id })
      .from(transcripts)
      .where(eq(transcripts.meetingId, id));
    if (!meeting.recordingKey && !transcript) {
      throw new BadRequestException('Upload a recording or paste a transcript first');
    }
    await this.enqueue(user, id);
    return { id, status: 'processing' as const };
  }

  async updateActionItem(user: AuthUser, meetingId: string, itemId: string, completed: boolean) {
    const [item] = await this.db
      .update(actionItems)
      .set({ completed })
      .where(
        and(
          eq(actionItems.firmId, user.firmId),
          eq(actionItems.meetingId, meetingId),
          eq(actionItems.id, itemId),
        ),
      )
      .returning({ id: actionItems.id, completed: actionItems.completed });
    if (!item) throw new NotFoundException('Action item not found');
    return item;
  }

  async remove(user: AuthUser, id: string) {
    const [deleted] = await this.db
      .delete(meetings)
      .where(and(eq(meetings.firmId, user.firmId), eq(meetings.id, id)))
      .returning({ id: meetings.id });
    if (!deleted) throw new NotFoundException('Meeting not found');
    await this.audit.record({
      firmId: user.firmId,
      actorId: user.id,
      action: 'meeting.deleted',
      entityType: 'meeting',
      entityId: id,
    });
  }

  private async enqueue(user: AuthUser, meetingId: string) {
    await this.db
      .update(meetings)
      .set({ status: 'processing', errorMessage: null })
      .where(eq(meetings.id, meetingId));
    // Callers reject meetings already in 'processing', so there is one active job per meeting.
    await this.queue.add('process', { meetingId, firmId: user.firmId });
    await this.audit.record({
      firmId: user.firmId,
      actorId: user.id,
      action: 'meeting.processing_requested',
      entityType: 'meeting',
      entityId: meetingId,
    });
  }

  private async findOwned(user: AuthUser, id: string) {
    const [meeting] = await this.db
      .select()
      .from(meetings)
      .where(and(eq(meetings.firmId, user.firmId), eq(meetings.id, id)));
    if (!meeting) throw new NotFoundException('Meeting not found');
    return meeting;
  }

  private async assertClientInFirm(user: AuthUser, clientId: string) {
    const [client] = await this.db
      .select({ id: clients.id })
      .from(clients)
      .where(and(eq(clients.firmId, user.firmId), eq(clients.id, clientId)));
    if (!client) throw new BadRequestException('Client not found');
  }
}
