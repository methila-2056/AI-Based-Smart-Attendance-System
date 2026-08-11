/** Base URL for API calls. Empty in dev (Vite proxy), full URL in production. */
const API_BASE = import.meta.env.VITE_API_BASE ?? ''

const TOKEN_KEY = 'sac_token'

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null): void {
  if (token) {
    sessionStorage.setItem(TOKEN_KEY, token)
  } else {
    sessionStorage.removeItem(TOKEN_KEY)
  }
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = 'ApiError'
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) ?? {}),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(API_BASE + path, { ...options, headers })

  if (res.status === 401) {
    clearToken()
    window.dispatchEvent(new Event('auth:unauthorized'))
  }

  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`
    try {
      const body = await res.json()
      if (body?.message) message = body.message
    } catch {
      /* ignore parse errors */
    }
    throw new ApiError(res.status, message)
  }

  if (res.status === 204) {
    return undefined as T
  }
  return (await res.json()) as T
}

export const get = <T>(path: string): Promise<T> => api<T>(path)
export const post = <T>(path: string, body?: unknown): Promise<T> =>
  api<T>(path, { method: 'POST', body: body == null ? undefined : JSON.stringify(body) })
export const put = <T>(path: string, body?: unknown): Promise<T> =>
  api<T>(path, { method: 'PUT', body: body == null ? undefined : JSON.stringify(body) })
export const del = <T>(path: string): Promise<T> => api<T>(path, { method: 'DELETE' })
