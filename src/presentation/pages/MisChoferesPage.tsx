import {
  Alert,
  Avatar,
  Box,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material'
import GroupsIcon from '@mui/icons-material/GroupsRounded'
import { useUsuarios } from '../../application/useUsuarios'
import { useDependencies, useSession } from '../../app/providers'
import { subrutaStore } from '../../data/subrutaStore'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { ListPanel, ListRow } from '../components/ListRow'
import { StatusChip } from '../components/StatusChip'

export default function MisChoferesPage() {
  const { sesion } = useSession()
  const { usuarios: usuariosRepo } = useDependencies()
  const { usuarios, loading, error, reload } = useUsuarios(usuariosRepo)

  const usuario = sesion?.usuario
  const lineaId = usuario?.lineaId
  const guardada = usuario?.dni ? subrutaStore.leerUsuario(usuario.dni) : null
  const subrutaId =
    usuario?.subrutaDbId ?? guardada?.subrutaDbId ?? guardada?.subrutaId ?? usuario?.subrutaId

  let choferes = usuarios.filter((u) => u.rol === 'CHOFER')
  if (lineaId != null) choferes = choferes.filter((u) => u.lineaId === lineaId)
  // Solo se aplica el filtro por subruta si el backend entrega ese dato en
  // las cuentas; si no, mostraríamos una lista vacía engañosa.
  const haySubrutaEnDatos = choferes.some((u) => u.subrutaDbId || u.subrutaId)
  if (subrutaId && haySubrutaEnDatos) {
    choferes = choferes.filter((u) => {
      const subrutaChofer = u.subrutaDbId ?? u.subrutaId
      return !subrutaChofer || String(subrutaChofer) === String(subrutaId)
    })
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Mis choferes"
        description="Choferes dados de alta para tu línea y aprobados para operar. La asignación de combi se gestiona desde la app móvil."
        onRefresh={reload}
      />

      {lineaId == null && (
        <Alert severity="info">
          Sin línea asociada a tu cuenta: se muestran los choferes del sistema como referencia.
        </Alert>
      )}
      {subrutaId && !haySubrutaEnDatos && (
        <Alert severity="info">
          El backend no informa la subruta de cada chofer, por ahora se muestran todos los de tu línea.
        </Alert>
      )}

      {loading ? (
        <Box sx={{ p: 6, display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="warning">{error}</Alert>
      ) : choferes.length === 0 ? (
        <EmptyState
          titulo="No hay choferes para mostrar"
          detalle="Cuando apruebes altas desde Solicitudes aparecerán aquí."
          icono={<GroupsIcon />}
        />
      ) : (
        <ListPanel>
          {choferes.map((u) => (
            <ListRow
              key={u.id}
              leading={
                <Avatar sx={{ bgcolor: 'action.hover', color: 'primary.main', width: 38, height: 38, fontSize: 15 }}>
                  {(u.nombre || '?').slice(0, 1)}
                </Avatar>
              }
              title={<Typography variant="subtitle2">{u.nombre || u.dni}</Typography>}
              subtitle={
                <Typography variant="caption" color="text.secondary">
                  DNI {u.dni} · {u.telefono || 's/tel'} · {u.email || 's/email'}
                </Typography>
              }
              meta={
                <>
                  <StatusChip estado={u.isOnline ? 'EN_LINEA' : 'OFFLINE'} label={u.isOnline ? 'En línea' : 'Offline'} />
                  {u.lineaNombre && <StatusChip estado="LINEA" label={u.lineaNombre} />}
                </>
              }
            />
          ))}
        </ListPanel>
      )}
    </Stack>
  )
}
