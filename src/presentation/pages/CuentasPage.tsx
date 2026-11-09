import { useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/DeleteOutlineRounded'
import { toErrorMessage } from '../../domain/errors'
import type { Usuario } from '../../domain/models'
import { useUsuarios } from '../../application/useUsuarios'
import { useDependencies } from '../../app/providers'
import { FeedbackAlert } from '../components/FeedbackAlert'
import { PageHeader } from '../components/PageHeader'

export default function CuentasPage() {
  const { usuarios: usuariosRepo } = useDependencies()
  const { usuarios, loading, error, reload, cambiarRol, eliminar } = useUsuarios(usuariosRepo)
  const [msg, setMsg] = useState<string | null>(null)

  async function handleEliminar(usuario: Usuario) {
    if (!confirm(`¿Eliminar la cuenta de ${usuario.nombre} (${usuario.dni})?`)) return
    try {
      await eliminar(usuario.id)
      setMsg('Cuenta eliminada.')
    } catch (cause) {
      setMsg(`No se pudo eliminar (¿endpoint no disponible?): ${toErrorMessage(cause)}`)
    }
  }

  async function handleCambiarRol(usuario: Usuario) {
    const rol = usuario.rol === 'ADMIN' ? 'CHOFER' : 'ADMIN'
    try {
      await cambiarRol(usuario.id, rol)
      setMsg(`Rol actualizado a ${rol}.`)
    } catch (cause) {
      setMsg(`No se pudo actualizar (¿endpoint no disponible?): ${toErrorMessage(cause)}`)
    }
  }

  return (
    <Stack spacing={2}>
      <PageHeader title="Cuentas" onRefresh={reload} />
      <Typography color="text.secondary">
        Usuarios registrados. Puedes actualizar o eliminar (si el backend expone los endpoints; si
        no, verás el aviso).
      </Typography>

      <FeedbackAlert message={msg} onClose={() => setMsg(null)} />

      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="warning" sx={{ borderRadius: 3 }}>
          {error}
        </Alert>
      ) : (
        <Stack spacing={1.5}>
          {usuarios.map((usuario) => (
            <Card key={usuario.id} variant="outlined">
              <CardContent>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.5}
                  alignItems={{ sm: 'center' }}
                  justifyContent="space-between"
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      {(usuario.nombre || '?').slice(0, 1)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{usuario.nombre}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        DNI {usuario.dni} · {usuario.telefono || 's/tel'} ·{' '}
                        {usuario.email || 's/email'}
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                    <Chip
                      label={usuario.rol || 'CHOFER'}
                      color={usuario.rol === 'ADMIN' ? 'primary' : 'default'}
                    />
                    <Chip label={usuario.isOnline ? 'En línea' : 'Offline'} variant="outlined" />
                    <Button size="small" onClick={() => handleCambiarRol(usuario)}>
                      Cambiar rol
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleEliminar(usuario)}
                    >
                      Eliminar
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
          {usuarios.length === 0 && (
            <Alert severity="info" sx={{ borderRadius: 3 }}>
              No hay usuarios para mostrar.
            </Alert>
          )}
        </Stack>
      )}
    </Stack>
  )
}
