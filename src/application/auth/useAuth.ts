import { useCallback, useState } from 'react'
import type { Credenciales, NuevoUsuario, Sesion } from '../../domain/models'
import type { AuthRepository, SessionStore } from '../../domain/ports'

export interface AuthState {
  sesion: Sesion | null
  iniciarSesion: (credenciales: Credenciales) => Promise<Sesion>
  registrar: (datos: NuevoUsuario) => Promise<void>
  cerrarSesion: () => void
}

import { setAuthToken } from '../../data/http/client'

export function useAuth(auth: AuthRepository, sessionStore: SessionStore): AuthState {
  const [sesion, setSesion] = useState<Sesion | null>(() => sessionStore.leer())

  const iniciarSesion = useCallback(
    async (credenciales: Credenciales) => {
      const nueva = await auth.iniciarSesion(credenciales)
      sessionStore.guardar(nueva)
      setAuthToken(nueva.token ?? null)
      setSesion(nueva)
      return nueva
    },
    [auth, sessionStore],
  )

  const registrar = useCallback(
    async (datos: NuevoUsuario) => {
      await auth.registrar(datos)
    },
    [auth],
  )

  const cerrarSesion = useCallback(() => {
    sessionStore.limpiar()
    setAuthToken(null)
    setSesion(null)
  }, [sessionStore])

  return { sesion, iniciarSesion, registrar, cerrarSesion }
}
