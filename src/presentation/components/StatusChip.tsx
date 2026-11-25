import { Chip, type ChipProps } from '@mui/material'

const COLORES_ESTADO: Record<string, ChipProps['color']> = {
  PENDIENTE: 'warning',
  APROBADA: 'success',
  APROBADO: 'success',
  RECHAZADA: 'error',
  RECHAZADO: 'error',
  OPERATIVA: 'success',
  BAJA: 'default',
  MANTENIMIENTO: 'warning',
  ADMIN: 'primary',
  JEFE_RUTA: 'secondary',
  CHOFER: 'default',
}

/** Pastilla de estado con vocabulario único en todo el panel. */
export function StatusChip({ estado, label }: { estado: string; label?: string }) {
  return (
    <Chip
      size="small"
      color={COLORES_ESTADO[estado] ?? 'default'}
      variant={COLORES_ESTADO[estado] ? 'filled' : 'outlined'}
      label={label ?? estado}
    />
  )
}
