'use client';

import type { ClientDto, CreateClientInput } from '@allfina/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Field, FormError, Input, Textarea } from '@/components/ui/form';
import { api, ApiError } from '@/lib/api';

export default function ClientsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['clients'],
    queryFn: () => api<ClientDto[]>('/clients'),
  });

  const create = useMutation({
    mutationFn: (input: CreateClientInput) =>
      api<ClientDto>('/clients', { method: 'POST', body: JSON.stringify(input) }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['clients'] });
      setShowForm(false);
    },
  });

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    create.mutate({
      firstName: String(f.get('firstName')),
      lastName: String(f.get('lastName')),
      email: String(f.get('email') || '') || undefined,
      phone: String(f.get('phone') || '') || undefined,
      notes: String(f.get('notes') || '') || undefined,
    });
  }

  const fieldErrors = create.error instanceof ApiError ? create.error.fieldErrors : undefined;

  return (
    <>
      <PageHeader
        title="Clients"
        action={
          !showForm && (
            <Button onClick={() => setShowForm(true)}>
              <Plus className="size-4" aria-hidden /> Add client
            </Button>
          )
        }
      />

      {showForm && (
        <Card className="mb-6">
          <CardHeader
            title="New client"
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowForm(false)}
                aria-label="Close"
              >
                <X className="size-4" />
              </Button>
            }
          />
          <CardBody>
            <form onSubmit={onSubmit} className="space-y-4">
              <FormError message={create.error?.message} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="First name" htmlFor="firstName" error={fieldErrors?.firstName?.[0]}>
                  <Input id="firstName" name="firstName" required />
                </Field>
                <Field label="Last name" htmlFor="lastName" error={fieldErrors?.lastName?.[0]}>
                  <Input id="lastName" name="lastName" required />
                </Field>
                <Field label="Email" htmlFor="email" error={fieldErrors?.email?.[0]}>
                  <Input id="email" name="email" type="email" />
                </Field>
                <Field label="Phone" htmlFor="phone">
                  <Input id="phone" name="phone" type="tel" />
                </Field>
              </div>
              <Field label="Notes" htmlFor="notes">
                <Textarea id="notes" name="notes" rows={3} />
              </Field>
              <div className="flex justify-end">
                <Button type="submit" disabled={create.isPending}>
                  {create.isPending ? 'Saving…' : 'Save client'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      <Card>
        {isLoading ? (
          <p className="px-5 py-10 text-center text-sm text-slate-500">Loading…</p>
        ) : error ? (
          <p className="px-5 py-10 text-center text-sm text-red-600">{error.message}</p>
        ) : !data?.length ? (
          <p className="px-5 py-14 text-center text-sm text-slate-500">No clients yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Phone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((c) => (
                <tr key={c.id}>
                  <td className="px-5 py-3 font-medium">
                    {c.firstName} {c.lastName}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{c.email ?? '—'}</td>
                  <td className="px-5 py-3 text-slate-600">{c.phone ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </>
  );
}
