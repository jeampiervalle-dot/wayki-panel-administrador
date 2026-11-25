import { createTheme } from '@mui/material/styles'

export type ModoTema = 'light' | 'dark'

/**
 * Paleta compartida con la app móvil Wayki Nest (AppColors).
 * El panel mantiene su estructura, pero usa exactamente los mismos tokens.
 */
export const COLORES = {
  primary: '#7B82A0',
  primaryDark: '#9BA3C0',
  secondary: '#D5C5D5',
  secondaryDark: '#4A4560',
  neutral: '#3D4365',
  white: '#FFFFFF',
  softSage: '#F1ECF0',
  appBackground: '#FFFDF6',
  steel: '#D5C5D5',
  slate: '#6B6E8A',
  ink: '#3D4365',
  onPrimary: '#FFFFFF',
  onSecondary: '#3D4365',
  tertiary: '#6B6E8A',
  backgroundDark: '#12131A',
  surfaceDark: '#1E1F2A',
  slateDark: '#A0A3B8',
  inkDark: '#E8E9F2',
  error: '#B42318',
  errorDark: '#CF6679',
} as const

const TIPOGRAFIA_UI = '"Inter", system-ui, -apple-system, sans-serif'
const TIPOGRAFIA_DISPLAY = '"Unbounded", "Inter", sans-serif'

export function crearTema(modo: ModoTema) {
  const oscuro = modo === 'dark'

  return createTheme({
    cssVariables: true,
    palette: {
      mode: modo,
      primary: oscuro
        ? { main: COLORES.primaryDark, contrastText: COLORES.backgroundDark, dark: COLORES.primary, light: '#B9C0D6' }
        : { main: COLORES.primary, contrastText: COLORES.onPrimary, dark: '#5F6B87', light: COLORES.primaryDark },
      secondary: oscuro
        ? { main: COLORES.secondaryDark, contrastText: COLORES.inkDark }
        : { main: COLORES.secondary, contrastText: COLORES.onSecondary },
      error: { main: oscuro ? COLORES.errorDark : COLORES.error },
      success: { main: oscuro ? COLORES.inkDark : COLORES.neutral },
      warning: { main: oscuro ? COLORES.secondaryDark : COLORES.steel },
      info: { main: oscuro ? COLORES.slateDark : COLORES.slate },
      background: {
        default: oscuro ? COLORES.backgroundDark : COLORES.appBackground,
        paper: oscuro ? COLORES.surfaceDark : COLORES.white,
      },
      text: {
        primary: oscuro ? COLORES.inkDark : COLORES.ink,
        secondary: oscuro ? COLORES.slateDark : COLORES.slate,
      },
      divider: oscuro ? 'rgba(155,163,192,0.24)' : 'rgba(123,130,160,0.38)',
      action: {
        hover: oscuro ? 'rgba(255,255,255,0.06)' : 'rgba(61,67,101,0.05)',
        selected: oscuro ? 'rgba(155,163,192,0.16)' : 'rgba(123,130,160,0.16)',
      },
    },
    shape: { borderRadius: 10 },
    typography: {
      fontFamily: TIPOGRAFIA_UI,
      h1: { fontFamily: TIPOGRAFIA_DISPLAY, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.05 },
      h2: { fontFamily: TIPOGRAFIA_DISPLAY, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.08 },
      h3: { fontFamily: TIPOGRAFIA_DISPLAY, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.1 },
      h4: {
        fontFamily: TIPOGRAFIA_DISPLAY,
        fontWeight: 700,
        fontSize: '1.85rem',
        letterSpacing: '-0.02em',
        lineHeight: 1.15,
      },
      h5: { fontWeight: 700, fontSize: '1.2rem', lineHeight: 1.3 },
      h6: { fontWeight: 700, fontSize: '1rem', lineHeight: 1.35 },
      subtitle1: { fontWeight: 600 },
      subtitle2: { fontWeight: 600 },
      body1: { lineHeight: 1.55 },
      body2: { lineHeight: 1.5 },
      button: { textTransform: 'none', fontWeight: 600, letterSpacing: 0 },
      caption: { lineHeight: 1.45 },
      overline: { fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.09em' },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { fontFeatureSettings: '"tnum" 1' },
          '::selection': { backgroundColor: oscuro ? COLORES.secondaryDark : COLORES.secondary },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: 8, paddingInline: 16, paddingBlock: 8, minHeight: 36 },
          contained: { boxShadow: 'none', '&:hover': { boxShadow: 'none' } },
        },
      },
      MuiIconButton: { styleOverrides: { root: { borderRadius: 8 } } },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            border: '1px solid',
            borderColor: oscuro ? 'rgba(155,163,192,0.24)' : 'rgba(123,130,160,0.28)',
            boxShadow: 'none',
            backgroundImage: 'none',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
          rounded: { borderRadius: 12 },
        },
      },
      MuiDialog: { styleOverrides: { paper: { borderRadius: 14 } } },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 6, fontWeight: 600, fontSize: '0.75rem' },
        },
      },
      MuiAvatar: { styleOverrides: { root: { borderRadius: 8 } } },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            backgroundColor: oscuro ? 'rgba(255,255,255,0.04)' : COLORES.white,
            fontSize: '0.9rem',
          },
        },
      },
      MuiListItemButton: { styleOverrides: { root: { borderRadius: 8 } } },
      MuiTooltip: {
        styleOverrides: {
          tooltip: { fontSize: '0.75rem', borderRadius: 6, padding: '5px 9px' },
        },
      },
      MuiAlert: {
        styleOverrides: { root: { borderRadius: 10, alignItems: 'center' } },
      },
      MuiLinearProgress: { styleOverrides: { root: { borderRadius: 999, height: 6 } } },
    },
  })
}
