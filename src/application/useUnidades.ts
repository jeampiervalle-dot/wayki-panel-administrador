import { useCallback } from 'react'
import type { DatosUnidad, Unidad } from '../domain/models'
import type { UnidadesRepository } from '../domain/ports'
import { useAsync } from './useAsync'

export function useUnidades(repo: UnidadesRepository) {
  const query = useAsync(() => repo.listar(), [repo])
  const { reload } = query

  const crear = useCallback(
    async (datos: DatosUnidad): Promise<Unidad> => {
      const creada = await repo.crear(datos)
      reload()
      return creada
    },
    [repo, reload],
  )

  const eliminar = useCallback(
    async (id: number): Promise<void> => {
      await repo.eliminar(id)
      reload()
    },
    [repo, reload],
  )

  return {
    unidades: query.data ?? [],
    loading: query.loading,
    error: query.error,
    reload,
    crear,
    eliminar,
  }
}
