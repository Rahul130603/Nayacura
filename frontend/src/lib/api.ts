const API_BASE = import.meta.env.VITE_API_URL || '/api';
export type ChatLanguage = 'en' | 'ta' | 'tanglish';

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;

  constructor(message: string, status = 500, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

let csrfPromise: Promise<void> | null = null;

function readCookie(name: string) {
  return document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`))
    ?.split('=')[1];
}

export async function ensureCsrf() {
  if (readCookie('nayacura_csrf')) return;
  if (!csrfPromise) {
    csrfPromise = fetch(`${API_BASE}/auth/csrf`, { credentials: 'include' })
      .then(() => undefined)
      .finally(() => {
        csrfPromise = null;
      });
  }
  await csrfPromise;
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  raw?: boolean;
};

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) await ensureCsrf();

  const headers = new Headers(options.headers);
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  if (options.body !== undefined && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrf = readCookie('nayacura_csrf');
    if (csrf) headers.set('X-CSRF-Token', decodeURIComponent(csrf));
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
    body:
      options.body === undefined
        ? undefined
        : options.body instanceof FormData
          ? options.body
          : JSON.stringify(options.body),
  });

  if (!res.ok) {
    let error: { message?: string; code?: string; details?: unknown } = {};
    try {
      error = await res.json();
    } catch {
      /* non-JSON error */
    }
    throw new ApiError(
      error.message || `Something went wrong (${res.status}). Please try again.`,
      res.status,
      error.code,
      error.details,
    );
  }

  if (res.status === 204) return undefined as T;
  if (options.raw) return res as T;
  return (await res.json()) as T;
}

export async function streamAi(
  payload: { message: string; conversationId?: string | null; language?: ChatLanguage; consent: boolean },
  onToken: (token: string) => void,
  signal?: AbortSignal,
) {
  await ensureCsrf();
  const csrf = readCookie('nayacura_csrf');
  const res = await fetch(`${API_BASE}/ai/chat`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(csrf ? { 'X-CSRF-Token': decodeURIComponent(csrf) } : {}),
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!res.ok || !res.body) {
    let message = 'Naya AI is unavailable right now.';
    try {
      const data = await res.json();
      message = data.message || message;
    } catch {
      /* ignore */
    }
    throw new ApiError(message, res.status);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let conversationId: string | undefined;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop() || '';
    for (const event of events) {
      const line = event.split('\n').find((l) => l.startsWith('data: '));
      if (!line) continue;
      const data = JSON.parse(line.slice(6));
      if (data.type === 'meta' && data.conversationId) conversationId = data.conversationId;
      if (data.type === 'token') onToken(data.token);
      if (data.type === 'error') throw new ApiError(data.message || 'Naya AI is unavailable.', 502);
    }
  }
  return conversationId;
}

export async function uploadMedicalDocument(
  file: File,
  category: 'REPORT' | 'PRESCRIPTION' | 'REFERRAL' | 'OTHER' = 'OTHER',
) {
  await ensureCsrf();
  const csrf = readCookie('nayacura_csrf');
  const res = await fetch(`${API_BASE}/patient/documents`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': file.type,
      'X-CSRF-Token': csrf ? decodeURIComponent(csrf) : '',
      'X-File-Name': encodeURIComponent(file.name),
      'X-File-Category': category,
    },
    body: file,
  });
  if (!res.ok) {
    let message = 'The document could not be uploaded.';
    try {
      const data = await res.json();
      message = data.message || message;
    } catch {
      /* ignore */
    }
    throw new ApiError(message, res.status);
  }
  return (await res.json()) as {
    document: {
      id: string;
      fileName: string;
      mimeType: string;
      sizeBytes: number;
      category: string;
      createdAt: string;
    };
    message: string;
  };
}

export { API_BASE };
