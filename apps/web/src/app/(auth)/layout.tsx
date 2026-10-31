import { Logo } from '@/components/logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <div className="mb-8">
        <Logo />
      </div>
      <div className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-6 shadow-xs">
        {children}
      </div>
    </main>
  );
}
