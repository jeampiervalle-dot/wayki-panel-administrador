// ============================================================
// Dominio: puertos (contratos) que implementa la capa de datos.
// La UI y los casos de uso dependen de estas interfaces,
// nunca de fetch ni de un backend concreto.
// ============================================================

import type {
  Credenciales,
  DatosLinea,
  DatosUnidad,
  Linea,
  NuevoUsuario,
  PuntoControl,
  Sesion,
  SolicitudRegistro,
  Unidad,
  Usuario,
} from './models'

export interface AuthRepository {
  iniciarSesion(credenciales: Credenciales): Promise<Sesion>
  registrar(datos: NuevoUsuario): Promise<void>
}

export interface UsuariosRepository {
  listar(): Promise<Usuario[]>
  actualizarRol(id: string, rol: string): Promise<void>
  eliminar(id: string): Promise<void>
}

export interface LineasRepository {
  listar(): Promise<Linea[]>
  obtener(id: number): Promise<Linea>
  crear(datos: DatosLinea): Promise<Linea>
  actualizar(id: number, datos: DatosLinea): Promise<Linea>
  eliminar(id: number): Promise<void>
  puntosControl(lineaId: number): Promise<PuntoControl[]>
}

export interface UnidadesRepository {
  listar(): Promise<Unidad[]>
  listarPorLinea(lineaId: number): Promise<Unidad[]>
  crear(datos: DatosUnidad): Promise<Unidad>
  actualizar(id: number, datos: DatosUnidad): Promise<Unidad>
  eliminar(id: number): Promise<void>
}

export interface EstadoRepository {
  consultar(): Promise<unknown>
}

export interface SolicitudesRepository {
  listar(): Promise<SolicitudRegistro[]>
  aprobar(id: number | string, usuarioAsignado?: string): Promise<SolicitudRegistro>
  rechazar(id: number | string): Promise<SolicitudRegistro>
}

export interface SessionStore {
  leer(): Sesion | null
  guardar(sesion: Sesion): void
  limpiar(): void
}
