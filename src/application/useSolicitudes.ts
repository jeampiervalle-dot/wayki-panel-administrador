import { useCallback } from 'react'
import type { SolicitudRegistro } from '../domain/models'
import type { SolicitudesRepository } from '../domain/ports'
import { useAsync } from './useAsync'

export function useSolicitudes(
  repo: SolicitudesRepository,
  rol?: string,
  subrutaId?: number,
  habilitado = true,
) {
  // Un jefe sin subruta resuelta no debe consultar el catálogo completo: se
  // devuelve una lista vacía sin llegar al backend.
  const query = useAsync(
    () => (habilitado ? repo.listar(rol, subrutaId) : Promise.resolve([] as SolicitudRegistro[])),
    [repo, rol, subrutaId, habilitado],
  )
  const { reload } = query

  const aprobar = useCallback(
    async (id: number | string, usuarioAsignado?: string): Promise<SolicitudRegistro> => {
      const result = await repo.aprobar(id, usuarioAsignado)
      reload()
      return result
    },
    [repo, reload],
  )

  const rechazar = useCallback(
    async (id: number | string): Promise<SolicitudRegistro> => {
      const result = await repo.rechazar(id)
      reload()
      return result
    },
    [repo, reload],
  )

  return {
    solicitudes: query.data ?? [],
    loading: query.loading,
    error: query.error,
    reload,
    aprobar,
    rechazar,
  }
}
