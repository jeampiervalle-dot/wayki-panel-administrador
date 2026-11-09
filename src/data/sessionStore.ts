// ============================================================
// Datos: persistencia local de la sesión.
// Aísla localStorage del resto de la aplicación.
// ============================================================

import type { Sesion } from '../domain/models'
import type { SessionStore } from '../domain/ports'
import { toUsuario } from './mappers'

const SESSION_KEY = 'wayki_admin_session'

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

function parseSesion(value: unknown): Sesion | null {
  if (!value || typeof value !== 'object') return null

  const record = value as Record<string, unknown>
  // Acepta el formato nuevo ({ usuario }) y el antiguo ({ user }).
  const usuarioRaw = record.usuario ?? record.user
  if (!usuarioRaw || typeof usuarioRaw !== 'object') return null

  return {
    usuario: toUsuario(usuarioRaw),
    token: typeof record.token === 'string' ? record.token : undefined,
  }
}

export function createLocalSessionStore(
  storage: StorageLike = window.localStorage,
): SessionStore {
  return {
    leer() {
      try {
        const raw = storage.getItem(SESSION_KEY)
        if (!raw) return null
        const parsed: unknown = JSON.parse(raw)
        return parseSesion(parsed)
      } catch {
        return null
      }
    },
    guardar(sesion) {
      try {
        storage.setItem(SESSION_KEY, JSON.stringify(sesion))
      } catch {
        // Almacenamiento no disponible (modo privado, cuota, etc.).
      }
    },
    limpiar() {
      try {
        storage.removeItem(SESSION_KEY)
      } catch {
        // Almacenamiento no disponible.
      }
    },
  }
}
