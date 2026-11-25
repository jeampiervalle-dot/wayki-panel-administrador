import type { ReactNode } from 'react'
import { Box, Stack, Typography } from '@mui/material'

/** Número de operación: cifra condensada, riel de color y etiqueta sobria. */
export function StatTile({
  value,
  label,
  detalle,
  color = 'primary.main',
  icono,
  onClick,
}: {
  value: ReactNode
  label: string
  detalle?: string
  color?: string
  icono?: ReactNode
  onClick?: () => void
}) {
  return (
    <Box
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onClick()
              }
            }
          : undefined
      }
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        minHeight: 104,
        pl: 2.25,
        pr: 2,
        py: 1.75,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        ...(onClick
          ? { cursor: 'pointer', '&:hover': { borderColor: color, bgcolor: 'action.hover' } }
          : {}),
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          bgcolor: color,
        },
        '&:focus-visible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: 2 },
      }}
    >
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography
          sx={{
            fontFamily: '"Unbounded", sans-serif',
            fontSize: '2.9rem',
            fontWeight: 700,
            lineHeight: 0.95,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {value}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.75 }}>
          {label}
        </Typography>
        {detalle && (
          <Typography variant="caption" color="text.secondary">
            {detalle}
          </Typography>
        )}
      </Box>
      {icono && (
        <Stack
          sx={{
            width: 44,
            height: 44,
            borderRadius: 1.5,
            display: 'grid',
            placeItems: 'center',
            bgcolor: 'action.hover',
            color,
            fontSize: 24,
          }}
        >
          {icono}
        </Stack>
      )}
    </Box>
  )
}
