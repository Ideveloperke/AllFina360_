'use client';

import {
  ALLOWED_RECORDING_TYPES,
  type ClientDto,
  type CreateMeetingInput,
  type RecordingUploadInput,
} from '@allfina/shared';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FileAudio, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { Field, FormError, Input, Select, Textarea } from '@/components/ui/form';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

type Mode = 'upload' | 'transcript';

export default function NewMeetingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<Mode>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<string | null>(null);

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: () => api<ClientDto[]>('/clients'),
  });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const scheduled = String(form.get('scheduledAt') || '');
    const body: CreateMeetingInput = {
      title: String(form.get('title')),
      clientId: String(form.get('clientId') || '') || undefined,
      scheduledAt: scheduled ? new Date(scheduled).toISOString() : undefined,
      transcriptText: mode === 'transcript' ? String(form.get('transcriptText') || '') : undefined,
    };
    if (mode === 'upload' && !file) {
      setError('Choose a recording to upload.');
      return;
    }

    setError(null);
    try {
      setStep('Creating meeting…');
      const { id } = await api<{ id: string }>('/meetings', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      if (mode === 'upload' && file) {
        setStep('Uploading recording…');
        const uploadBody: RecordingUploadInput = {
          fileName: file.name,
          contentType: file.type as RecordingUploadInput['contentType'],
        };
        const { uploadUrl } = await api<{ uploadUrl: string }>(`/meetings/${id}/recording-upload`, {
          method: 'POST',
          body: JSON.stringify(uploadBody),
        });
        // The recording goes straight to object storage, not through the API.
        const put = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'content-type': file.type },
        });
        if (!put.ok) throw new Error(`Upload failed (${put.status})`);

        setStep('Starting analysis…');
        await api(`/meetings/${id}/process`, { method: 'POST' });
      }

      await queryClient.invalidateQueries({ queryKey: ['meetings'] });
      router.push(`/meetings/${id}`);
    } catch (err) {
      setError((err as Error).message);
      setStep(null);
    }
  }

  return (
    <>
      <PageHeader title="New meeting" />
      <Card>
        <CardBody>
          <form onSubmit={onSubmit} className="space-y-5">
            <FormError message={error} />
            <Field label="Title" htmlFor="title">
              <Input id="title" name="title" placeholder="Annual portfolio review" required />
            </Field>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Client" htmlFor="clientId">
                <Select id="clientId" name="clientId" defaultValue="">
                  <option value="">No client</option>
                  {clients?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Meeting date" htmlFor="scheduledAt">
                <Input id="scheduledAt" name="scheduledAt" type="datetime-local" />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ModeButton
                active={mode === 'upload'}
                onClick={() => setMode('upload')}
                icon={<FileAudio className="size-5" />}
                title="Upload recording"
                description="Audio or video file"
              />
              <ModeButton
                active={mode === 'transcript'}
                onClick={() => setMode('transcript')}
                icon={<FileText className="size-5" />}
                title="Paste transcript"
                description="From Zoom, Teams, etc."
              />
            </div>

            {mode === 'upload' ? (
              <Field label="Recording" htmlFor="recording" hint="MP3, M4A, WAV, WebM, OGG or MP4.">
                <Input
                  id="recording"
                  type="file"
                  accept={ALLOWED_RECORDING_TYPES.join(',')}
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  className="h-auto py-1.5 file:mr-3 file:rounded file:border-0 file:bg-slate-100 file:px-3 file:py-1 file:text-sm"
                />
              </Field>
            ) : (
              <Field label="Transcript" htmlFor="transcriptText">
                <Textarea
                  id="transcriptText"
                  name="transcriptText"
                  rows={12}
                  minLength={20}
                  required
                  placeholder="Advisor: Thanks for coming in today…"
                />
              </Field>
            )}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={step !== null}>
                {step ?? 'Create and analyze'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </>
  );
}

function ModeButton(props: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      aria-pressed={props.active}
      className={cn(
        'flex items-center gap-3 rounded-lg border p-4 text-left transition-colors',
        props.active
          ? 'border-brand-500 bg-brand-50 text-brand-900'
          : 'border-slate-200 hover:border-slate-300',
      )}
    >
      {props.icon}
      <span>
        <span className="block text-sm font-medium">{props.title}</span>
        <span className="block text-xs text-slate-500">{props.description}</span>
      </span>
    </button>
  );
}
