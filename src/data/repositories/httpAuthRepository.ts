import type { Credenciales, NuevoUsuario, Sesion } from '../../domain/models'
import type { AuthRepository } from '../../domain/ports'
import type { HttpClient } from '../httpClient'
import { assertSuccess, toSesion } from '../mappers'

export function createAuthRepository(http: HttpClient): AuthRepository {
  return {
    async iniciarSesion(credenciales: Credenciales): Promise<Sesion> {
      const raw = await http.post<unknown>('/auth/login', credenciales)
      return toSesion(raw)
    },

    async registrar(datos: NuevoUsuario): Promise<void> {
      const raw = await http.post<unknown>('/auth/registro', datos)
      assertSuccess(raw, 'No se pudo crear la cuenta')
    },
  }
}
