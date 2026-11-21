// ============================================================
// Composicion: repositorios HTTP contra el backend real.
// ============================================================

import { createLocalSessionStore } from '../data/sessionStore'
import {
  createHttpAuthRepository,
  createHttpEstadoRepository,
  createHttpLineasRepository,
  createHttpSolicitudesRepository,
  createHttpUnidadesRepository,
  createHttpUsuariosRepository,
} from '../data/http/repositories'
import type {
  AuthRepository,
  EstadoRepository,
  LineasRepository,
  SessionStore,
  UnidadesRepository,
  UsuariosRepository,
} from '../domain/ports'
import type { SolicitudesRepoLocal } from '../data/mock/memoryRepositories'

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
    auth: createHttpAuthRepository(),
    usuarios: createHttpUsuariosRepository(),
    solicitudes: createHttpSolicitudesRepository(),
    lineas: createHttpLineasRepository(),
    unidades: createHttpUnidadesRepository(),
    estado: createHttpEstadoRepository(),
    sessionStore: createLocalSessionStore(),
  }
}