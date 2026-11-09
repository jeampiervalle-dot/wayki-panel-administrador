// ============================================================
// Datos: cliente HTTP único.
// Toda petición al backend pasa por aquí (un solo lugar para
// base URL, headers, parseo de JSON y manejo de errores).
// ============================================================

import { AppError } from '../domain/errors'

export interface HttpClient {
  get<T>(path: string): Promise<T>
  post<T>(path: string, body?: unknown): Promise<T>
  patch<T>(path: string, body?: unknown): Promise<T>
  delete<T>(path: string): Promise<T>
}

export function createHttpClient(baseUrl: string): HttpClient {
  const base = baseUrl.replace(/\/$/, '')

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    if (!base) {
      throw new AppError(
        'Configura VITE_API_URL en .env (URL de tu VPS, ej. http://IP:8080/api)',
      )
    }

    const url = path.startsWith('http')
      ? path
      : `${base}${path.startsWith('/') ? '' : '/'}${path}`

    const headers = new Headers(init.headers)
    if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json')

    let response: Response
    try {
      response = await fetch(url, { ...init, headers })
    } catch (error) {
      throw new AppError(`No se pudo conectar con ${base}`, error)
    }

    const text = await response.text()
    const data = parseBody(text)

    if (!response.ok) {
      throw new AppError(extractMessage(data, response.status))
    }

    return data as T
  }

  return {
    get: (path) => request(path),
    post: (path, body) =>
      request(path, {
        method: 'POST',
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    patch: (path, body) =>
      request(path, {
        method: 'PATCH',
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
    delete: (path) => request(path, { method: 'DELETE' }),
  }
}

function parseBody(text: string): unknown {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function extractMessage(data: unknown, status: number): string {
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>
    const message = record.message ?? record.mensaje ?? record.error
    if (typeof message === 'string' && message) return message
    if (message != null) return JSON.stringify(message)
  }
  if (typeof data === 'string' && data) return data
  return `Error ${status}`
}
