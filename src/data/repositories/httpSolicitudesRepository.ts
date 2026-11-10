import type { SolicitudRegistro } from '../../domain/models'
import type { SolicitudesRepository } from '../../domain/ports'
import type { HttpClient } from '../httpClient'
import { toList, toSolicitudRegistro } from '../mappers'

export function createSolicitudesRepository(http: HttpClient): SolicitudesRepository {
  return {
    async listar(): Promise<SolicitudRegistro[]> {
      return toList(await http.get<unknown>('/solicitudes-registro'), toSolicitudRegistro)
    },

    async aprobar(id: number | string, usuarioAsignado?: string): Promise<SolicitudRegistro> {
      const raw = await http.patch<unknown>(`/solicitudes-registro/${id}`, {
        estado: 'APROBADA',
        usuarioAsignado,
      })
      return toSolicitudRegistro(raw)
    },

    async rechazar(id: number | string): Promise<SolicitudRegistro> {
      const raw = await http.patch<unknown>(`/solicitudes-registro/${id}`, {
        estado: 'RECHAZADA',
      })
      return toSolicitudRegistro(raw)
    },
  }
}
