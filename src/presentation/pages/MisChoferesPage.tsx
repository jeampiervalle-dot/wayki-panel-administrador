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
import { useUsuarios } from '../../application/useUsuarios'
import { useDependencies, useSession } from '../../app/providers'
import { PageHeader } from '../components/PageHeader'

export default function MisChoferesPage() {
  const { sesion } = useSession()
  const { usuarios: usuariosRepo } = useDependencies()
  const { usuarios, loading, error, reload } = useUsuarios(usuariosRepo)

  const lineaId = sesion?.usuario.lineaId
  let choferes = usuarios.filter((u) => u.rol === 'CHOFER')
  if (lineaId != null) choferes = choferes.filter((u) => u.lineaId === lineaId)

  return (
    <Stack spacing={2}>
      <PageHeader title="Mis choferes" onRefresh={reload} />
      <Typography color="text.secondary">
        Choferes de tu ruta. La asignación de combi y el alcance por línea se completan cuando el backend exponga
        <code> lineaId</code> y la relación chofer↔unidad.
      </Typography>

      {lineaId == null && (
        <Alert severity="info" sx={{ borderRadius: 3 }}>
          Sin línea asociada a tu cuenta: se muestran los choferes del sistema como referencia.
        </Alert>
      )}

      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="warning" sx={{ borderRadius: 3 }}>
          {error}
        </Alert>
      ) : (
        <Stack spacing={1.5}>
          {choferes.map((u) => (
            <Card key={u.id} variant="outlined">
              <CardContent>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} justifyContent="space-between">
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{ bgcolor: 'primary.main' }}>{(u.nombre || '?').slice(0, 1)}</Avatar>
                    <Box>
                      <Typography variant="h6">{u.nombre}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        DNI {u.dni} · {u.telefono || 's/tel'} · {u.email || 's/email'}
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Chip label={u.rol} />
                    <Chip label={u.isOnline ? 'En línea' : 'Offline'} variant="outlined" />
                    {u.lineaNombre && <Chip label={u.lineaNombre} color="primary" variant="outlined" />}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
          {choferes.length === 0 && (
            <Alert severity="info" sx={{ borderRadius: 3 }}>
              No hay choferes para mostrar en tu ruta.
            </Alert>
          )}
        </Stack>
      )}
    </Stack>
  )
}
