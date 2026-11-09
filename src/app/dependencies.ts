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
import { createLocalSessionStore } from '../data/sessionStore'
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
  lineas: LineasRepository
  unidades: UnidadesRepository
  estado: EstadoRepository
  sessionStore: SessionStore
}

export function createDependencies(): Dependencies {
  const http = createHttpClient(config.apiUrl)

  return {
    auth: createAuthRepository(http),
    usuarios: createUsuariosRepository(http),
    lineas: createLineasRepository(http),
    unidades: createUnidadesRepository(http),
    estado: createEstadoRepository(http),
    sessionStore: createLocalSessionStore(),
  }
}
