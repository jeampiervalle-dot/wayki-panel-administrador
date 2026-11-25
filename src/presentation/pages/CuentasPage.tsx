import { useState, type MouseEvent } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/DeleteOutlineRounded'
import SwitchAccessShortcutIcon from '@mui/icons-material/SwitchAccessShortcutRounded'
import { toErrorMessage } from '../../domain/errors'
import type { Usuario } from '../../domain/models'
import { useUsuarios } from '../../application/useUsuarios'
import { useDependencies } from '../../app/providers'
import { FeedbackAlert } from '../components/FeedbackAlert'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { ListPanel, ListRow } from '../components/ListRow'
import { StatusChip } from '../components/StatusChip'
import { RouteBadge } from '../components/RouteBadge'

function codigoLinea(usuario: Usuario): string {
  return (usuario.lineaNombre ?? '').match(/\bC\d{1,2}\b/i)?.[0]?.toUpperCase() ?? '—'
}

export default function CuentasPage() {
  const { usuarios: usuariosRepo } = useDependencies()
  const { usuarios, loading, error, reload, cambiarRol, eliminar } = useUsuarios(usuariosRepo)
  const [msg, setMsg] = useState<string | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)
  const [seleccionado, setSeleccionado] = useState<Usuario | null>(null)

  async function handleEliminar(usuario: Usuario) {
    if (!confirm(`¿Eliminar la cuenta de ${usuario.nombre} (${usuario.dni})?`)) return
    try {
      await eliminar(usuario.id)
      setMsg('Cuenta eliminada.')
    } catch (cause) {
      setMsg(`No se pudo eliminar la cuenta: ${toErrorMessage(cause)}`)
    }
  }

  function abrirMenu(usuario: Usuario, event: MouseEvent<HTMLElement>) {
    setSeleccionado(usuario)
    setMenuAnchor(event.currentTarget)
  }

  async function handleCambiarRol(rol: 'ADMIN' | 'JEFE_RUTA') {
    setMenuAnchor(null)
    if (!seleccionado || seleccionado.rol === rol) return
    if (!confirm(`¿Cambiar el rol de ${seleccionado.nombre} a ${rol === 'ADMIN' ? 'administrador' : 'jefe de ruta'}?`)) return
    try {
      await cambiarRol(seleccionado.id, rol)
      setMsg(`Rol de ${seleccionado.nombre} actualizado a ${rol}.`)
    } catch (cause) {
      setMsg(`No se pudo actualizar: ${toErrorMessage(cause)}`)
    }
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Cuentas"
        description="Jefes de ruta y administradores con acceso al panel. Los choferes se dan de alta desde la app y los aprueba el jefe de ruta."
        onRefresh={reload}
      />
      <FeedbackAlert message={msg} onClose={() => setMsg(null)} />

      {loading ? (
        <Box sx={{ p: 6, display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="warning">{error}</Alert>
      ) : usuarios.length === 0 ? (
        <EmptyState titulo="No hay cuentas registradas" detalle="Las cuentas aprobadas aparecerán aquí." />
      ) : (
        <ListPanel>
          {usuarios.map((usuario) => (
            <ListRow
              key={usuario.id}
              leading={
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                  <RouteBadge code={codigoLinea(usuario)} size="sm" />
                  <Avatar sx={{ bgcolor: 'action.hover', color: 'primary.main', width: 36, height: 36, fontSize: 15 }}>
                    {(usuario.nombre || '?').slice(0, 1)}
                  </Avatar>
                </Stack>
              }
              title={<Typography variant="subtitle2">{usuario.nombre}</Typography>}
              subtitle={
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    DNI {usuario.dni} · {usuario.telefono || 's/tel'} · {usuario.email || 's/email'}
                  </Typography>
                  <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: 'wrap', mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      {usuario.lineaNombre || 'Sin línea asignada'}
                    </Typography>
                    {usuario.nombreSubruta && (
                      <Typography variant="caption" color="text.secondary">· {usuario.nombreSubruta}</Typography>
                    )}
                  </Stack>
                </Box>
              }
              meta={
                <>
                  <StatusChip estado={usuario.rol} />
                  <StatusChip estado={usuario.isOnline ? 'EN_LINEA' : 'OFFLINE'} label={usuario.isOnline ? 'En línea' : 'Offline'} />
                </>
              }
              actions={
                usuario.rol !== 'CHOFER' ? (
                  <>
                    <Button size="small" startIcon={<SwitchAccessShortcutIcon />} onClick={(event) => abrirMenu(usuario, event)}>
                      Cambiar rol
                    </Button>
                    <Button size="small" color="error" variant="outlined" startIcon={<DeleteIcon />} onClick={() => handleEliminar(usuario)}>
                      Eliminar
                    </Button>
                  </>
                ) : undefined
              }
            />
          ))}
        </ListPanel>
      )}

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        <MenuItem disabled sx={{ opacity: 1 }}>
          <Typography variant="caption" color="text.secondary">Nuevo rol para {seleccionado?.nombre}</Typography>
        </MenuItem>
        <MenuItem onClick={() => handleCambiarRol('ADMIN')} selected={seleccionado?.rol === 'ADMIN'}>Administrador</MenuItem>
        <MenuItem onClick={() => handleCambiarRol('JEFE_RUTA')} selected={seleccionado?.rol === 'JEFE_RUTA'}>Jefe de ruta</MenuItem>
      </Menu>
    </Stack>
  )
}
