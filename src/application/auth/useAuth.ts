import { useCallback, useEffect, useState } from 'react'
import type { Credenciales, NuevoUsuario, Sesion, Usuario } from '../../domain/models'
import type { AuthRepository, SessionStore } from '../../domain/ports'
import { subrutaStore } from '../../data/subrutaStore'

export interface AuthState {
  sesion: Sesion | null
  iniciarSesion: (credenciales: Credenciales) => Promise<Sesion>
  registrar: (datos: NuevoUsuario) => Promise<void>
  cerrarSesion: () => void
  /** Refresca los datos del usuario con lo que diga la BD (p. ej. su línea). */
  actualizarUsuario: (usuario: Usuario) => void
}

import { registrarAlNoAutorizado, setAuthToken } from '../../data/http/client'

export function useAuth(auth: AuthRepository, sessionStore: SessionStore): AuthState {
  const [sesion, setSesion] = useState<Sesion | null>(() => sessionStore.leer())

  const cerrarSesion = useCallback(() => {
    sessionStore.limpiar()
    setAuthToken(null)
    setSesion(null)
  }, [sessionStore])

  // Si el backend responde 401, el cliente HTTP descarta la sesión y avisa.
  useEffect(() => registrarAlNoAutorizado(cerrarSesion), [cerrarSesion])

  const iniciarSesion = useCallback(
    async (credenciales: Credenciales) => {
      // El login debe ir sin Authorization: si queda un token viejo en el
      // módulo HTTP, el backend lo rechaza antes de validar DNI/PIN.
      setAuthToken(null)
      const respuesta = await auth.iniciarSesion(credenciales)
      // La subruta elegida al registrarse se guardó en este navegador; el
      // backend todavía no la devuelve en el login.
      const guardada = subrutaStore.leerUsuario(credenciales.dni)
      const usuario: Usuario = {
        ...respuesta.usuario,
        subrutaId: respuesta.usuario.subrutaId ?? guardada?.subrutaId,
        subrutaDbId: respuesta.usuario.subrutaDbId ?? guardada?.subrutaDbId,
        nombreSubruta: respuesta.usuario.nombreSubruta ?? guardada?.nombreSubruta,
        lineaId: respuesta.usuario.lineaId ?? guardada?.lineaId,
        lineaNombre: respuesta.usuario.lineaNombre ?? guardada?.nombreLinea,
      }
      const nueva: Sesion = { ...respuesta, usuario }
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
      if (datos.lineaId != null && datos.subrutaId) {
        subrutaStore.guardarUsuario(datos.dni, {
          lineaId: datos.lineaId,
          nombreLinea: datos.nombreLinea ?? '',
          codigoLinea: datos.codigoLinea,
          subrutaId: datos.subrutaId,
          subrutaDbId: datos.subrutaDbId,
          nombreSubruta: datos.nombreSubruta ?? datos.subrutaId,
        })
      }
    },
    [auth],
  )

  const actualizarUsuario = useCallback(
    (usuario: Usuario) => {
      setSesion((actual) => {
        if (!actual) return actual
        // El refresco desde /usuarios no devuelve línea ni subruta: sin este
        // coalescido, un jefe perdería la ruta asignada al recargar la sesión.
        const guardada = usuario.dni ? subrutaStore.leerUsuario(usuario.dni) : null
        const fusionado: Usuario = {
          ...usuario,
          lineaId: usuario.lineaId ?? actual.usuario.lineaId ?? guardada?.lineaId,
          lineaNombre: usuario.lineaNombre ?? actual.usuario.lineaNombre ?? guardada?.nombreLinea,
          subrutaId: usuario.subrutaId ?? actual.usuario.subrutaId ?? guardada?.subrutaId,
          subrutaDbId: usuario.subrutaDbId ?? actual.usuario.subrutaDbId ?? guardada?.subrutaDbId,
          nombreSubruta:
            usuario.nombreSubruta ?? actual.usuario.nombreSubruta ?? guardada?.nombreSubruta,
        }
        const nueva: Sesion = { ...actual, usuario: fusionado }
        sessionStore.guardar(nueva)
        return nueva
      })
    },
    [sessionStore],
  )

  return { sesion, iniciarSesion, registrar, cerrarSesion, actualizarUsuario }
}
