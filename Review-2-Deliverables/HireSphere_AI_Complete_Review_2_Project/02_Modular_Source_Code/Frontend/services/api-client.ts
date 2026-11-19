'use client'

// ============================================================
// HireSphere AI — same-origin API client
// ------------------------------------------------------------
// All backend responses use the envelope:
//   success: { ok: true, data }
//   failure: { ok: false, error: { code, message, details? } }
// apiFetch unwraps `data` and throws Error(message) on failure.
//
// Session transport is dual-mode:
//   • httpOnly `hs_token` cookie (same-origin, top-level browsing)
//   • Authorization: Bearer <token> header (preview-panel iframe,
//     where browsers block SameSite=Lax cookies). The token is
//     returned by /api/auth/login and /api/auth/register and kept
//     in localStorage below.
// ============================================================

const TOKEN_KEY = 'hs_session_token'

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function getToken(): string | null {
  if (!isBrowser()) return null
  try {
    return window.localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token: string | null): void {
  if (!isBrowser()) return
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token)
    else window.localStorage.removeItem(TOKEN_KEY)
  } catch {
    // storage unavailable (private mode) — cookie auth still works
  }
}

/** Authorization header value for raw transports (XHR uploads etc.). */
export function authHeader(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export class ApiError extends Error {
  code?: string
  status?: number
  details?: unknown

  constructor(message: string, code?: string, status?: number, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.details = details
  }
}

type Envelope<T> = { ok: true; data: T } | { ok: false; error: { code?: string; message: string; details?: unknown } }

export type ApiInit = Omit<RequestInit, 'body'> & { body?: unknown; headers?: HeadersInit }

export async function apiFetch<T>(
  path: string,
  init?: ApiInit,
): Promise<T> {
  const headers: Record<string, string> = {
    ...authHeader(),
    ...(init?.headers as Record<string, string> | undefined),
  }
  let body = init?.body

  if (body !== undefined && body !== null && !(body instanceof FormData) && typeof body !== 'string') {
    headers['Content-Type'] = headers['Content-Type'] ?? 'application/json'
    body = JSON.stringify(body)
  }

  let res: Response
  try {
    res = await fetch(path, {
      ...init,
      body: body as BodyInit | undefined,
      headers,
      credentials: 'same-origin',
    })
  } catch {
    // Network unreachable (server restarting, offline, …)
    throw new ApiError('Cannot reach the server. Please check your connection and try again.', 'NETWORK_ERROR')
  }

  let json: Envelope<T> | null = null
  try {
    json = (await res.json()) as Envelope<T>
  } catch {
    // non-JSON body (e.g. empty 204, HTML error page)
  }

  if (!res.ok || (json && json.ok === false)) {
    const err = json && json.ok === false ? json.error : undefined
    throw new ApiError(
      err?.message || `Request failed with status ${res.status}.`,
      err?.code,
      res.status,
      err?.details,
    )
  }

  if (json && typeof json === 'object' && 'ok' in json && 'data' in json) {
    return (json as { ok: true; data: T }).data
  }
  // Fallback: endpoint didn't use the envelope (file downloads etc.)
  return json as unknown as T
}

export const get = <T,>(path: string, init?: ApiInit) => apiFetch<T>(path, { ...init, method: 'GET' })

export const post = <T,>(path: string, body?: unknown, init?: ApiInit) =>
  apiFetch<T>(path, { ...init, method: 'POST', body })

export const patch = <T,>(path: string, body?: unknown, init?: ApiInit) =>
  apiFetch<T>(path, { ...init, method: 'PATCH', body })

export const del = <T,>(path: string, init?: RequestInit) => apiFetch<T>(path, { ...init, method: 'DELETE' })

// ------------------------------------------------------------
// Shared list-envelope type used by paginated endpoints:
// { items, total, page, pageSize, totalPages }
// ------------------------------------------------------------
export type Paginated<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
