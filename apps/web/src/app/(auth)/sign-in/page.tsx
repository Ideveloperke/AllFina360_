'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, FormError, Input } from '@/components/ui/form';
import { signIn } from '@/lib/auth-client';

function SignInForm() {
  const router = useRouter();
  const next = useSearchParams().get('next');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);
    setError(null);
    const { error } = await signIn.email({
      email: String(form.get('email')),
      password: String(form.get('password')),
    });
    setPending(false);
    if (error) {
      setError(error.message ?? 'Sign in failed');
      return;
    }
    // Only allow relative redirects to avoid open-redirects.
    router.replace(next?.startsWith('/') && !next.startsWith('//') ? next : '/meetings');
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <FormError message={error} />
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field label="Password" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}

export default function SignInPage() {
  return (
    <>
      <h1 className="mb-1 text-xl font-semibold">Sign in</h1>
      <p className="mb-6 text-sm text-slate-500">Welcome back to AllFina.</p>
      <Suspense>
        <SignInForm />
      </Suspense>
      <p className="mt-6 text-center text-sm text-slate-500">
        New to AllFina?{' '}
        <Link href="/sign-up" className="font-medium text-brand-600 hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
