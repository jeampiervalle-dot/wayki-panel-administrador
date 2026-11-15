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
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import DirectionsBusIcon from '@mui/icons-material/DirectionsBusRounded'
import SaveIcon from '@mui/icons-material/SaveRounded'
import DeleteIcon from '@mui/icons-material/DeleteOutlineRounded'
import EditIcon from '@mui/icons-material/EditOutlined'
import CloseIcon from '@mui/icons-material/CloseRounded'
import { toErrorMessage } from '../../domain/errors'
import type { Unidad } from '../../domain/models'
import { useLineas } from '../../application/useLineas'
import { useUnidades } from '../../application/useUnidades'
import { useDependencies } from '../../app/providers'
import { FeedbackAlert } from '../components/FeedbackAlert'
import { PageHeader } from '../components/PageHeader'

interface FormUnidad {
  numeroPadron: string
  placa: string
  lineaId: string
  estado: string
}

const FORM_INICIAL: FormUnidad = {
  numeroPadron: '',
  placa: '',
  lineaId: '',
  estado: 'OPERATIVA',
}

export default function UnidadesPage() {
  const { unidades: unidadesRepo, lineas: lineasRepo } = useDependencies()
  const unidadesQuery = useUnidades(unidadesRepo)
  const lineasQuery = useLineas(lineasRepo)

  const [msg, setMsg] = useState<string | null>(null)
  const [form, setForm] = useState<FormUnidad>(FORM_INICIAL)
  const [editId, setEditId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<FormUnidad | null>(null)

  async function handleCrear() {
    try {
      await unidadesQuery.crear({
        numeroPadron: form.numeroPadron.trim() || undefined,
        placa: form.placa.trim(),
        lineaId: Number(form.lineaId),
        estado: form.estado,
      })
      setMsg('Unidad creada.')
      setForm(FORM_INICIAL)
    } catch (cause) {
      setMsg(`No se pudo crear (¿endpoint no disponible?): ${toErrorMessage(cause)}`)
    }
  }

  async function handleEliminar(unidad: Unidad) {
    if (!confirm(`¿Eliminar la unidad ${unidad.placa || unidad.numeroPadron}?`)) return
    try {
      await unidadesQuery.eliminar(unidad.id)
      setMsg('Unidad eliminada.')
      if (editId === unidad.id) { setEditId(null); setEditForm(null) }
    } catch (cause) {
      setMsg(`No se pudo eliminar: ${toErrorMessage(cause)}`)
    }
  }

  function startEdit(u: Unidad) {
    setEditId(u.id)
    setEditForm({
      numeroPadron: u.numeroPadron ?? '',
      placa: u.placa ?? '',
      lineaId: u.lineaId != null ? String(u.lineaId) : '',
      estado: u.estado ?? 'OPERATIVA',
    })
  }

  async function handleActualizar(id: number) {
    if (!editForm || !editForm.placa.trim() || !editForm.lineaId) return
    try {
      await unidadesQuery.actualizar(id, {
        numeroPadron: editForm.numeroPadron.trim() || undefined,
        placa: editForm.placa.trim(),
        lineaId: Number(editForm.lineaId),
        estado: editForm.estado,
      })
      setMsg('Unidad actualizada.')
      setEditId(null)
      setEditForm(null)
    } catch (cause) {
      setMsg(`No se pudo actualizar: ${toErrorMessage(cause)}`)
    }
  }

  const error = unidadesQuery.error ?? lineasQuery.error

  return (
    <Stack spacing={2}>
      <PageHeader title="Unidades (vehículos)" onRefresh={unidadesQuery.reload} />
      <FeedbackAlert message={msg} onClose={() => setMsg(null)} />

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            Registrar unidad
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
            <TextField
              label="Nº padrón"
              value={form.numeroPadron}
              onChange={(event) => setForm({ ...form, numeroPadron: event.target.value })}
              size="small"
            />
            <TextField
              label="Placa"
              value={form.placa}
              onChange={(event) => setForm({ ...form, placa: event.target.value })}
              size="small"
            />
            <TextField
              select
              label="Línea"
              value={form.lineaId}
              onChange={(event) => setForm({ ...form, lineaId: event.target.value })}
              size="small"
              sx={{ minWidth: 180 }}
            >
              {lineasQuery.lineas.map((linea) => (
                <MenuItem key={linea.id} value={String(linea.id)}>
                  {linea.nombre}
                </MenuItem>
              ))}
            </TextField>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleCrear}
              disabled={!form.placa.trim() || !form.lineaId}
            >
              Crear
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {unidadesQuery.loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="warning" sx={{ borderRadius: 3 }}>
          {error}
        </Alert>
      ) : (
        <Stack spacing={1.5}>
          {unidadesQuery.unidades.map((unidad) => {
            const editing = editId === unidad.id && editForm
            return (
              <Card key={unidad.id} variant="outlined">
                <CardContent>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
                    <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                      <Avatar sx={{ bgcolor: 'secondary.main' }}>
                        <DirectionsBusIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h6">
                          Padrón {unidad.numeroPadron || '-'} · {unidad.placa}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Línea {unidad.lineaNombre ?? (unidad.lineaId != null ? `ID ${unidad.lineaId}` : '-')} · Estado{' '}
                          {unidad.estado || 'OPERATIVA'}
                        </Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                      <Chip
                        label={unidad.estado || 'OPERATIVA'}
                        color={unidad.estado === 'OPERATIVA' ? 'success' : 'default'}
                      />
                      <Button size="small" startIcon={<EditIcon />} onClick={() => startEdit(unidad)}>
                        Editar
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleEliminar(unidad)}
                      >
                        Eliminar
                      </Button>
                    </Stack>
                  </Stack>
                  {editing && editForm && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Editar unidad</Typography>
                      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
                        <TextField label="Nº padrón" value={editForm.numeroPadron} onChange={(e) => setEditForm({ ...editForm, numeroPadron: e.target.value })} size="small" />
                        <TextField label="Placa" value={editForm.placa} onChange={(e) => setEditForm({ ...editForm, placa: e.target.value })} size="small" required />
                        <TextField select label="Línea" value={editForm.lineaId} onChange={(e) => setEditForm({ ...editForm, lineaId: e.target.value })} size="small" sx={{ minWidth: 220 }}>
                          {lineasQuery.lineas.map((linea) => (
                            <MenuItem key={linea.id} value={String(linea.id)}>{linea.nombre}</MenuItem>
                          ))}
                        </TextField>
                        <TextField select label="Estado" value={editForm.estado} onChange={(e) => setEditForm({ ...editForm, estado: e.target.value })} size="small" sx={{ minWidth: 150 }}>
                          <MenuItem value="OPERATIVA">OPERATIVA</MenuItem>
                          <MenuItem value="INACTIVA">INACTIVA</MenuItem>
                          <MenuItem value="MANTENIMIENTO">MANTENIMIENTO</MenuItem>
                        </TextField>
                        <Button variant="contained" size="small" startIcon={<SaveIcon />} onClick={() => handleActualizar(unidad.id)}>Guardar</Button>
                        <Button variant="text" size="small" startIcon={<CloseIcon />} onClick={() => { setEditId(null); setEditForm(null) }}>Cancelar</Button>
                      </Stack>
                    </Box>
                  )}
                </CardContent>
              </Card>
            )
          })}
          {unidadesQuery.unidades.length === 0 && (
            <Alert severity="info" sx={{ borderRadius: 3 }}>
              No hay unidades para mostrar.
            </Alert>
          )}
        </Stack>
      )}
    </Stack>
  )
}
