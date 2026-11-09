import type { DatosLinea, Linea, PuntoControl } from '../../domain/models'
import type { LineasRepository } from '../../domain/ports'
import type { HttpClient } from '../httpClient'
import { toLinea, toList, toPuntoControl } from '../mappers'

export function createLineasRepository(http: HttpClient): LineasRepository {
  return {
    async listar(): Promise<Linea[]> {
      return toList(await http.get<unknown>('/lineas'), toLinea)
    },

    async obtener(id: number): Promise<Linea> {
      return toLinea(await http.get<unknown>(`/lineas/${id}`))
    },

    async crear(datos: DatosLinea): Promise<Linea> {
      return toLinea(await http.post<unknown>('/lineas', datos))
    },

    async actualizar(id: number, datos: DatosLinea): Promise<Linea> {
      return toLinea(await http.patch<unknown>(`/lineas/${id}`, datos))
    },

    async eliminar(id: number): Promise<void> {
      await http.delete<unknown>(`/lineas/${id}`)
    },

    async puntosControl(lineaId: number): Promise<PuntoControl[]> {
      return toList(
        await http.get<unknown>(`/lineas/${lineaId}/puntos-control`),
        toPuntoControl,
      )
    },
  }
}
