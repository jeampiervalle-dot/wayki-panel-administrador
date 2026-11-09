// ============================================================
// Dominio: modelos de negocio puros.
// No dependen de React, MUI, fetch ni de ninguna librería.
// ============================================================

export interface Linea {
  id: number
  nombre: string
  origen?: string
  destino?: string
  corredor?: string
  colorHex?: string
}

export interface PuntoControl {
  id?: number
  nombre?: string
  lat?: number
  lng?: number
  orden?: number
  radioMetros?: number
}

export interface Unidad {
  id: number
  numeroPadron?: string
  placa?: string
  lineaId?: number
  estado?: string
}

export interface Usuario {
  id: string
  nombre: string
  dni: string
  telefono?: string
  email?: string
  rol: string
  isOnline?: boolean
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

export const ROLES = ['ADMIN', 'JEFE_RUTA', 'CHOFER'] as const
