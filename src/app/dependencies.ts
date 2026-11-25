// ============================================================
// Composicion: repositorios HTTP contra el backend real.
// ============================================================

import { createLocalSessionStore } from '../data/sessionStore'
import {
  createHttpAuthRepository,
  createHttpEstadoRepository,
  createHttpLineasRepository,
  createHttpSolicitudesRepository,
  createHttpTurnosRepository,
  createHttpUnidadesRepository,
  createHttpUsuariosRepository,
} from '../data/http/repositories'
import { createBackendRutasRepository } from '../data/http/backendRutasRepositories'
import type {
  AuthRepository,
  EstadoRepository,
  LineasRepository,
  RutasMapaRepository,
  SessionStore,
  TurnosRepository,
  UnidadesRepository,
  UsuariosRepository,
} from '../domain/ports'
import type { SolicitudesRepoLocal } from '../data/mock/memoryRepositories'

export interface Dependencies {
  auth: AuthRepository
  usuarios: UsuariosRepository
  solicitudes: SolicitudesRepoLocal
  lineas: LineasRepository
  rutasMapa: RutasMapaRepository
  unidades: UnidadesRepository
  turnos: TurnosRepository
  estado: EstadoRepository
  sessionStore: SessionStore
}

export function createDependencies(): Dependencies {
  return {
    auth: createHttpAuthRepository(),
    usuarios: createHttpUsuariosRepository(),
    solicitudes: createHttpSolicitudesRepository(),
    lineas: createHttpLineasRepository(),
    rutasMapa: createBackendRutasRepository(),
    unidades: createHttpUnidadesRepository(),
    turnos: createHttpTurnosRepository(),
    estado: createHttpEstadoRepository(),
    sessionStore: createLocalSessionStore(),
  }
}