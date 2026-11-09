import type { EstadoRepository } from '../domain/ports'
import { useAsync } from './useAsync'

export function useEstado(repo: EstadoRepository) {
  const query = useAsync(() => repo.consultar(), [repo])

  return {
    estado: query.data,
    loading: query.loading,
    error: query.error,
    reload: query.reload,
  }
}
