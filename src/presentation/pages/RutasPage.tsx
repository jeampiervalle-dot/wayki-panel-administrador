import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/SaveRounded'
import DeleteIcon from '@mui/icons-material/DeleteOutlineRounded'
import EditIcon from '@mui/icons-material/EditOutlined'
import { toErrorMessage } from '../../domain/errors'
import type { DatosLinea, Linea } from '../../domain/models'
import { useLineas } from '../../application/useLineas'
import { useDependencies } from '../../app/providers'
import { FeedbackAlert } from '../components/FeedbackAlert'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { ListPanel, ListRow } from '../components/ListRow'
import { RouteBadge } from '../components/RouteBadge'

const FORM_INICIAL: DatosLinea = {
  nombre: '',
  origen: '',
  destino: '',
  colorHex: '#7B82A0',
}

function codigo(linea: Linea): string {
  return linea.nombre.match(/\bC\d{1,2}\b/i)?.[0]?.toUpperCase() ?? String(linea.id)
}

export default function RutasPage() {
  const { lineas: lineasRepo } = useDependencies()
  const { lineas, loading, error, reload, crear, actualizar, eliminar } = useLineas(lineasRepo)

  const [msg, setMsg] = useState<string | null>(null)
  const [form, setForm] = useState<DatosLinea>(FORM_INICIAL)
  const [edit, setEdit] = useState<Linea | null>(null)
  const [guardando, setGuardando] = useState(false)

  async function handleCrear() {
    setGuardando(true)
    try {
      await crear(form)
      setMsg('Ruta creada.')
      setForm(FORM_INICIAL)
    } catch (cause) {
      setMsg(`No se pudo crear la ruta: ${toErrorMessage(cause)}`)
    } finally {
      setGuardando(false)
    }
  }

  async function handleGuardarEdicion() {
    if (!edit) return
    setGuardando(true)
    try {
      await actualizar(edit.id, edit)
      setMsg('Ruta actualizada.')
      setEdit(null)
    } catch (cause) {
      setMsg(`No se pudo actualizar: ${toErrorMessage(cause)}`)
    } finally {
      setGuardando(false)
    }
  }

  async function handleEliminar(linea: Linea) {
    if (!confirm(`¿Eliminar la ruta ${linea.nombre}?`)) return
    try {
      await eliminar(linea.id)
      setMsg('Ruta eliminada.')
    } catch (cause) {
      setMsg(`No se pudo eliminar: ${toErrorMessage(cause)}`)
    }
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Rutas / Líneas"
        description="Empresas y corredores registrados. Cada línea agrupa las subrutas que se muestran en el mapa y en el registro de combis."
        onRefresh={reload}
      />
      <FeedbackAlert message={msg} onClose={() => setMsg(null)} />

      <Box component="form" onSubmit={(event) => { event.preventDefault(); void handleCrear() }} sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2.5 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Nueva línea</Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <TextField label="Nombre" value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} size="small" required sx={{ minWidth: 180, flex: 1 }} />
          <TextField label="Origen" value={form.origen ?? ''} onChange={(event) => setForm({ ...form, origen: event.target.value })} size="small" sx={{ minWidth: 140, flex: 1 }} />
          <TextField label="Destino" value={form.destino ?? ''} onChange={(event) => setForm({ ...form, destino: event.target.value })} size="small" sx={{ minWidth: 140, flex: 1 }} />
          <TextField label="Color" value={form.colorHex ?? ''} onChange={(event) => setForm({ ...form, colorHex: event.target.value })} size="small" sx={{ width: 130 }} />
          <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={!form.nombre.trim() || guardando}>
            Crear línea
          </Button>
        </Stack>
      </Box>

      {loading ? (
        <Box sx={{ p: 6, display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="warning">{error}</Alert>
      ) : lineas.length === 0 ? (
        <EmptyState titulo="No hay líneas registradas" detalle="Crea la primera línea con el formulario anterior." />
      ) : (
        <ListPanel>
          {lineas.map((linea) => (
            <ListRow
              key={linea.id}
              leading={<RouteBadge code={codigo(linea)} color={linea.colorHex} size="md" />}
              title={<Typography variant="subtitle2">{linea.nombre}</Typography>}
              subtitle={
                <Typography variant="caption" color="text.secondary">
                  {linea.origen || '?'} → {linea.destino || '?'}
                  {linea.corredor ? ` · ${linea.corredor}` : ''}
                </Typography>
              }
              actions={
                <>
                  <Button size="small" startIcon={<EditIcon />} onClick={() => setEdit({ ...linea })}>Editar</Button>
                  <Button size="small" color="error" variant="outlined" startIcon={<DeleteIcon />} onClick={() => handleEliminar(linea)}>Eliminar</Button>
                </>
              }
            />
          ))}
        </ListPanel>
      )}

      <Dialog open={!!edit} onClose={() => setEdit(null)} fullWidth maxWidth="sm">
        <DialogTitle>Editar línea</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 0.5 }}>
            <TextField label="Nombre" fullWidth value={edit?.nombre ?? ''} onChange={(event) => setEdit(edit && { ...edit, nombre: event.target.value })} />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField label="Origen" fullWidth value={edit?.origen ?? ''} onChange={(event) => setEdit(edit && { ...edit, origen: event.target.value })} />
              <TextField label="Destino" fullWidth value={edit?.destino ?? ''} onChange={(event) => setEdit(edit && { ...edit, destino: event.target.value })} />
            </Stack>
            <TextField label="Color (#hex)" fullWidth value={edit?.colorHex ?? ''} onChange={(event) => setEdit(edit && { ...edit, colorHex: event.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEdit(null)}>Cancelar</Button>
          <Button variant="contained" onClick={handleGuardarEdicion} startIcon={<SaveIcon />} disabled={guardando}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
