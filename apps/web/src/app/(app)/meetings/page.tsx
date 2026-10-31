'use client';

import type { MeetingListItemDto } from '@allfina/shared';
import { useQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function MeetingsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['meetings'],
    queryFn: () => api<MeetingListItemDto[]>('/meetings'),
    // Keep the list fresh while any meeting is still processing.
    refetchInterval: (q) => (q.state.data?.some((m) => m.status === 'processing') ? 5000 : false),
  });

  return (
    <>
      <PageHeader
        title="Meetings"
        description="Upload a recording or paste a transcript to get notes, tasks and a follow-up email."
        action={
          <Link
            href="/meetings/new"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Plus className="size-4" aria-hidden /> New meeting
          </Link>
        }
      />
      <Card>
        {isLoading ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">Loading…</p>
        ) : error ? (
          <p className="px-5 py-10 text-center text-sm text-red-600">{error.message}</p>
        ) : !data?.length ? (
          <div className="px-5 py-14 text-center">
            <p className="font-medium">No meetings yet</p>
            <p className="mt-1 text-sm text-slate-500">Create your first meeting to get started.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Meeting</th>
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <Link href={`/meetings/${m.id}`} className="font-medium hover:text-brand-700">
                      {m.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {m.client ? `${m.client.firstName} ${m.client.lastName}` : '—'}
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {formatDate(m.scheduledAt ?? m.createdAt)}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={m.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
