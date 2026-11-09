// ============================================================
// Dominio: errores de aplicación y normalización de mensajes.
// ============================================================

export class AppError extends Error {
  readonly original?: unknown

  constructor(message: string, original?: unknown) {
    super(message)
    this.name = 'AppError'
    this.original = original
  }
}

export function toErrorMessage(error: unknown, fallback = 'Ocurrió un error inesperado'): string {
  if (error instanceof Error && error.message) return error.message
  if (typeof error === 'string' && error.trim()) return error
  return fallback
}
