// ============================================================
// Aplicación: catálogo de subrutas por línea.
// Las subrutas viven en el backend Java (/rutas/catalogo), que
// lee la misma gowayki_db. Se emparejan con las líneas del
// backend Django por nombre (y por código SIT cuando aparece).
// ============================================================

import { useCallback, useMemo } from 'react'
import type { Linea, RutaSmartBus } from '../domain/models'
import { useDependencies } from '../app/providers'
import { useAsync } from './useAsync'

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function sinPrefijoCodigo(nombre: string): string {
  return nombre.replace(/^C\d{1,2}\s*[-:]\s*/i, '').trim()
}

function codigoDe(linea: Linea): string | null {
  const texto = `${linea.nombre ?? ''} ${linea.corredor ?? ''}`
  return texto.match(/\bC\d{1,2}\b/i)?.[0]?.toUpperCase() ?? null
}

export function etiquetaSubruta(ruta: RutaSmartBus): string {
  return ruta.nombre?.trim() || ruta.longName || `${ruta.shortName} (${ruta.id})`
}

export function useSubrutas() {
  const { rutasMapa } = useDependencies()
  const consulta = useAsync(() => rutasMapa.rutas(), [rutasMapa])
  const rutas = useMemo(() => consulta.data ?? [], [consulta.data])

  const subrutasDe = useCallback(
    (linea?: Linea | null): RutaSmartBus[] => {
      if (!linea) return []
      const nombreLinea = normalizar(linea.nombre ?? '')
      const codigo = codigoDe(linea)
      return rutas.filter((ruta) => {
        if (codigo && ruta.agency.id?.toUpperCase() === codigo) return true
        const nombreAgencia = normalizar(sinPrefijoCodigo(ruta.agency.name ?? ''))
        return (
          !!nombreLinea &&
          (nombreAgencia === nombreLinea ||
            nombreAgencia.includes(nombreLinea) ||
            nombreLinea.includes(nombreAgencia))
        )
      })
    },
    [rutas],
  )

  const subrutaPorId = useCallback(
    (id?: string | null): RutaSmartBus | null => {
      if (!id) return null
      return rutas.find((ruta) => ruta.id === id) ?? null
    },
    [rutas],
  )

  return {
    subrutasDe,
    subrutaPorId,
    rutas,
    loading: consulta.loading,
    error: consulta.error,
  }
}
