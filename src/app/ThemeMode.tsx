import { useMemo, useState, type ReactNode } from 'react'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { crearTema } from '../theme'
import { ThemeModeContext, CLAVE_TEMA, modoGuardado } from './themeContext'

export function ThemeModeProvider({ children }: { children: ReactNode }) {
  const [modo, setModo] = useState(modoGuardado)

  const valor = useMemo(
    () => ({
      modo,
      alternar: () =>
        setModo((actual) => {
          const siguiente = actual === 'light' ? ('dark' as const) : ('light' as const)
          try {
            localStorage.setItem(CLAVE_TEMA, siguiente)
          } catch {
            // almacenamiento no disponible
          }
          return siguiente
        }),
    }),
    [modo],
  )

  const tema = useMemo(() => crearTema(modo), [modo])

  return (
    <ThemeProvider theme={tema}>
      <CssBaseline />
      <ThemeModeContext.Provider value={valor}>{children}</ThemeModeContext.Provider>
    </ThemeProvider>
  )
}
