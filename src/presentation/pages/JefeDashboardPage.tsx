import type { ReactNode } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material'
import GroupsIcon from '@mui/icons-material/GroupsRounded'
import DirectionsBusIcon from '@mui/icons-material/DirectionsBusRounded'
import { useUsuarios } from '../../application/useUsuarios'
import { useUnidades } from '../../application/useUnidades'
import { useDependencies, useSession } from '../../app/providers'

function StatCard({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <Card sx={{ flex: 1 }}>
      <CardContent>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ bgcolor: 'primary.main' }}>{icon}</Avatar>
          <Box>
            <Typography variant="h5">{value}</Typography>
            <Typography color="text.secondary" variant="body2">
              {label}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default function JefeDashboardPage() {
  const { sesion } = useSession()
  const { usuarios: usuariosRepo, unidades: unidadesRepo } = useDependencies()
  const usuarios = useUsuarios(usuariosRepo)
  const unidades = useUnidades(unidadesRepo)

  const usuario = sesion?.usuario
  const lineaId = usuario?.lineaId

  const choferes = usuarios.usuarios.filter((u) => u.rol === 'CHOFER')
  const choferesEnRuta = lineaId != null ? choferes.filter((u) => u.lineaId === lineaId) : choferes
  const unidadesRuta = lineaId != null ? unidades.unidades.filter((u) => u.lineaId === lineaId) : unidades.unidades
  const sinAlcance = lineaId == null

  const loading = usuarios.loading || unidades.loading

  return (
    <Stack spacing={2.5}>
      <Typography variant="h4">Mi ruta</Typography>
      <Typography color="text.secondary">
        Panel del jefe de ruta: solicitudes de choferes, asignación de combis y estado de tu línea.
      </Typography>

      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
        <Chip label={usuario?.lineaNombre ? `Línea: ${usuario.lineaNombre}` : 'Línea: no asignada'} color="primary" />
        {usuario?.lineaId != null && <Chip label={`ID ${usuario.lineaId}`} variant="outlined" />}
      </Stack>

      {sinAlcance && (
        <Alert severity="info" sx={{ borderRadius: 3 }}>
          Tu cuenta aún no tiene una <code>lineaId</code> asociada en el backend. Los conteos se muestran de forma
          general; cuando el backend asigne tu línea, se filtrarán automáticamente a tu ruta.
        </Alert>
      )}

      {loading ? (
        <CircularProgress />
      ) : (
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <StatCard icon={<GroupsIcon />} label="Choferes en la ruta" value={choferesEnRuta.length} />
          <StatCard icon={<DirectionsBusIcon />} label="Combis en la ruta" value={unidadesRuta.length} />
        </Stack>
      )}

      {(usuarios.error || unidades.error) && (
        <Alert severity="warning" sx={{ borderRadius: 3 }}>
          {usuarios.error || unidades.error}
        </Alert>
      )}
    </Stack>
  )
}
