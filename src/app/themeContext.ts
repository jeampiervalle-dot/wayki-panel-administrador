import { createContext, useContext } from 'react'
import type { ModoTema } from '../theme'

export interface ThemeModeContextValue {
  modo: ModoTema
  alternar: () => void
}

export const ThemeModeContext = createContext<ThemeModeContextValue | null>(null)
export const CLAVE_TEMA = 'wayki-panel:tema'

export function modoGuardado(): ModoTema {
  try {
    return localStorage.getItem(CLAVE_TEMA) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function useThemeMode(): ThemeModeContextValue {
  const contexto = useContext(ThemeModeContext)
  if (!contexto) throw new Error('useThemeMode debe usarse dentro de <ThemeModeProvider>')
  return contexto
}
