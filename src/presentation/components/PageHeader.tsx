import type { ReactNode } from 'react'
import { Box, Button, Stack, Typography } from '@mui/material'
import RefreshIcon from '@mui/icons-material/RefreshRounded'

export function PageHeader({
  title,
  description,
  onRefresh,
  actions,
}: {
  title: string
  description?: string
  onRefresh?: () => void
  actions?: ReactNode
}) {
  return (
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={2}
      sx={{ alignItems: { sm: 'flex-end' }, justifyContent: 'space-between', mb: 0.5 }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h4" component="h1">
          {title}
        </Typography>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 760 }}>
            {description}
          </Typography>
        )}
      </Box>
      {(actions || onRefresh) && (
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', flexShrink: 0 }}>
          {actions}
          {onRefresh && (
            <Button size="small" variant="outlined" startIcon={<RefreshIcon />} onClick={onRefresh}>
              Refrescar
            </Button>
          )}
        </Stack>
      )}
    </Stack>
  )
}
