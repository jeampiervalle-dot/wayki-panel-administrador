// ============================================================
// Datos: mapeadores DTO -> modelo de dominio.
// El backend puede devolver nombres alternativos (lat/latitud,
// usuario/user, etc.); aquí se normaliza una sola vez.
// ============================================================

import { AppError } from '../domain/errors'
import type { Linea, PuntoControl, Sesion, Unidad, Usuario } from '../domain/models'

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
  if (record.exito === false) {
    throw new AppError(text(record.mensaje) ?? fallback)
  }
}

export function toLinea(raw: unknown): Linea {
  const record = asRecord(raw)
  return {
    id: num(record.id) ?? 0,
    nombre: text(record.nombre) ?? text(record.name) ?? '',
    origen: text(record.origen),
    destino: text(record.destino),
    corredor: text(record.corredor),
    colorHex: text(record.colorHex) ?? text(record.color),
  }
}

export function toPuntoControl(raw: unknown): PuntoControl {
  const record = asRecord(raw)
  return {
    id: num(record.id),
    nombre: text(record.nombre) ?? text(record.name),
    lat: num(record.lat ?? record.latitude ?? record.latitud),
    lng: num(record.lng ?? record.longitude ?? record.longitud),
    orden: num(record.orden ?? record.order),
    radioMetros: num(record.radioMetros ?? record.radioToleranciaMetros),
  }
}

export function toUnidad(raw: unknown): Unidad {
  const record = asRecord(raw)
  const linea = asRecord(record.linea)
  return {
    id: num(record.id) ?? 0,
    numeroPadron: text(record.numeroPadron ?? record.padron),
    placa: text(record.placa),
    lineaId: num(record.lineaId) ?? num(linea.id),
    estado: text(record.estado),
  }
}

export function toUsuario(raw: unknown): Usuario {
  const record = asRecord(raw)
  return {
    id: text(record.id) ?? text(record.dni) ?? '',
    nombre: text(record.nombre) ?? text(record.name) ?? '',
    dni: text(record.dni) ?? '',
    telefono: text(record.telefono) ?? text(record.phone),
    email: text(record.email),
    rol: text(record.rol) ?? text(record.role) ?? 'CHOFER',
    isOnline: bool(record.isOnline),
  }
}

export function toSesion(raw: unknown): Sesion {
  const record = asRecord(raw)
  assertSuccess(record, 'No se pudo iniciar sesión')

  const usuario = toUsuario(record.usuario ?? record.user ?? raw)
  if (!usuario.id && !usuario.dni && !usuario.nombre) {
    throw new AppError('El backend no devolvió los datos del usuario')
  }

  return { usuario, token: text(record.token) }
}

export function toList<T>(raw: unknown, mapper: (item: unknown) => T): T[] {
  if (Array.isArray(raw)) return raw.map(mapper)

  const record = asRecord(raw)
  const list = Array.isArray(record.content)
    ? record.content
    : Array.isArray(record.data)
      ? record.data
      : []

  return list.map(mapper)
}
