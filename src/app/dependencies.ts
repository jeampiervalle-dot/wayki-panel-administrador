// ============================================================
// Composición: se eligen las implementaciones locales (memoria +
// localStorage). Aquí está el único punto que habría que cambiar
// si algún día se conecta un backend real.
// ============================================================

import { createLocalSessionStore } from '../data/sessionStore'
import {
  createMemoryAuthRepository,
  createMemoryEstadoRepository,
  createMemoryLineasRepository,
  createMemorySolicitudesRepository,
  createMemoryUnidadesRepository,
  createMemoryUsuariosRepository,
  type SolicitudesRepoLocal,
} from '../data/mock/memoryRepositories'
import type {
  AuthRepository,
  EstadoRepository,
  LineasRepository,
  SessionStore,
  UnidadesRepository,
  UsuariosRepository,
} from '../domain/ports'

export interface Dependencies {
  auth: AuthRepository
  usuarios: UsuariosRepository
  solicitudes: SolicitudesRepoLocal
  lineas: LineasRepository
  unidades: UnidadesRepository
  estado: EstadoRepository
  sessionStore: SessionStore
}

export function createDependencies(): Dependencies {
  return {
    auth: createMemoryAuthRepository(),
    usuarios: createMemoryUsuariosRepository(),
    solicitudes: createMemorySolicitudesRepository(),
    lineas: createMemoryLineasRepository(),
    unidades: createMemoryUnidadesRepository(),
    estado: createMemoryEstadoRepository(),
    sessionStore: createLocalSessionStore(),
  }
}
