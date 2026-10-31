import type { MeetingStatus } from '@allfina/shared';
import { cn } from '@/lib/utils';

const styles: Record<MeetingStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  ready: 'bg-sky-100 text-sky-800',
  processing: 'bg-amber-100 text-amber-800',
  completed: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-red-100 text-red-800',
};

const labels: Record<MeetingStatus, string> = {
  draft: 'Needs recording',
  ready: 'Ready',
  processing: 'Processing',
  completed: 'Completed',
  failed: 'Failed',
};

export function StatusBadge({ status }: { status: MeetingStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        styles[status],
      )}
    >
      {labels[status]}
    </span>
  );
}
