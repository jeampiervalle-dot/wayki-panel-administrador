// ============================================================
// Descripción de cada paradero: calle (reverse geocoding) y
// lugar conocido cercano (dataset local de referencia).
// ============================================================

import { config } from '../../config'
import type { PuntoControl } from '../../domain/models'

export interface DescripcionParadero {
  calle: string
  cerca: string
}

type Lugar = {
  nombre: string
  nombreCompleto: string
  detalle: string
  categoria: string
  lat: number
  lng: number
}

const cache = new Map<string, DescripcionParadero>()
let lugaresPromise: Promise<Lugar[]> | null = null
let callesPromise: Promise<Record<string, string>> | null = null

function cargarCalles(): Promise<Record<string, string>> {
  if (!callesPromise) {
    callesPromise = fetch('/paraderos-descripciones.json')
      .then((respuesta) => respuesta.json() as Promise<Record<string, string>>)
      .catch(() => ({}) as Record<string, string>)
  }
  return callesPromise
}

function clave(punto: PuntoControl): string {
  return `${(punto.lat ?? 0).toFixed(5)}|${(punto.lng ?? 0).toFixed(5)}`
}

function distanciaMetros(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const radio = 6371000
  const p1 = (aLat * Math.PI) / 180
  const p2 = (bLat * Math.PI) / 180
  const dLat = p2 - p1
  const dLng = ((bLng - aLng) * Math.PI) / 180
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dLng / 2) ** 2
  return 2 * radio * Math.asin(Math.min(1, Math.sqrt(h)))
}

function cargarLugares(): Promise<Lugar[]> {
  if (!lugaresPromise) {
    lugaresPromise = fetch('/lugares-referencia.json')
      .then((respuesta) => respuesta.json() as Promise<Lugar[]>)
      .catch(() => [] as Lugar[])
  }
  return lugaresPromise
}

function lugarCercano(punto: PuntoControl, lugares: Lugar[]): string {
  if (punto.lat == null || punto.lng == null) return ''
  let mejor: Lugar | null = null
  let menor = 350
  for (const lugar of lugares) {
    const metros = distanciaMetros(punto.lat, punto.lng, lugar.lat, lugar.lng)
    if (metros < menor) {
      menor = metros
      mejor = lugar
    }
  }
  if (!mejor) return ''
  return mejor.detalle ? `${mejor.nombre} · ${mejor.detalle}` : mejor.nombre
}

async function calleDe(punto: PuntoControl, signal?: AbortSignal): Promise<string> {
  if (punto.lat == null || punto.lng == null) return ''
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${punto.lng.toFixed(6)},${punto.lat.toFixed(6)}.json` +
    `?types=address&language=es&limit=1&access_token=${config.geocodingToken}`
  try {
    const respuesta = await fetch(url, { signal })
    if (!respuesta.ok) return ''
    const data = (await respuesta.json()) as { features?: { text?: string; place_name?: string }[] }
    return data.features?.[0]?.text ?? ''
  } catch {
    return ''
  }
}

/** Devuelve la descripción cacheada de un paradero. */
export async function describirParadero(
  punto: PuntoControl,
  signal?: AbortSignal,
): Promise<DescripcionParadero> {
  const id = clave(punto)
  const guardado = cache.get(id)
  if (guardado) return guardado

  const calleMapa = (await cargarCalles())[id]
  if (calleMapa) {
    const resultado: DescripcionParadero = { calle: calleMapa, cerca: '' }
    cache.set(id, resultado)
    return resultado
  }

  const [lugares, calle] = await Promise.all([cargarLugares(), calleDe(punto, signal)])
  const resultado: DescripcionParadero = { calle, cerca: lugarCercano(punto, lugares) }
  if (calle || resultado.cerca) cache.set(id, resultado)
  return resultado
}

/** Llena descripciones con concurrencia limitada; avanza con `onCadaUno`. */
export async function describirParaderos(
  puntos: PuntoControl[],
  onCadaUno: (id: string, descripcion: DescripcionParadero) => void,
  signal?: AbortSignal,
): Promise<void> {
  const pendientes = puntos.filter((punto) => !cache.has(clave(punto)))
  const inmediatas = puntos.filter((punto) => cache.has(clave(punto)))
  for (const punto of inmediatas) {
    onCadaUno(clave(punto), cache.get(clave(punto))!)
  }
  let indice = 0
  const trabajador = async () => {
    while (indice < pendientes.length) {
      if (signal?.aborted) return
      const punto = pendientes[indice++]
      const descripcion = await describirParadero(punto, signal)
      onCadaUno(clave(punto), descripcion)
    }
  }
  await Promise.all([trabajador(), trabajador(), trabajador(), trabajador()])
}
