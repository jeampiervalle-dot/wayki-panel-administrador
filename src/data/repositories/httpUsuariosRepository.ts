import type { Usuario } from '../../domain/models'
import type { UsuariosRepository } from '../../domain/ports'
import type { HttpClient } from '../httpClient'
import { toList, toUsuario } from '../mappers'

export function createUsuariosRepository(http: HttpClient): UsuariosRepository {
  return {
    async listar(): Promise<Usuario[]> {
      return toList(await http.get<unknown>('/usuarios'), toUsuario)
    },

    async actualizarRol(id: string, rol: string): Promise<void> {
      await http.patch<unknown>(`/usuarios/${id}`, { rol })
    },

    async eliminar(id: string): Promise<void> {
      await http.delete<unknown>(`/usuarios/${id}`)
    },
  }
}
