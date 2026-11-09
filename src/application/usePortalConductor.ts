import { useCallback, useState } from 'react'
import type { Credenciales, Sesion } from '../domain/models'
import type { AuthRepository, LineasRepository } from '../domain/ports'
import { useLineas } from './useLineas'

// El portal del conductor inicia su propia sesión sin reemplazar
// la sesión del administrador.
export function usePortalConductor(auth: AuthRepository, lineasRepo: LineasRepository) {
  const lineasQuery = useLineas(lineasRepo)
  const [sesion, setSesion] = useState<Sesion | null>(null)
  const [busy, setBusy] = useState(false)

  const iniciarSesion = useCallback(
    async (credenciales: Credenciales): Promise<Sesion> => {
      setBusy(true)
      try {
        const nueva = await auth.iniciarSesion(credenciales)
        setSesion(nueva)
        return nueva
      } finally {
        setBusy(false)
      }
    },
    [auth],
  )

  return {
    lineas: lineasQuery.lineas,
    loadingLineas: lineasQuery.loading,
    sesion,
    busy,
    iniciarSesion,
  }
}
