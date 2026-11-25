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

/** Subruta del backend Spring (catálogo que también usa la app móvil). */
export interface SubrutaCatalogo {
  id: number
  codigo: string
  nombre: string
  nombreRetorno?: string
  operador?: string
  colorHex?: string
  routeIdIda: string
  routeIdRetorno: string
  activa?: boolean
}

export interface LineaCatalogo {
  codigo: string
  nombre: string
  colorHex?: string
  subrutas: SubrutaCatalogo[]
}

export interface CatalogoRutas {
  lineas: LineaCatalogo[]
}

export type SentidoRuta = 'IDA' | 'RETORNO'

/** Ruta del catálogo de SmartBus (Arequipa). */
export interface RutaSmartBus {
  id: string
  shortName: string
  longName: string
  agency: { id: string; name: string }
  color: string
  textColor?: string
  stopsCount: number
  /** ID de la ruta inversa cuando el backend lo expone. */
  routeIdRetorno?: string | null
  /** Id numérico de la subruta en gowayki_db (viene en /rutas/catalogo). */
  subrutaDbId?: string
  /** Código de la subruta en el catálogo (dto.codigo). */
  subrutaCodigo?: string
  /** Datos de servicio (si el backend los expone). */
  nombre?: string
  from?: string
  to?: string
  network?: string
  charge?: string
  interval?: string
  durationMin?: number
  schedule?: string
  checkPoint?: string
  distanceKm?: number
}

export interface ParaderoSmartBus {
  id: string
  name: string
  lat: number
  lng: number
  sequence: number
}

/** Detalle de una ruta: geometría real y paraderos en orden. */
export interface DetalleRutaSmartBus extends RutaSmartBus {
  geometry: [number, number][]
  stops: ParaderoSmartBus[]
}

export interface GrupoRutas {
  key: string
  codigo: string
  empresa: string
  rutas: RutaSmartBus[]
}

export interface PosicionGps {
  lat?: number
  lng?: number
  velocidadKmh?: number
  rumboGrados?: number
  ultimaActualizacion?: string
}

export interface TurnoActivo {
  id: string
  unidadId?: number
  choferId?: string
  choferNombre?: string
  subrutaId?: number
  subrutaNombre?: string
  estado?: string
}

export interface Unidad {
  id: number
  numeroPadron?: string
  placa?: string
  lineaId?: number
  lineaNombre?: string
  estado?: string
  posicionActual?: PosicionGps | null
  /** Subruta SmartBus elegida para la combi. */
  subrutaId?: string
  nombreSubruta?: string
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
  /** Subruta elegida al crear la cuenta (jefe de ruta). */
  subrutaId?: string
  /** Id numérico de esa subruta en gowayki_db (para cruzar con /unidades). */
  subrutaDbId?: string
  nombreSubruta?: string
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
  nombreLinea?: string
  /** Subruta seleccionada dentro de esa línea (routeId SmartBus). */
  subrutaId?: string
  subrutaDbId?: string
  nombreSubruta?: string
  codigoLinea?: string
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
  /** Subruta a la que se asigna la combi. */
  subrutaId?: string
  /** Id numérico de gowayki_db: es el que persiste el backend y usa la app. */
  subrutaDbId?: string
  /** Código/routeId del catálogo que la app móvil usa para elegir la ruta. */
  subrutaCodigo?: string
  nombreSubruta?: string
}

export type EstadoSolicitud = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA'

/** Quién pide el alta: chofer (desde la app), jefe de ruta o cambio de ruta. */
export type TipoSolicitud = 'JEFE_RUTA' | 'CHOFER' | 'CAMBIO_RUTA'

export interface SolicitudRegistro {
  id: number | string
  dni: string
  nombreCompleto: string
  telefono?: string
  placaNumero?: string
  rutaTrabajo?: string
  tipo?: TipoSolicitud
  estado: EstadoSolicitud
  usuarioAsignado?: string
  lineaSolicitadaId?: number
  subrutaSolicitadaId?: number
  usuarioId?: string
  creadoEn?: string
  actualizadoEn?: string
}

export const ROLES = ['ADMIN', 'JEFE_RUTA', 'CHOFER'] as const
