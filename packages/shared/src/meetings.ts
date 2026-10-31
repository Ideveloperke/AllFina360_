import { z } from 'zod';

export const MEETING_STATUSES = ['draft', 'ready', 'processing', 'completed', 'failed'] as const;
export type MeetingStatus = (typeof MEETING_STATUSES)[number];

export const MEETING_SOURCES = ['upload', 'transcript', 'bot'] as const;
export type MeetingSource = (typeof MEETING_SOURCES)[number];

export const ACTION_ITEM_OWNERS = ['advisor', 'client', 'other'] as const;
export type ActionItemOwner = (typeof ACTION_ITEM_OWNERS)[number];

export const ALLOWED_RECORDING_TYPES = [
  'audio/mpeg',
  'audio/mp4',
  'audio/wav',
  'audio/x-wav',
  'audio/webm',
  'audio/ogg',
  'video/mp4',
  'video/webm',
] as const;

export const createMeetingSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(200),
  clientId: z.string().uuid().optional(),
  scheduledAt: z.string().datetime().optional(),
  /** Paste a transcript directly instead of uploading a recording. */
  transcriptText: z.string().trim().min(20).max(500_000).optional(),
});
export type CreateMeetingInput = z.infer<typeof createMeetingSchema>;

export const recordingUploadSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  contentType: z.enum(ALLOWED_RECORDING_TYPES),
});
export type RecordingUploadInput = z.infer<typeof recordingUploadSchema>;

export const updateActionItemSchema = z.object({
  completed: z.boolean(),
});
export type UpdateActionItemInput = z.infer<typeof updateActionItemSchema>;

export interface MeetingListItemDto {
  id: string;
  title: string;
  status: MeetingStatus;
  source: MeetingSource;
  scheduledAt: string | null;
  createdAt: string;
  client: { id: string; firstName: string; lastName: string } | null;
}

export interface TranscriptSegmentDto {
  speaker: string;
  start: number;
  end: number;
  text: string;
}

export interface ActionItemDto {
  id: string;
  description: string;
  owner: ActionItemOwner;
  dueDate: string | null;
  completed: boolean;
}

export interface MeetingDetailDto extends MeetingListItemDto {
  errorMessage: string | null;
  transcript: { text: string; segments: TranscriptSegmentDto[] } | null;
  summary: {
    summary: string;
    keyPoints: string[];
    followUpEmailSubject: string;
    followUpEmailBody: string;
    complianceFlags: string[];
    model: string;
  } | null;
  actionItems: ActionItemDto[];
}
