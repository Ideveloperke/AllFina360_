'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, FormError, Input } from '@/components/ui/form';
import { signUp } from '@/lib/auth-client';

export default function SignUpPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);
    setError(null);
    const { error } = await signUp.email({
      name: String(form.get('name')),
      email: String(form.get('email')),
      password: String(form.get('password')),
    });
    setPending(false);
    if (error) {
      setError(error.message ?? 'Sign up failed');
      return;
    }
    router.replace('/meetings');
    router.refresh();
  }

  return (
    <>
      <h1 className="mb-1 text-xl font-semibold">Create your account</h1>
      <p className="mb-6 text-sm text-slate-500">A new practice workspace is created for you.</p>
      <form onSubmit={onSubmit} className="space-y-4">
        <FormError message={error} />
        <Field label="Full name" htmlFor="name">
          <Input id="name" name="name" autoComplete="name" required />
        </Field>
        <Field label="Work email" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </Field>
        <Field label="Password" htmlFor="password" hint="At least 10 characters.">
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={10}
            required
          />
        </Field>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link href="/sign-in" className="font-medium text-brand-600 hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
