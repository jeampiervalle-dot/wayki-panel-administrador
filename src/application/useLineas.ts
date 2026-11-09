import { useCallback } from 'react'
import type { DatosLinea, Linea } from '../domain/models'
import type { LineasRepository } from '../domain/ports'
import { useAsync } from './useAsync'

export function useLineas(repo: LineasRepository) {
  const query = useAsync(() => repo.listar(), [repo])
  const { reload } = query

  const crear = useCallback(
    async (datos: DatosLinea): Promise<Linea> => {
      const creada = await repo.crear(datos)
      reload()
      return creada
    },
    [repo, reload],
  )

  const actualizar = useCallback(
    async (id: number, datos: DatosLinea): Promise<Linea> => {
      const actualizada = await repo.actualizar(id, datos)
      reload()
      return actualizada
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
    lineas: query.data ?? [],
    loading: query.loading,
    error: query.error,
    reload,
    crear,
    actualizar,
    eliminar,
  }
}
