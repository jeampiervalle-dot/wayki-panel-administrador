import { Button, Stack, Typography } from '@mui/material'
import RefreshIcon from '@mui/icons-material/RefreshRounded'

export function PageHeader({ title, onRefresh }: { title: string; onRefresh?: () => void }) {
  return (
    <Stack direction="row" sx={{ alignItems: 'center' }}>
      <Typography variant="h4" sx={{ flex: 1 }}>
        {title}
      </Typography>
      {onRefresh && (
        <Button startIcon={<RefreshIcon />} onClick={onRefresh}>
          Refrescar
        </Button>
      )}
    </Stack>
  )
}
