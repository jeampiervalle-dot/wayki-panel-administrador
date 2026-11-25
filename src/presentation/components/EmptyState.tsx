import type { ReactNode } from 'react'
import { Box, Stack, Typography } from '@mui/material'

/**Estado vacío con dirección: dice qué falta y qué se puede hacer. */
export function EmptyState({
  titulo,
  detalle,
  icono,
  accion,
}: {
  titulo: string
  detalle?: string
  icono?: ReactNode
  accion?: ReactNode
}) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      sx={{
        alignItems: { sm: 'center' },
        justifyContent: 'space-between',
        p: 3,
        border: '1px dashed',
        borderColor: 'divider',
        borderRadius: 2,
        bgcolor: 'background.paper',
      }}
    >
      <Stack direction="row" spacing={1.75} sx={{ alignItems: 'center', minWidth: 0 }}>
        {icono && (
          <Box sx={{ color: 'text.secondary', display: 'flex', fontSize: 28 }}>{icono}</Box>
        )}
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1">{titulo}</Typography>
          {detalle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {detalle}
            </Typography>
          )}
        </Box>
      </Stack>
      {accion}
    </Stack>
  )
}
