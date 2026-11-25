// ============================================================
// Mapa con el catálogo real de GuíaBus: agrupa por empresa,
// carga la ruta seleccionada y su inversa, y expone los trazos
// originales (igual que en la página de GuíaBus).
// ============================================================

import { useCallback, useMemo, useState } from 'react'
import type {
  DetalleRutaSmartBus,
  GrupoRutas,
  PuntoControl,
  RutaSmartBus,
} from '../domain/models'
import type { RutasMapaRepository } from '../domain/ports'
import { colorComplementario, colorLegible } from '../presentation/colores'
import { useAsync } from './useAsync'

type LatLng = [number, number]

export interface TrazoRuta {
  key: string
  nombre: string
  color: string
  positions: LatLng[]
  paraderos: PuntoControl[]
}

function parsearAgencia(nombre: string): { codigo: string; empresa: string } {
  const match = nombre.match(/^(C\d{1,2})\s*-\s*(.+)$/i)
  if (match) return { codigo: match[1].toUpperCase(), empresa: match[2].trim() }
  return { codigo: nombre.trim(), empresa: '' }
}

function ordenGrupo(codigo: string): number {
  const match = codigo.match(/^C(\d+)$/i)
  return match ? Number(match[1]) : 99
}

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Etiqueta legible: origen → destino, sin el prefijo "C-4 Bus ...". */
export function etiquetaRuta(ruta: RutaSmartBus): string {
  if (ruta.from && ruta.to) return `${ruta.from} → ${ruta.to}`
  const partes = ruta.longName.split(' : ')
  return partes[partes.length - 1] ?? ruta.longName
}

function extremos(ruta: RutaSmartBus): { origen: string; destino: string } | null {
  if (ruta.from && ruta.to) {
    return { origen: normalizar(ruta.from), destino: normalizar(ruta.to) }
  }
  const match = ruta.longName.match(/.*:\s*(.+?)\s*→\s*(.+)$/)
  if (!match) return null
  return { origen: normalizar(match[1]), destino: normalizar(match[2]) }
}

function esRutaInversa(ruta: RutaSmartBus, otra: RutaSmartBus): boolean {
  if (ruta.id === otra.id || ruta.shortName !== otra.shortName) return false
  const a = extremos(ruta)
  const b = extremos(otra)
  if (!a || !b) return false
  return a.origen === b.destino && a.destino === b.origen
}

function aPuntosControl(detalle: DetalleRutaSmartBus | null): PuntoControl[] {
  if (!detalle) return []
  return detalle.stops.map((paradero) => ({
    nombre: paradero.name,
    lat: paradero.lat,
    lng: paradero.lng,
    // El backend entrega la secuencia 1-based; la UI ya suma 1 al pintar.
    orden: Math.max(0, paradero.sequence - 1),
  }))
}

export function useRutasMapa(
  repo: RutasMapaRepository,
  preferCodigo?: string | null,
  preferRutaId?: string | null,
) {
  const catalogoQuery = useAsync(() => repo.rutas(), [repo])

  const grupos = useMemo<GrupoRutas[]>(() => {
    const porAgencia = new Map<string, RutaSmartBus[]>()
    for (const ruta of catalogoQuery.data ?? []) {
      const key = ruta.agency.name
      if (!porAgencia.has(key)) porAgencia.set(key, [])
      porAgencia.get(key)!.push(ruta)
    }
    return [...porAgencia.entries()]
      .map(([key, rutas]) => {
        const { codigo, empresa } = parsearAgencia(key)
        return { key, codigo, empresa: empresa || key, rutas }
      })
      .sort((a, b) => ordenGrupo(a.codigo) - ordenGrupo(b.codigo))
  }, [catalogoQuery.data])

  // Selección derivada: siempre válida aunque cambie el catálogo.
  const [seleccion, setSeleccion] = useState<{ grupo: string; ruta: string } | null>(null)
  const preferidoPorCodigo = preferCodigo
    ? grupos.find((item) => item.codigo.toUpperCase() === preferCodigo.toUpperCase())
    : null
  // La ruta asignada manda: aunque el catálogo tenga otras rutas en la misma
  // empresa, el mapa debe abrir siempre la subruta de la cuenta.
  const preferidoPorRuta = preferRutaId
    ? grupos.find((item) =>
        item.rutas.some((ruta) => ruta.id === preferRutaId || ruta.routeIdRetorno === preferRutaId),
      ) ?? null
    : null
  const grupo =
    grupos.find(
      (item) =>
        item.key ===
        (seleccion?.grupo ?? preferidoPorRuta?.key ?? preferidoPorCodigo?.key ?? grupos[0]?.key),
    ) ?? null
  const rutaAsignada = preferRutaId
    ? grupo?.rutas.find(
        (item) => item.id === preferRutaId || item.routeIdRetorno === preferRutaId,
      ) ?? null
    : null
  const rutaId =
    (seleccion?.ruta && grupo?.rutas.some((item) => item.id === seleccion.ruta) ? seleccion.ruta : null) ??
    rutaAsignada?.id ??
    grupo?.rutas[0]?.id
  const ruta = grupo?.rutas.find((item) => item.id === rutaId) ?? null

  const inversa = useMemo(
    () => (ruta && grupo ? grupo.rutas.find((item) => esRutaInversa(ruta, item)) ?? null : null),
    [ruta, grupo],
  )

  // Nunca trazar dos veces la misma ruta: some DTOs repiten la ida en
  // routeIdRetorno y la inversa detectada por nombre podría ser la propia ruta.
  const retornoId =
    ruta && ruta.routeIdRetorno && ruta.routeIdRetorno !== ruta.id
      ? ruta.routeIdRetorno
      : ruta && inversa && inversa.id !== ruta.id
        ? inversa.id
        : null

  const detalleQuery = useAsync(async () => {
    if (!ruta) return { ida: null, vuelta: null }
    const [ida, vuelta] = await Promise.all([
      repo.detalle(ruta.id),
      retornoId && retornoId !== ruta.id ? repo.detalle(retornoId) : Promise.resolve(null),
    ])
    return { ida, vuelta }
  }, [repo, ruta?.id, retornoId])

  const detalle = useMemo(
    () => detalleQuery.data ?? { ida: null, vuelta: null },
    [detalleQuery.data],
  )

  const seleccionarGrupo = useCallback((key: string) => {
    setSeleccion({ grupo: key, ruta: '' })
  }, [])

  const seleccionarRuta = useCallback(
    (id: string) => {
      setSeleccion({ grupo: grupo?.key ?? '', ruta: id })
    },
    [grupo?.key],
  )

  const trazos = useMemo<TrazoRuta[]>(() => {
    if (!ruta || !detalle.ida) return []
    const colorIda = colorLegible(ruta.color)
    const resultado: TrazoRuta[] = [
      {
        key: 'ida',
        nombre: etiquetaRuta(ruta),
        color: colorIda,
        positions: detalle.ida.geometry,
        paraderos: aPuntosControl(detalle.ida),
      },
    ]
    if (detalle.vuelta) {
      resultado.push({
        key: 'vuelta',
        nombre: etiquetaRuta(detalle.vuelta),
        color: colorComplementario(colorIda),
        positions: detalle.vuelta.geometry,
        paraderos: aPuntosControl(detalle.vuelta),
      })
    }
    return resultado.filter((trazo) => trazo.positions.length > 1)
  }, [ruta, detalle])

  return {
    grupos,
    grupo,
    ruta,
    inversa,
    seleccionarGrupo,
    seleccionarRuta,
    trazos,
    detalleIda: detalle.ida,
    detalleVuelta: detalle.vuelta,
    loading: catalogoQuery.loading || detalleQuery.loading,
    error: catalogoQuery.error ?? detalleQuery.error,
  }
}
