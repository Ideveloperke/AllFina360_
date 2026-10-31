import { Inject, Injectable } from '@nestjs/common';
import { ENV, type Env } from '../config/env';

export interface TranscriptionResult {
  text: string;
  segments: { speaker: string; start: number; end: number; text: string }[];
  duration_seconds: number | null;
  provider: string;
}

export interface MeetingAnalysisRequest {
  transcript: string;
  meeting_title: string;
  client_name?: string;
  advisor_name?: string;
}

export interface MeetingAnalysisResult {
  summary: string;
  key_points: string[];
  action_items: {
    description: string;
    owner: 'advisor' | 'client' | 'other';
    due_date: string | null;
  }[];
  follow_up_email: { subject: string; body: string };
  compliance_flags: string[];
  model: string;
}

/** HTTP client for the internal Python AI service (apps/ai-service). */
@Injectable()
export class AiClientService {
  constructor(@Inject(ENV) private readonly env: Env) {}

  transcribe(audioUrl: string): Promise<TranscriptionResult> {
    return this.post('/v1/transcriptions', { audio_url: audioUrl });
  }

  analyzeMeeting(body: MeetingAnalysisRequest): Promise<MeetingAnalysisResult> {
    return this.post('/v1/meeting-analyses', body);
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(new URL(path, this.env.AI_SERVICE_URL), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-internal-api-key': this.env.AI_SERVICE_API_KEY,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15 * 60 * 1000),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`AI service ${path} failed (${res.status}): ${detail.slice(0, 500)}`);
    }
    return (await res.json()) as T;
  }
}
