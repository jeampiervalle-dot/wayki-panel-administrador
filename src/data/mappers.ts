// ============================================================
// Datos: mapeadores DTO -> modelo de dominio.
// El backend puede devolver nombres alternativos (lat/latitud,
// usuario/user, etc.); aquí se normaliza una sola vez.
// Alineado al esquema gowayki_db (usuario, linea, unidad,
// punto_control) y compatible con JWT (access/access_token).
// ============================================================

import { AppError } from '../domain/errors'
import type {
  EstadoSolicitud,
  Linea,
  PosicionGps,
  PuntoControl,
  Sesion,
  SolicitudRegistro,
  TipoSolicitud,
  Unidad,
  Usuario,
} from '../domain/models'

type Json = Record<string, unknown>

function asRecord(value: unknown): Json {
  return value && typeof value === 'object' ? (value as Json) : {}
}

function text(value: unknown): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed || undefined
  }
  if (typeof value === 'number') return String(value)
  return undefined
}

function num(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

function bool(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

export function assertSuccess(raw: unknown, fallback: string): void {
  const record = asRecord(raw)
  if (record.exito === false || record.success === false) {
    throw new AppError(text(record.mensaje ?? record.message ?? record.detail) ?? fallback)
  }
}

export function toPuntoControl(raw: unknown): PuntoControl {
  const record = asRecord(raw)
  return {
    id: num(record.id),
    nombre: text(record.nombre ?? record.name),
    lat: num(record.lat ?? record.latitude ?? record.latitud),
    lng: num(record.lng ?? record.longitude ?? record.longitud),
    orden: num(record.orden ?? record.order),
    radioMetros: num(record.radioMetros ?? record.radioToleranciaMetros),
    toleranciaMinutos: num(record.toleranciaMinutos),
  }
}

export function toLinea(raw: unknown): Linea {
  const record = asRecord(raw)
  const paraderosRaw = record.paraderos ?? record.puntosControl ?? record.puntos_control
  return {
    id: num(record.id) ?? 0,
    nombre: text(record.nombre ?? record.name) ?? '',
    origen: text(record.origen),
    destino: text(record.destino),
    corredor: text(record.corredor),
    colorHex: text(record.colorHex ?? record.color_hex ?? record.color),
    paraderos: Array.isArray(paraderosRaw) ? paraderosRaw.map(toPuntoControl) : undefined,
  }
}

function toPosicionGps(raw: unknown): PosicionGps | null {
  const record = asRecord(raw)
  const lat = num(record.lat ?? record.latitude ?? record.latitud)
  const lng = num(record.lng ?? record.longitude ?? record.longitud)
  if (lat == null && lng == null) return null
  return {
    lat,
    lng,
    velocidadKmh: num(record.velocidadKmh ?? record.velocidad_kmh),
    rumboGrados: num(record.rumboGrados ?? record.rumbo_grados),
    ultimaActualizacion: text(record.ultimaActualizacion ?? record.ultima_actualizacion),
  }
}

export function toUnidad(raw: unknown): Unidad {
  const record = asRecord(raw)
  const linea = asRecord(record.linea)
  const posicionRaw = record.posicionActual ?? record.posicion_actual ?? record.posicion
  return {
    id: num(record.id) ?? 0,
    numeroPadron: text(record.numeroPadron ?? record.numero_padron ?? record.padron),
    placa: text(record.placa),
    lineaId: num(record.lineaId ?? record.linea_id) ?? num(linea.id),
    lineaNombre: text(record.lineaNombre ?? record.linea_nombre) ?? text(linea.nombre),
    estado: text(record.estado),
    posicionActual: posicionRaw ? toPosicionGps(posicionRaw) : null,
  }
}

export function toUsuario(raw: unknown): Usuario {
  const record = asRecord(raw)
  const linea = asRecord(record.linea)
  return {
    id: text(record.id) ?? text(record.dni) ?? '',
    nombre: text(record.nombre ?? record.name) ?? '',
    dni: text(record.dni) ?? '',
    telefono: text(record.telefono ?? record.phone),
    email: text(record.email),
    fotoUrl: text(record.fotoUrl ?? record.foto_url),
    rol: text(record.rol ?? record.role) ?? 'CHOFER',
    isOnline: bool(record.isOnline ?? record.is_online),
    lineaId: num(record.lineaId ?? record.linea_id) ?? num(linea.id),
    lineaNombre: text(record.lineaNombre ?? record.linea_nombre) ?? text(linea.nombre),
  }
}

export function toSesion(raw: unknown): Sesion {
  const record = asRecord(raw)
  assertSuccess(record, 'No se pudo iniciar sesión')

  const usuario = toUsuario(record.usuario ?? record.user ?? raw)
  if (!usuario.id && !usuario.dni && !usuario.nombre) {
    throw new AppError('El backend no devolvió los datos del usuario')
  }

  const token = text(record.token ?? record.access ?? record.access_token)
  return { usuario, token }
}

function toTipoSolicitud(value: unknown): TipoSolicitud | undefined {
  const tipo = (text(value) ?? '').toUpperCase()
  if (tipo === 'CHOFER' || tipo === 'DRIVER') return 'CHOFER'
  if (tipo === 'CAMBIO_RUTA' || tipo === 'CAMBIO RUTA') return 'CAMBIO_RUTA'
  if (tipo === 'JEFE_RUTA' || tipo === 'JEFE RUTA' || tipo === 'JEFE') return 'JEFE_RUTA'
  return undefined
}

function toEstadoSolicitud(value: unknown): EstadoSolicitud {
  const estado = (text(value) ?? 'PENDIENTE').toUpperCase()
  if (estado === 'APROBADA' || estado === 'APROBADO' || estado === 'APPROVED') return 'APROBADA'
  if (estado === 'RECHAZADA' || estado === 'RECHAZADO' || estado === 'REJECTED') return 'RECHAZADA'
  return 'PENDIENTE'
}

export function toSolicitudRegistro(raw: unknown): SolicitudRegistro {
  const record = asRecord(raw)
  return {
    id: num(record.id) ?? text(record.id) ?? '',
    dni: text(record.dni) ?? '',
    nombreCompleto: text(record.nombreCompleto ?? record.nombre_completo ?? record.fullName ?? record.full_name ?? record.nombre) ?? '',
    telefono: text(record.telefono ?? record.phone),
    placaNumero: text(record.placaNumero ?? record.placa_numero ?? record.plateNumber ?? record.plate_number ?? record.placa),
    rutaTrabajo: text(record.rutaTrabajo ?? record.ruta_trabajo ?? record.workRoute ?? record.work_route ?? record.ruta),
    tipo: toTipoSolicitud(record.tipo ?? record.tipoSolicitud ?? record.tipo_solicitud ?? record.role ?? record.rol),
    estado: toEstadoSolicitud(record.estado ?? record.status),
    usuarioAsignado: text(record.usuarioAsignado ?? record.usuario_asignado ?? record.assignedUsername ?? record.assigned_username),
    creadoEn: text(record.creadoEn ?? record.creado_en ?? record.createdAt ?? record.created_at),
    actualizadoEn: text(record.actualizadoEn ?? record.actualizado_en ?? record.updatedAt ?? record.updated_at),
  }
}

export function toList<T>(raw: unknown, mapper: (item: unknown) => T): T[] {
  if (Array.isArray(raw)) return raw.map(mapper)

  const record = asRecord(raw)
  const list = Array.isArray(record.content)
    ? record.content
    : Array.isArray(record.data)
      ? record.data
      : Array.isArray(record.results)
        ? record.results
        : []

  return list.map(mapper)
}
