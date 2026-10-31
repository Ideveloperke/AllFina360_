'use client';

import { CalendarDays, LogOut, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from '@/components/logo';
import { signOut, useSession } from '@/lib/auth-client';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/meetings', label: 'Meetings', icon: CalendarDays },
  { href: '/clients', label: 'Clients', icon: Users },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  async function onSignOut() {
    await signOut();
    router.replace('/sign-in');
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="px-5 py-5">
          <Logo />
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {nav.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium',
                pathname.startsWith(href)
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
              )}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-200 p-3">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium">{session?.user.name ?? ' '}</p>
            <p className="truncate text-xs text-slate-500">{session?.user.email ?? ' '}</p>
          </div>
          <button
            onClick={onSignOut}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            <LogOut className="size-4" aria-hidden />
            Sign out
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-8 py-8">
        <div className="mx-auto max-w-5xl">{children}</div>
      </main>
    </div>
  );
}
