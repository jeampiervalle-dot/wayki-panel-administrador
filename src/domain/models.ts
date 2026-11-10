// ============================================================
// Dominio: modelos de negocio puros.
// No dependen de React, MUI, fetch ni de ninguna librería.
// Alineados al esquema de la base de datos gowayki_db
// (backend: gowayki-nest-admin-back / backend principal).
// ============================================================

export interface Linea {
  id: number
  nombre: string
  origen?: string
  destino?: string
  corredor?: string
  colorHex?: string
  /** Paraderos/puntos de control embebidos (cuando el API los incluye). */
  paraderos?: PuntoControl[]
}

export interface PuntoControl {
  id?: number
  nombre?: string
  lat?: number
  lng?: number
  orden?: number
  radioMetros?: number
  toleranciaMinutos?: number
}

export interface PosicionGps {
  lat?: number
  lng?: number
  velocidadKmh?: number
  rumboGrados?: number
  ultimaActualizacion?: string
}

export interface Unidad {
  id: number
  numeroPadron?: string
  placa?: string
  lineaId?: number
  lineaNombre?: string
  estado?: string
  posicionActual?: PosicionGps | null
}

export interface Usuario {
  id: string
  nombre: string
  dni: string
  telefono?: string
  email?: string
  fotoUrl?: string
  rol: string
  isOnline?: boolean
  /** Línea asociada (JEFE_RUTA/CHOFER). */
  lineaId?: number
  lineaNombre?: string
}

export interface Sesion {
  usuario: Usuario
  token?: string
}

export interface Credenciales {
  dni: string
  pin: string
}

export interface NuevoUsuario {
  nombre: string
  dni: string
  telefono: string
  email?: string
  pin: string
  rol: string
  fotoUrl?: string
  /** Ruta/línea seleccionada al registrarse (p. ej. JEFE_RUTA). */
  lineaId?: number
}

export interface DatosLinea {
  nombre: string
  origen?: string
  destino?: string
  corredor?: string
  colorHex?: string
}

export interface DatosUnidad {
  numeroPadron?: string
  placa?: string
  lineaId?: number
  estado?: string
}

export type EstadoSolicitud = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA'

export interface SolicitudRegistro {
  id: number | string
  dni: string
  nombreCompleto: string
  telefono?: string
  placaNumero?: string
  rutaTrabajo?: string
  estado: EstadoSolicitud
  usuarioAsignado?: string
  creadoEn?: string
  actualizadoEn?: string
}

export const ROLES = ['ADMIN', 'JEFE_RUTA', 'CHOFER'] as const
