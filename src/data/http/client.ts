import { AppError } from '../../domain/errors'
import { config } from '../../config'

export const API_URL = (config.apiUrl || 'http://localhost:8000/api').replace(/\/+$/, '')

const SESSION_KEY = 'react_interfaz_panel_session'

let authToken: string | null = null
let alNoAutorizado: (() => void) | null = null

/** Se registra desde useAuth para cerrar la sesión si el token expira. */
export function registrarAlNoAutorizado(callback: () => void): () => void {
  alNoAutorizado = callback
  return () => {
    if (alNoAutorizado === callback) alNoAutorizado = null
  }
}

function descartarSesion(): void {
  authToken = null
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // almacenamiento no disponible
  }
  alNoAutorizado?.()
}

function leerTokenDeSesion(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { token?: string }
    return typeof parsed.token === 'string' ? parsed.token : null
  } catch {
    return null
  }
}

authToken = leerTokenDeSesion()

export function setAuthToken(token: string | null): void {
  authToken = token
}

export async function request<T>(
  path: string,
  init?: RequestInit,
  baseUrl: string = API_URL,
): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        // Content-Type solo con cuerpo; en GET provoca un preflight que
        // algunos APIs públicos (SmartBus) no responden correctamente.
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(init?.headers ?? {}),
      },
    })
  } catch (error) {
    throw new AppError('No se pudo conectar con el backend.', error)
  }

  // Un 401 significa que la sesión dejó de servir: se limpia el token y la
  // sesión persistida, y se avisa a la app para volver al login.
  if (response.status === 401 && path !== '/auth/login') {
    descartarSesion()
  }

  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  const record = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>
  if (record.exito === false || record.success === false) {
    throw new AppError(
      String(record.mensaje ?? record.message ?? record.detail ?? 'Error en la solicitud.'),
      data,
      response.status,
    )
  }

  if (!response.ok) {
    throw new AppError(
      String(record.mensaje ?? record.message ?? record.detail ?? response.statusText),
      data,
      response.status,
    )
  }

  return data as T
}
