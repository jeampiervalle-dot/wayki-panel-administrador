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

  const actualizar = useCallback(
    async (id: number, datos: DatosUnidad): Promise<Unidad> => {
      const actualizada = await repo.actualizar(id, datos)
      reload()
      return actualizada
    },
    [repo, reload],
  )

  const eliminar = useCallback(
    async (id: number): Promise<string | null> => {
      const mensaje = await repo.eliminar(id)
      reload()
      return mensaje
    },
    [repo, reload],
  )

  return {
    unidades: query.data ?? [],
    loading: query.loading,
    error: query.error,
    reload,
    crear,
    actualizar,
    eliminar,
  }
}
