import { AppError } from '../../domain/errors'
import { config } from '../../config'

export const API_URL = (config.apiUrl || 'http://localhost:8000/api').replace(/\/+$/, '')

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(init?.headers ?? {}),
      },
    })
  } catch (error) {
    throw new AppError('No se pudo conectar con el backend.', error)
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
    )
  }

  if (!response.ok) {
    throw new AppError(
      String(record.mensaje ?? record.message ?? record.detail ?? response.statusText),
      data,
    )
  }

  return data as T
}