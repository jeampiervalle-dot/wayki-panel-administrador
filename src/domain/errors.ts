// ============================================================
// Dominio: errores de aplicación y normalización de mensajes.
// ============================================================

export class AppError extends Error {
  readonly original?: unknown
  readonly status?: number

  constructor(message: string, original?: unknown, status?: number) {
    super(message)
    this.name = 'AppError'
    this.original = original
    this.status = status
  }
}

export function toErrorMessage(error: unknown, fallback = 'Ocurrió un error inesperado'): string {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'string' && error.trim()) return error
  return fallback
}
