import type { ReactNode } from 'react'
import { Box, Stack } from '@mui/material'

/**
 * Fila de datos densa. Reemplaza la pila de tarjetas idénticas:
 * una sola superficie, separadores finos y jerarquía clara.
 */
export function ListRow({
  leading,
  title,
  subtitle,
  meta,
  actions,
  children,
  onClick,
}: {
  leading?: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  meta?: ReactNode
  actions?: ReactNode
  children?: ReactNode
  onClick?: () => void
}) {
  return (
    <Box
      onClick={onClick}
      sx={{
        px: { xs: 1.5, sm: 2 },
        py: 1.75,
        borderBottom: '1px solid',
        borderColor: 'divider',
        transition: 'background-color 120ms ease',
        ...(onClick
          ? {
              cursor: 'pointer',
              '&:hover': { bgcolor: 'action.hover' },
              '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -2 },
            }
          : {}),
        '&:last-child': { borderBottom: 'none' },
      }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'center' } }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
          {leading}
          <Box sx={{ minWidth: 0 }}>
            {title}
            {subtitle}
          </Box>
        </Stack>
        {(meta || actions) && (
          <Stack
            direction="row"
            spacing={0.75}
            useFlexGap
            sx={{ alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}
          >
            {meta}
            {actions}
          </Stack>
        )}
      </Stack>
      {children}
    </Box>
  )
}

/** Contenedor de filas con una sola superficie. */
export function ListPanel({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      {children}
    </Box>
  )
}
