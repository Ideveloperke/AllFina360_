import { cn } from '@/lib/utils';

const fieldClass =
  'block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm shadow-xs ' +
  'placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 ' +
  'focus:ring-brand-500/20 disabled:bg-slate-100';

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldClass, 'h-10', className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(fieldClass, className)} {...props} />;
}

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(fieldClass, 'h-10', className)} {...props} />;
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : hint ? (
        <p className="text-sm text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
      {message}
    </div>
  );
}
