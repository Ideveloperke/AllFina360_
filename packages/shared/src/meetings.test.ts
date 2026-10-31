import { describe, expect, it } from 'vitest';
import { createMeetingSchema, recordingUploadSchema } from './meetings';

describe('createMeetingSchema', () => {
  it('accepts a minimal meeting', () => {
    expect(createMeetingSchema.parse({ title: 'Annual review' })).toEqual({
      title: 'Annual review',
    });
  });

  it('rejects an empty title', () => {
    expect(createMeetingSchema.safeParse({ title: '   ' }).success).toBe(false);
  });

  it('rejects a non-uuid clientId', () => {
    expect(createMeetingSchema.safeParse({ title: 'x', clientId: '123' }).success).toBe(false);
  });
});

describe('recordingUploadSchema', () => {
  it('rejects unsupported content types', () => {
    expect(
      recordingUploadSchema.safeParse({
        fileName: 'a.exe',
        contentType: 'application/x-msdownload',
      }).success,
    ).toBe(false);
  });
});
