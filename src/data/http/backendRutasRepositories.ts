// ============================================================
// Rutas desde el backend de la VPS: Spring expone el catálogo,
// la geometría y los paraderos leyendo gowayki_db.
// ============================================================

import type { DetalleRutaSmartBus, RutaSmartBus } from '../../domain/models'
import type { RutasMapaRepository } from '../../domain/ports'
import { config } from '../../config'
import { request } from './client'

const BASE = (config.rutasApiUrl || 'http://localhost:8080/api').replace(/\/+$/, '')

type SubrutaDto = {
  id?: number
  lineaCodigo?: string
  lineaNombre?: string
  codigo?: string
  nombre?: string
  operador?: string
  colorHex?: string
  routeIdIda?: string | null
  routeIdRetorno?: string | null
  nombreRetorno?: string | null
  activa?: boolean
}

type LineaCatalogoDto = {
  codigo?: string
  nombre?: string
  colorHex?: string
  subrutas?: SubrutaDto[]
}

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : ''
}

function extremos(nombre: string): { from: string; to: string } {
  const match = nombre.match(/^(.+?):\s*(.+?)\s*→\s*(.+)$/)
  if (!match) return { from: '', to: '' }
  return { from: match[2].trim(), to: match[3].trim() }
}

let conteosPromise: Promise<Record<string, number>> | null = null

function cargarConteos(): Promise<Record<string, number>> {
  if (!conteosPromise) {
    conteosPromise = fetch('/paraderos-conteo.json')
      .then((respuesta) => respuesta.json() as Promise<Record<string, number>>)
      .catch(() => ({}) as Record<string, number>)
  }
  return conteosPromise
}

function aRuta(dto: SubrutaDto, linea: LineaCatalogoDto, conteos: Record<string, number>): RutaSmartBus | null {
  const id = texto(dto.routeIdIda) || texto(dto.routeIdRetorno)
  if (!id) return null
  const nombre = texto(dto.nombre) || texto(dto.codigo) || id
  const codigo = texto(linea.codigo)
  const nombreLinea = texto(linea.nombre)
  const { from, to } = extremos(nombre)
  const retorno = texto(dto.routeIdRetorno)
  return {
    id,
    // id numérico de gowayki_db: permite cruzar la subruta elegida con el
    // subrutaId que Spring devuelve en /api/unidades.
    subrutaDbId: dto.id != null ? String(dto.id) : undefined,
    subrutaCodigo: texto(dto.codigo) || id,
    shortName: nombre.split('→')[0].trim(),
    longName: nombre,
    agency: {
      id: codigo,
      name:
        codigo && nombreLinea && !nombreLinea.toUpperCase().startsWith(codigo.toUpperCase())
          ? `${codigo} - ${nombreLinea}`
          : nombreLinea || codigo,
    },
    color: texto(dto.colorHex) || texto(linea.colorHex) || '#7B82A0',
    stopsCount: conteos[id] ?? 0,
    // Algunos DTOs repiten la ida como retorno: no es una ruta inversa y
    // provocaría una segunda petición y un trazo duplicado.
    routeIdRetorno: retorno && retorno !== id ? retorno : null,
    nombre,
    from,
    to,
    network: 'SIT',
  }
}

let catalogoPromise: Promise<RutaSmartBus[]> | null = null

function cargarCatalogo(): Promise<RutaSmartBus[]> {
  if (!catalogoPromise) {
    catalogoPromise = Promise.all([
      request<{ lineas?: LineaCatalogoDto[] }>('/rutas/catalogo', undefined, BASE),
      cargarConteos(),
    ])
      .then(([data, conteos]) => {
        const resultado: RutaSmartBus[] = []
        for (const linea of data?.lineas ?? []) {
          for (const dto of linea.subrutas ?? []) {
            const ruta = aRuta(dto, linea, conteos)
            if (ruta) resultado.push(ruta)
          }
        }
        return resultado
      })
      .catch((error: unknown) => {
        catalogoPromise = null
        throw error
      })
  }
  return catalogoPromise
}

export function createBackendRutasRepository(): RutasMapaRepository {
  return {
    rutas(): Promise<RutaSmartBus[]> {
      return cargarCatalogo()
    },

    async detalle(routeId: string): Promise<DetalleRutaSmartBus | null> {
      const [geo, paradas] = await Promise.all([
        request<unknown>(`/rutas/${encodeURIComponent(routeId)}/geometria`, undefined, BASE),
        request<unknown>(`/rutas/${encodeURIComponent(routeId)}/paraderos`, undefined, BASE),
      ])

      const geometry: [number, number][] = Array.isArray(geo)
        ? (geo as unknown[])
            .map((punto) => {
              if (!Array.isArray(punto) || punto.length < 2) return null
              const lng = Number(punto[0])
              const lat = Number(punto[1])
              return Number.isFinite(lat) && Number.isFinite(lng) ? ([lat, lng] as [number, number]) : null
            })
            .filter((punto): punto is [number, number] => punto != null)
        : []

      const stops = Array.isArray(paradas)
        ? (paradas as Record<string, unknown>[])
            .map((paradero, index) => {
              const lat = Number(paradero.lat ?? paradero.latitude)
              const lng = Number(paradero.lon ?? paradero.lng ?? paradero.longitude)
              if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
              return {
                id: texto(paradero.id) || `${routeId}_${index}`,
                name: texto(paradero.name) || `Paradero ${index + 1}`,
                lat,
                lng,
                // Secuencia 1-based: el mapa la normaliza a 0-based antes de
                // mostrar el número de paradero (que vuelve a sumar 1).
                sequence: Number(paradero.orden ?? index + 1),
              }
            })
            .filter((paradero): paradero is { id: string; name: string; lat: number; lng: number; sequence: number } => paradero != null)
        : []

      const base = await cargarCatalogo()
      const ruta = base.find((item) => item.id === routeId || item.routeIdRetorno === routeId)
      return {
        id: routeId,
        shortName: ruta?.shortName ?? routeId,
        longName: ruta?.longName ?? routeId,
        agency: ruta?.agency ?? { id: '', name: '' },
        color: ruta?.color ?? '#7B82A0',
        stopsCount: stops.length,
        routeIdRetorno: ruta?.routeIdRetorno ?? null,
        geometry,
        stops,
      }
    },
  }
}
