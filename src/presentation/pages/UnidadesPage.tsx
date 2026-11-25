import { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
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
import { EmptyState } from '../components/EmptyState'
import { ListPanel, ListRow } from '../components/ListRow'
import { StatusChip } from '../components/StatusChip'
import { RouteBadge } from '../components/RouteBadge'

interface FormUnidad {
  numeroPadron: string
  placa: string
  lineaId: string
  estado: string
}

const FORM_INICIAL: FormUnidad = { numeroPadron: '', placa: '', lineaId: '', estado: 'OPERATIVA' }

function codigoLinea(unidad: Unidad, nombre: string): string {
  return nombre.match(/\bC\d{1,2}\b/i)?.[0]?.toUpperCase() ?? (unidad.lineaId != null ? String(unidad.lineaId) : '—')
}

export default function UnidadesPage() {
  const { unidades: unidadesRepo, lineas: lineasRepo } = useDependencies()
  const unidadesQuery = useUnidades(unidadesRepo)
  const lineasQuery = useLineas(lineasRepo)

  const [msg, setMsg] = useState<string | null>(null)
  const [form, setForm] = useState<FormUnidad>(FORM_INICIAL)
  const [editId, setEditId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<FormUnidad | null>(null)
  const [guardando, setGuardando] = useState(false)

  async function handleCrear() {
    if (!form.placa.trim() || !form.lineaId) {
      setMsg('Completa la placa y selecciona una línea antes de registrar la unidad.')
      return
    }
    const lineaIdNum = Number(form.lineaId)
    if (!Number.isFinite(lineaIdNum) || lineaIdNum <= 0) {
      setMsg('La línea seleccionada no es válida.')
      return
    }
    setGuardando(true)
    try {
      await unidadesQuery.crear({
        numeroPadron: form.numeroPadron.trim() || undefined,
        placa: form.placa.trim(),
        lineaId: lineaIdNum,
        estado: form.estado,
      })
      setMsg('Unidad creada.')
      setForm(FORM_INICIAL)
    } catch (cause) {
      setMsg(`No se pudo crear: ${toErrorMessage(cause)}`)
    } finally {
      setGuardando(false)
    }
  }

  async function handleEliminar(unidad: Unidad) {
    if (!confirm(`¿Eliminar la unidad ${unidad.placa || unidad.numeroPadron}?`)) return
    try {
      const detalle = await unidadesQuery.eliminar(unidad.id)
      setMsg(detalle ?? 'Unidad eliminada.')
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
    setGuardando(true)
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
    } finally {
      setGuardando(false)
    }
  }

  const error = unidadesQuery.error ?? lineasQuery.error
  const nombreLinea = (id: string) => lineasQuery.lineas.find((l) => String(l.id) === id)?.nombre ?? ''

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Unidades"
        description="Flota registrada: padrón, placa, línea y estado operativo."
        onRefresh={unidadesQuery.reload}
      />
      <FeedbackAlert message={msg} onClose={() => setMsg(null)} />

      <Box component="form" onSubmit={(event) => { event.preventDefault(); void handleCrear() }} sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2.5 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Registrar unidad</Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <TextField label="Nº padrón" value={form.numeroPadron} onChange={(event) => setForm({ ...form, numeroPadron: event.target.value })} size="small" sx={{ minWidth: 130 }} />
          <TextField label="Placa" value={form.placa} onChange={(event) => setForm({ ...form, placa: event.target.value })} size="small" required sx={{ minWidth: 130 }} />
          <TextField select label="Línea" value={form.lineaId} onChange={(event) => setForm({ ...form, lineaId: event.target.value })} size="small" sx={{ minWidth: 200 }} required>
            {lineasQuery.lineas.map((linea) => (
              <MenuItem key={linea.id} value={String(linea.id)}>{linea.nombre}</MenuItem>
            ))}
          </TextField>
          <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={!form.placa.trim() || !form.lineaId || guardando}>
            Registrar
          </Button>
        </Stack>
      </Box>

      {unidadesQuery.loading ? (
        <Box sx={{ p: 6, display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="warning">{error}</Alert>
      ) : unidadesQuery.unidades.length === 0 ? (
        <EmptyState titulo="No hay unidades registradas" detalle="Registra la primera unidad con el formulario anterior." />
      ) : (
        <ListPanel>
          {unidadesQuery.unidades.map((unidad) => {
            const editing = editId === unidad.id && editForm
            return (
              <ListRow
                key={unidad.id}
                leading={<RouteBadge code={codigoLinea(unidad, unidad.lineaNombre ?? nombreLinea(String(unidad.lineaId)))} size="sm" />}
                title={
                  <Typography variant="subtitle2">
                    Padrón {unidad.numeroPadron || '-'} · {unidad.placa || '-'}
                  </Typography>
                }
                subtitle={
                  <Typography variant="caption" color="text.secondary">
                    {unidad.lineaNombre ?? (unidad.lineaId != null ? `Línea ID ${unidad.lineaId}` : 'Sin línea')}
                    {unidad.nombreSubruta ? ` · ${unidad.nombreSubruta}` : ''}
                  </Typography>
                }
                meta={<StatusChip estado={unidad.estado ?? 'OPERATIVA'} />}
                actions={
                  <>
                    <Button size="small" startIcon={<EditIcon />} onClick={() => startEdit(unidad)}>Editar</Button>
                    <Button size="small" color="error" variant="outlined" startIcon={<DeleteIcon />} onClick={() => handleEliminar(unidad)}>Eliminar</Button>
                  </>
                }
              >
                {editing && editForm && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Editar unidad</Typography>
                    <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
                      <TextField label="Nº padrón" value={editForm.numeroPadron} onChange={(event) => setEditForm({ ...editForm, numeroPadron: event.target.value })} size="small" />
                      <TextField label="Placa" value={editForm.placa} onChange={(event) => setEditForm({ ...editForm, placa: event.target.value })} size="small" required />
                      <TextField select label="Línea" value={editForm.lineaId} onChange={(event) => setEditForm({ ...editForm, lineaId: event.target.value })} size="small" sx={{ minWidth: 200 }}>
                        {lineasQuery.lineas.map((linea) => (
                          <MenuItem key={linea.id} value={String(linea.id)}>{linea.nombre}</MenuItem>
                        ))}
                      </TextField>
                      <TextField select label="Estado" value={editForm.estado} onChange={(event) => setEditForm({ ...editForm, estado: event.target.value })} size="small" sx={{ minWidth: 160 }}>
                        <MenuItem value="OPERATIVA">Operativa</MenuItem>
                        <MenuItem value="BAJA">Baja</MenuItem>
                        <MenuItem value="MANTENIMIENTO">Mantenimiento</MenuItem>
                      </TextField>
                      <Button variant="contained" size="small" startIcon={<SaveIcon />} onClick={() => handleActualizar(unidad.id)} disabled={guardando}>Guardar</Button>
                      <Button variant="text" size="small" startIcon={<CloseIcon />} onClick={() => { setEditId(null); setEditForm(null) }}>Cancelar</Button>
                    </Stack>
                  </Box>
                )}
              </ListRow>
            )
          })}
        </ListPanel>
      )}
    </Stack>
  )
}
