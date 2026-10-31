export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message);
  }
}

/** Fetch wrapper for the AllFina API (same-origin, cookie session). */
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      ...init.headers,
    },
  });

  if (res.status === 401 && typeof window !== 'undefined') {
    window.location.href = `/sign-in?next=${encodeURIComponent(window.location.pathname)}`;
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as {
      message?: string | string[];
      errors?: Record<string, string[]>;
    } | null;
    const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message;
    throw new ApiError(res.status, message ?? `Request failed (${res.status})`, body?.errors);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
