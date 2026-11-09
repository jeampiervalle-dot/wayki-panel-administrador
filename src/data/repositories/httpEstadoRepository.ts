import type { EstadoRepository } from '../../domain/ports'
import type { HttpClient } from '../httpClient'

export function createEstadoRepository(http: HttpClient): EstadoRepository {
  return {
    consultar(): Promise<unknown> {
      return http.get<unknown>('/estado')
    },
  }
}
