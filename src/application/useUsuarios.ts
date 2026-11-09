import { useCallback } from 'react'
import type { UsuariosRepository } from '../domain/ports'
import { useAsync } from './useAsync'

export function useUsuarios(repo: UsuariosRepository) {
  const query = useAsync(() => repo.listar(), [repo])
  const { reload } = query

  const cambiarRol = useCallback(
    async (id: string, rol: string): Promise<void> => {
      await repo.actualizarRol(id, rol)
      reload()
    },
    [repo, reload],
  )

  const eliminar = useCallback(
    async (id: string): Promise<void> => {
      await repo.eliminar(id)
      reload()
    },
    [repo, reload],
  )

  return {
    usuarios: query.data ?? [],
    loading: query.loading,
    error: query.error,
    reload,
    cambiarRol,
    eliminar,
  }
}
