import type { ReactNode } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material'
import PeopleIcon from '@mui/icons-material/PeopleAltRounded'
import RouteIcon from '@mui/icons-material/AltRouteRounded'
import MapIcon from '@mui/icons-material/MapRounded'
import DirectionsBusIcon from '@mui/icons-material/DirectionsBusRounded'
import RefreshIcon from '@mui/icons-material/RefreshRounded'
import CheckCircleIcon from '@mui/icons-material/CheckCircleRounded'
import { config } from '../../config'
import { useEstado } from '../../application/useEstado'
import { useDependencies } from '../../app/providers'
import type { View } from '../../app/navigation'

interface AccessCard {
  title: string
  description: string
  view: View
  icon: ReactNode
}

const ACCESS_CARDS: AccessCard[] = [
  { title: 'Cuentas', description: 'Ver, actualizar o eliminar usuarios.', view: 'cuentas', icon: <PeopleIcon /> },
  { title: 'Rutas / Líneas', description: 'Crear, actualizar y eliminar rutas.', view: 'rutas', icon: <RouteIcon /> },
  { title: 'Mapa', description: 'Visualizar rutas y puntos de control.', view: 'mapa', icon: <MapIcon /> },
  { title: 'Unidades', description: 'Gestionar vehículos de la flota.', view: 'unidades', icon: <DirectionsBusIcon /> },
]

export default function DashboardPage({ onNavigate }: { onNavigate: (view: View) => void }) {
  const { estado: estadoRepo } = useDependencies()
  const estado = useEstado(estadoRepo)

  return (
    <Stack spacing={2.5}>
      <Typography variant="h4">Panel de control</Typography>
      <Typography color="text.secondary">
        Administración central (root): cuentas, rutas, unidades y mapa conectados a tu VPS.
      </Typography>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        {ACCESS_CARDS.map((card) => (
          <Card key={card.view} sx={{ flex: 1, cursor: 'pointer' }} onClick={() => onNavigate(card.view)}>
            <CardContent>
              <Stack spacing={1}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>{card.icon}</Avatar>
                <Typography variant="h6">{card.title}</Typography>
                <Typography color="text.secondary" variant="body2">
                  {card.description}
                </Typography>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Stack>

      <Card>
        <CardContent>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <CheckCircleIcon color={estado.error ? 'warning' : 'success'} />
            <Typography variant="h6">Estado del backend</Typography>
            <Box sx={{ flex: 1 }} />
            <Button size="small" startIcon={<RefreshIcon />} onClick={estado.reload}>
              Actualizar
            </Button>
          </Stack>
          {estado.loading ? (
            <CircularProgress size={22} />
          ) : estado.error ? (
            <Alert severity="warning" sx={{ borderRadius: 3 }}>
              No se pudo conectar a <code>{config.apiUrl || '(sin URL)'}</code>: {estado.error}
            </Alert>
          ) : (
            <Alert severity="success" sx={{ borderRadius: 3 }}>
              Conectado. Respuesta: <code>{JSON.stringify(estado.estado)}</code>
            </Alert>
          )}
        </CardContent>
      </Card>
    </Stack>
  )
}
