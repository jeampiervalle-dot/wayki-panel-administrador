import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Linea } from '../domain/models'
import type { LineasRepository } from '../domain/ports'
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

export function useMapa(repo: LineasRepository) {
  const lineasQuery = useAsync(() => repo.listar(), [repo])
  const lineas = useMemo(() => ordenarLineas(lineasQuery.data ?? []), [lineasQuery.data])

  const [selectedId, setSelectedId] = useState<number | null>(null)

  useEffect(() => {
    if (lineas.length === 0) return
    if (selectedId === null || !lineas.some((linea) => linea.id === selectedId)) {
      setSelectedId(lineas[0].id)
    }
  }, [lineas, selectedId])

  const selected = useMemo(
    () => lineas.find((linea) => linea.id === selectedId) ?? null,
    [lineas, selectedId],
  )

  const puntosQuery = useAsync(
    () => (selected ? repo.puntosControl(selected.id) : Promise.resolve([])),
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
  }
}
