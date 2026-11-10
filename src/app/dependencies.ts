// ============================================================
// Composición: único lugar donde se eligen las implementaciones
// concretas (HTTP + localStorage) que consumen los casos de uso.
// ============================================================

import { config } from '../config'
import { createHttpClient } from '../data/httpClient'
import { createAuthRepository } from '../data/repositories/httpAuthRepository'
import { createEstadoRepository } from '../data/repositories/httpEstadoRepository'
import { createLineasRepository } from '../data/repositories/httpLineasRepository'
import { createUnidadesRepository } from '../data/repositories/httpUnidadesRepository'
import { createUsuariosRepository } from '../data/repositories/httpUsuariosRepository'
import { createSolicitudesRepository } from '../data/repositories/httpSolicitudesRepository'
import { createLocalSessionStore } from '../data/sessionStore'
import type {
  AuthRepository,
  EstadoRepository,
  LineasRepository,
  SessionStore,
  SolicitudesRepository,
  UnidadesRepository,
  UsuariosRepository,
} from '../domain/ports'

export interface Dependencies {
  auth: AuthRepository
  usuarios: UsuariosRepository
  solicitudes: SolicitudesRepository
  lineas: LineasRepository
  unidades: UnidadesRepository
  estado: EstadoRepository
  sessionStore: SessionStore
}

export function createDependencies(): Dependencies {
  const sessionStore = createLocalSessionStore()
  const http = createHttpClient(config.apiUrl, () => sessionStore.leer()?.token)

  return {
    auth: createAuthRepository(http),
    usuarios: createUsuariosRepository(http),
    solicitudes: createSolicitudesRepository(http),
    lineas: createLineasRepository(http),
    unidades: createUnidadesRepository(http),
    estado: createEstadoRepository(http),
    sessionStore,
  }
}
