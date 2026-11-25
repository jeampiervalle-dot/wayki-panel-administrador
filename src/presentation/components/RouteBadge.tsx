import { Box, type SxProps, type Theme } from '@mui/material'

/** Contraste legible para un color de línea arbitrario. */
function textoSobre(hex?: string): string {
  if (!hex || !/^#?[0-9a-f]{6}$/i.test(hex.replace('#', ''))) return '#FFFFFF'
  const limpio = hex.replace('#', '')
  const r = parseInt(limpio.slice(0, 2), 16)
  const g = parseInt(limpio.slice(2, 4), 16)
  const b = parseInt(limpio.slice(4, 6), 16)
  const luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminancia > 0.62 ? '#3D4365' : '#FFFFFF'
}

/**
 * Ficha de línea / ruta con aire de cartel de transporte.
 * Es el elemento distintivo del panel: se usa en líneas, rutas y mapa.
 */
export function RouteBadge({
  code,
  color,
  size = 'md',
  title,
  sx,
}: {
  code: string
  color?: string
  size?: 'sm' | 'md' | 'lg'
  title?: string
  sx?: SxProps<Theme>
}) {
  const dimensiones = {
    sm: { minWidth: 26, height: 26, px: 0.6, fontSize: 14 },
    md: { minWidth: 36, height: 36, px: 0.8, fontSize: 19 },
    lg: { minWidth: 52, height: 52, px: 1.2, fontSize: 28 },
  }[size]

  return (
    <Box
      title={title}
      sx={{
        display: 'inline-grid',
        placeItems: 'center',
        flexShrink: 0,
        borderRadius: 1,
        bgcolor: color ?? 'primary.main',
        color: color ? textoSobre(color) : 'primary.contrastText',
        fontFamily: '"Unbounded", sans-serif',
        fontWeight: 700,
        lineHeight: 1,
        letterSpacing: '0.02em',
        userSelect: 'none',
        ...dimensiones,
        ...sx,
      }}
    >
      {code}
    </Box>
  )
}
