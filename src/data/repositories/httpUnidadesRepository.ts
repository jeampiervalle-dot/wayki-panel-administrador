import type { DatosUnidad, Unidad } from '../../domain/models'
import type { UnidadesRepository } from '../../domain/ports'
import type { HttpClient } from '../httpClient'
import { toList, toUnidad } from '../mappers'

export function createUnidadesRepository(http: HttpClient): UnidadesRepository {
  return {
    async listar(): Promise<Unidad[]> {
      return toList(await http.get<unknown>('/unidades'), toUnidad)
    },

    async listarPorLinea(lineaId: number): Promise<Unidad[]> {
      return toList(await http.get<unknown>(`/lineas/${lineaId}/unidades`), toUnidad)
    },

    async crear(datos: DatosUnidad): Promise<Unidad> {
      return toUnidad(await http.post<unknown>('/unidades', datos))
    },

    async actualizar(id: number, datos: DatosUnidad): Promise<Unidad> {
      return toUnidad(await http.patch<unknown>(`/unidades/${id}`, datos))
    },

    async eliminar(id: number): Promise<void> {
      await http.delete<unknown>(`/unidades/${id}`)
    },
  }
}
