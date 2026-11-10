import { useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import RouteIcon from '@mui/icons-material/AltRouteRounded'
import SaveIcon from '@mui/icons-material/SaveRounded'
import DeleteIcon from '@mui/icons-material/DeleteOutlineRounded'
import { toErrorMessage } from '../../domain/errors'
import type { DatosLinea, Linea } from '../../domain/models'
import { useLineas } from '../../application/useLineas'
import { useDependencies } from '../../app/providers'
import { FeedbackAlert } from '../components/FeedbackAlert'
import { PageHeader } from '../components/PageHeader'

const FORM_INICIAL: DatosLinea = {
  nombre: '',
  origen: '',
  destino: '',
  colorHex: '#7C6BC4',
}

export default function RutasPage() {
  const { lineas: lineasRepo } = useDependencies()
  const { lineas, loading, error, reload, crear, actualizar, eliminar } = useLineas(lineasRepo)

  const [msg, setMsg] = useState<string | null>(null)
  const [form, setForm] = useState<DatosLinea>(FORM_INICIAL)
  const [edit, setEdit] = useState<Linea | null>(null)

  async function handleCrear() {
    try {
      await crear(form)
      setMsg('Ruta creada.')
      setForm(FORM_INICIAL)
    } catch (cause) {
      setMsg(`No se pudo crear (¿endpoint no disponible?): ${toErrorMessage(cause)}`)
    }
  }

  async function handleGuardarEdicion() {
    if (!edit) return
    try {
      await actualizar(edit.id, edit)
      setMsg('Ruta actualizada.')
      setEdit(null)
    } catch (cause) {
      setMsg(`No se pudo actualizar (¿endpoint no disponible?): ${toErrorMessage(cause)}`)
    }
  }

  async function handleEliminar(linea: Linea) {
    if (!confirm(`¿Eliminar la ruta ${linea.nombre}?`)) return
    try {
      await eliminar(linea.id)
      setMsg('Ruta eliminada.')
    } catch (cause) {
      setMsg(`No se pudo eliminar (¿endpoint no disponible?): ${toErrorMessage(cause)}`)
    }
  }

  return (
    <Stack spacing={2}>
      <PageHeader title="Rutas / Líneas" onRefresh={reload} />
      <FeedbackAlert message={msg} onClose={() => setMsg(null)} />

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            Crear ruta
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
            <TextField
              label="Nombre"
              value={form.nombre}
              onChange={(event) => setForm({ ...form, nombre: event.target.value })}
              size="small"
            />
            <TextField
              label="Origen"
              value={form.origen ?? ''}
              onChange={(event) => setForm({ ...form, origen: event.target.value })}
              size="small"
            />
            <TextField
              label="Destino"
              value={form.destino ?? ''}
              onChange={(event) => setForm({ ...form, destino: event.target.value })}
              size="small"
            />
            <TextField
              label="Color (#hex)"
              value={form.colorHex ?? ''}
              onChange={(event) => setForm({ ...form, colorHex: event.target.value })}
              size="small"
              sx={{ width: 140 }}
            />
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleCrear}
              disabled={!form.nombre.trim()}
            >
              Crear
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="warning" sx={{ borderRadius: 3 }}>
          {error}
        </Alert>
      ) : (
        <Stack spacing={1.5}>
          {lineas.map((linea) => (
            <Card key={linea.id} variant="outlined">
              <CardContent>
                <Stack
                  direction={{ xs: 'column', sm: 'row' }}
                  spacing={1.5}
                  alignItems={{ sm: 'center' }}
                  justifyContent="space-between"
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar sx={{ bgcolor: linea.colorHex || 'primary.main' }}>
                      <RouteIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{linea.nombre}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {linea.origen || '?'} → {linea.destino || '?'}
                        {linea.corredor ? ` · ${linea.corredor}` : ''}
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <Button size="small" onClick={() => setEdit({ ...linea })}>
                      Editar
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleEliminar(linea)}
                    >
                      Eliminar
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
          {lineas.length === 0 && (
            <Alert severity="info" sx={{ borderRadius: 3 }}>
              No hay rutas para mostrar.
            </Alert>
          )}
        </Stack>
      )}

      <Dialog open={!!edit} onClose={() => setEdit(null)} fullWidth maxWidth="sm">
        <DialogTitle>Editar ruta</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <TextField
              label="Nombre"
              value={edit?.nombre ?? ''}
              onChange={(event) => setEdit(edit && { ...edit, nombre: event.target.value })}
            />
            <TextField
              label="Origen"
              value={edit?.origen ?? ''}
              onChange={(event) => setEdit(edit && { ...edit, origen: event.target.value })}
            />
            <TextField
              label="Destino"
              value={edit?.destino ?? ''}
              onChange={(event) => setEdit(edit && { ...edit, destino: event.target.value })}
            />
            <TextField
              label="Color (#hex)"
              value={edit?.colorHex ?? ''}
              onChange={(event) => setEdit(edit && { ...edit, colorHex: event.target.value })}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEdit(null)}>Cancelar</Button>
          <Button variant="contained" onClick={handleGuardarEdicion} startIcon={<SaveIcon />}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
