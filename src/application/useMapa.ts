import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Linea } from '../domain/models'
import type { LineasRepository } from '../domain/ports'
import { resolverSubrutasCuradas } from '../data/rutasCuradas'
import { useAsync } from './useAsync'

// Regla de negocio de la vista: las líneas principales (Línea C...)
// van primero y luego el resto por id.
function ordenarLineas(lineas: Linea[]): Linea[] {
  return [...lineas].sort((a, b) => {
    const aPrincipal = /^L[ií]nea\s*C\d+/i.test(a.nombre) ? 0 : 1
    const bPrincipal = /^L[ií]nea\s*C\d+/i.test(b.nombre) ? 0 : 1
    if (aPrincipal !== bPrincipal) return aPrincipal - bPrincipal
    return a.id - b.id
  })
}

function extraerCodigoRuta(linea: Pick<Linea, 'nombre' | 'corredor'>): string | null {
  const fromNombre = (linea.nombre ?? '').match(/\bC\d+\b/i)?.[0]
  if (fromNombre) return fromNombre.toUpperCase()
  const corredor = (linea.corredor ?? '').trim()
  const fromCorredor = corredor.match(/\bC\d+\b/i)?.[0]
  if (fromCorredor) return fromCorredor.toUpperCase()
  if (/^C\d+$/i.test(corredor)) return corredor.toUpperCase()
  return null
}

function lineasDeMismaRuta(lineas: Linea[], fixedLineaId: number): Linea[] {
  const base = lineas.find((l) => l.id === fixedLineaId)
  if (!base) return []
  const code = extraerCodigoRuta(base)
  const baseCorredor = (base.corredor ?? '').trim().toLowerCase()

  const grupo = lineas.filter((l) => {
    if (l.id === base.id) return true
    const c = extraerCodigoRuta(l)
    if (code && c === code) return true
    // Fallback: mismo corredor textual (ej. SITs comparten corredor "C2")
    const lc = (l.corredor ?? '').trim().toLowerCase()
    if (baseCorredor && lc && baseCorredor === lc) return true
    // Incluir línea principal cuyo nombre contenga el código aunque su corredor difiera
    if (code && new RegExp(`\\b${code}\\b`, 'i').test(l.nombre ?? '')) return true
    return false
  })

  return grupo.length ? grupo : [base]
}

function normLugar(s?: string): string {
  return (s ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokensLugar(s?: string): Set<string> {
  const stop = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'av', 'avenida', 'jr', 'calle', 'urb', 'sector'])
  return new Set(normLugar(s).split(' ').filter((t) => t.length > 2 && !stop.has(t)))
}

function similitudLugar(a?: string, b?: string): number {
  const ta = tokensLugar(a)
  const tb = tokensLugar(b)
  if (ta.size === 0 || tb.size === 0) return 0
  let inter = 0
  for (const t of ta) if (tb.has(t)) inter++
  return inter / Math.min(ta.size, tb.size)
}

function esParIdaVuelta(a: Linea, b: Linea): boolean {
  const na = a.nombre ?? ''
  const nb = b.nombre ?? ''
  const da = /\bi\b/i.test(na)
  const va = /\bv\b/i.test(na)
  const db = /\bi\b/i.test(nb)
  const vb = /\bv\b/i.test(nb)
  // si ambos marcan sentido, deben ser opuestos (i/v); si no, igual intentamos por extremos
  if ((da || va) && (db || vb) && !((da && vb) || (va && db))) return false
  const oA = normLugar(a.origen)
  const dA = normLugar(a.destino)
  const oB = normLugar(b.origen)
  const dB = normLugar(b.destino)
  if (!oA || !dA || !oB || !dB) return false
  // reverso directo o por similitud de extremos
  const direct = (oA === dB && dA === oB)
  const similar = similitudLugar(a.origen, b.destino) >= 0.5 && similitudLugar(a.destino, b.origen) >= 0.5
  const cross = (oA.includes(dB) || dB.includes(oA)) && (dA.includes(oB) || oB.includes(dA))
  return direct || similar || cross
}

function nombreUnificado(a: Linea, b: Linea): string {
  // Preferir una etiqueta legible basada en extremos en orden "origen común -> destino común"
  const ida = /\bi\b/i.test(a.nombre ?? '') ? a : /\bi\b/i.test(b.nombre ?? '') ? b : a
  const vuelta = ida === a ? b : a
  const origen = ida.origen || vuelta.destino || a.origen || b.origen
  const destino = ida.destino || vuelta.origen || a.destino || b.destino
  const code = extraerCodigoRuta(a) ?? extraerCodigoRuta(b)
  const base = origen && destino ? `${origen} ↔ ${destino}` : (ida.nombre || vuelta.nombre || 'Ruta')
  return code ? `${base} (${code} ida y vuelta)` : `${base} (ida y vuelta)`
}

function unificarIdaVuelta(lineas: Linea[], preferId?: number | null): Linea[] {
  const usados = new Set<number>()
  const res: Linea[] = []
  const ordenadas = [...lineas]
  for (const l of ordenadas) {
    if (usados.has(l.id)) continue
    let par: Linea | undefined
    for (const o of ordenadas) {
      if (o.id === l.id || usados.has(o.id)) continue
      if (esParIdaVuelta(l, o)) { par = o; break }
    }
    if (par) {
      usados.add(l.id)
      usados.add(par.id)
      const canon =
        preferId != null && l.id === preferId ? l :
        preferId != null && par.id === preferId ? par :
        /\bi\b/i.test(l.nombre ?? '') ? l :
        /\bi\b/i.test(par.nombre ?? '') ? par : l
      res.push({
        ...canon,
        nombre: nombreUnificado(l, par),
        origen: canon.origen ?? par.origen,
        destino: canon.destino ?? par.destino,
      })
    } else {
      usados.add(l.id)
      res.push(l)
    }
  }
  return res
}

export function useMapa(repo: LineasRepository, fixedLineaId?: number | null) {
  const lineasQuery = useAsync(() => repo.listar(), [repo])
  const { lineas, scoped } = useMemo(() => {
    const ordered = ordenarLineas(lineasQuery.data ?? [])
    if (fixedLineaId == null) return { lineas: ordered, scoped: false }
    const base = ordered.find((l) => l.id === fixedLineaId)
    const code = base ? extraerCodigoRuta(base) : null
    if (code) {
      const curadas = resolverSubrutasCuradas(code, ordered, fixedLineaId)
      if (curadas) return { lineas: curadas, scoped: true }
    }
    const grupo = lineasDeMismaRuta(ordered, fixedLineaId)
    return { lineas: unificarIdaVuelta(grupo, fixedLineaId), scoped: true }
  }, [lineasQuery.data, fixedLineaId])

  const [selectedId, setSelectedId] = useState<number | null>(null)

  useEffect(() => {
    if (lineas.length === 0) return
    if (selectedId != null && lineas.some((linea) => linea.id === selectedId)) return
    // En modo scoped prioriza la ruta asignada; si no está, la primera del grupo.
    if (fixedLineaId != null && lineas.some((linea) => linea.id === fixedLineaId)) {
      setSelectedId(fixedLineaId)
      return
    }
    setSelectedId(lineas[0].id)
  }, [lineas, selectedId, fixedLineaId])

  const selected = useMemo(
    () => lineas.find((linea) => linea.id === selectedId) ?? null,
    [lineas, selectedId],
  )

  const puntosQuery = useAsync(
    () => {
      if (!selected) return Promise.resolve([])
      // Rutas curadas sin correspondencia en BD usan ids sintéticos negativos
      if (selected.id < 0) return Promise.resolve([])
      return repo.puntosControl(selected.id)
    },
    [repo, selected?.id],
  )

  const reload = useCallback(() => {
    lineasQuery.reload()
    puntosQuery.reload()
  }, [lineasQuery.reload, puntosQuery.reload])

  return {
    lineas,
    selected,
    selectLinea: setSelectedId,
    puntos: puntosQuery.data ?? [],
    loadingLineas: lineasQuery.loading,
    loadingPuntos: puntosQuery.loading,
    error: lineasQuery.error ?? puntosQuery.error,
    reload,
    fixed: scoped,
  }
}
