import { useEffect, useMemo, useState } from 'react'
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
import type { Linea, Unidad } from '../../domain/models'
import { resolverSubrutasCuradas } from '../../data/rutasCuradas'
import { useLineas } from '../../application/useLineas'
import { useUnidades } from '../../application/useUnidades'
import { useDependencies, useSession } from '../../app/providers'
import { FeedbackAlert } from '../components/FeedbackAlert'
import { PageHeader } from '../components/PageHeader'

interface FormUnidad {
  numeroPadron: string
  placa: string
  estado: string
  lineaId: string
}

function extraerCodigoRuta(linea: Pick<Linea, 'nombre' | 'corredor'>): string | null {
  const fromNombre = (linea.nombre ?? '').match(/\bC\d+\b/i)?.[0]
  if (fromNombre) return fromNombre.toUpperCase()
  const corredor = (linea.corredor ?? '').trim()
  const fromCorredor = corredor.match(/\bC\d+\b/i)?.[0]
  if (fromCorredor) return fromCorredor.toUpperCase()
  if (/^C\d+$/i.test(corredor)) return corredor.toUpperCase()
  return null
}

function misLineas(todas: Linea[], lineaAsignadaId?: number | null): Linea[] {
  if (lineaAsignadaId == null) return []
  const base = todas.find((l) => l.id === lineaAsignadaId)
  if (!base) return todas.filter((l) => l.id === lineaAsignadaId)
  const code = extraerCodigoRuta(base)
  if (code) {
    const curadas = resolverSubrutasCuradas(code, todas, lineaAsignadaId)
    if (curadas) return curadas
  }
  const baseCorredor = (base.corredor ?? '').trim().toLowerCase()
  const grupo = todas.filter((l) => {
    if (l.id === base.id) return true
    const c = extraerCodigoRuta(l)
    if (code && c === code) return true
    const lc = (l.corredor ?? '').trim().toLowerCase()
    if (baseCorredor && lc && baseCorredor === lc) return true
    if (code && new RegExp(`\\b${code}\\b`, 'i').test(l.nombre ?? '')) return true
    return false
  })
  return grupo.sort((a, b) => a.id - b.id)
}

export default function CombisPage() {
  const { sesion } = useSession()
  const { unidades: unidadesRepo, lineas: lineasRepo } = useDependencies()
  const { unidades, loading, error, reload, crear, actualizar, eliminar } = useUnidades(unidadesRepo)
  const { lineas: todasLineas, loading: loadingLineas } = useLineas(lineasRepo)

  const lineaAsignadaId = sesion?.usuario.lineaId
  const lineaNombre = sesion?.usuario.lineaNombre

  const lineasDisponibles = useMemo(
    () => misLineas(todasLineas, lineaAsignadaId),
    [todasLineas, lineaAsignadaId],
  )

  const [msg, setMsg] = useState<string | null>(null)
  const [form, setForm] = useState<FormUnidad>({
    numeroPadron: '',
    placa: '',
    estado: 'OPERATIVA',
    lineaId: '',
  })
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<FormUnidad | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  useEffect(() => {
    if (form.lineaId || lineasDisponibles.length === 0) return
    const preferida =
      (lineaAsignadaId != null && lineasDisponibles.find((l) => l.id === lineaAsignadaId && l.id > 0)) ||
      lineasDisponibles.find((l) => l.id > 0) ||
      lineasDisponibles[0]
    if (preferida) setForm((f) => ({ ...f, lineaId: String(preferida.id) }))
  }, [lineasDisponibles, lineaAsignadaId, form.lineaId])

  let lista = unidades
  if (lineaAsignadaId != null) lista = unidades.filter((u) => u.lineaId === lineaAsignadaId)

  function startEdit(u: Unidad) {
    setEditId(u.id)
    setEditForm({
      numeroPadron: u.numeroPadron ?? '',
      placa: u.placa ?? '',
      estado: u.estado ?? 'OPERATIVA',
      lineaId: u.lineaId != null ? String(u.lineaId) : (lineaAsignadaId != null ? String(lineaAsignadaId) : ''),
    })
  }

  async function handleActualizar(id: number) {
    if (!editForm) return
    const lineaIdNum = Number(editForm.lineaId)
    if (!editForm.placa.trim() || !editForm.lineaId || !Number.isFinite(lineaIdNum) || lineaIdNum <= 0) {
      setMsg('Completa placa y selecciona una línea válida.')
      return
    }
    setBusyId(id)
    try {
      await actualizar(id, {
        numeroPadron: editForm.numeroPadron.trim() || undefined,
        placa: editForm.placa.trim(),
        lineaId: lineaIdNum,
        estado: editForm.estado,
      })
      setMsg('Combi actualizada correctamente.')
      setEditId(null)
      setEditForm(null)
    } catch (cause) {
      setMsg(`No se pudo actualizar la combi: ${toErrorMessage(cause)}`)
    } finally {
      setBusyId(null)
    }
  }

  async function handleEliminar(u: Unidad) {
    if (!confirm(`¿Eliminar la combi ${u.placa || u.numeroPadron || u.id}?`)) return
    setBusyId(u.id)
    try {
      await eliminar(u.id)
      setMsg('Combi eliminada.')
      if (editId === u.id) { setEditId(null); setEditForm(null) }
    } catch (cause) {
      setMsg(`No se pudo eliminar la combi: ${toErrorMessage(cause)}`)
    } finally {
      setBusyId(null)
    }
  }

  async function handleCrear() {
    if (!form.placa.trim()) return
    if (!form.lineaId) {
      setMsg('Selecciona la línea a la que pertenece la combi.')
      return
    }
    const lineaIdNum = Number(form.lineaId)
    if (!Number.isFinite(lineaIdNum) || lineaIdNum <= 0) {
      setMsg('La subruta seleccionada no tiene línea registrada; no se puede asignar la combi.')
      return
    }
    setSaving(true)
    try {
      await crear({
        numeroPadron: form.numeroPadron.trim() || undefined,
        placa: form.placa.trim(),
        lineaId: lineaIdNum,
        estado: form.estado,
      })
      setMsg('Combi registrada correctamente.')
      setForm({ numeroPadron: '', placa: '', estado: 'OPERATIVA', lineaId: form.lineaId })
    } catch (cause) {
      setMsg(`No se pudo registrar la combi: ${toErrorMessage(cause)}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Stack spacing={2}>
      <PageHeader title="Combis de mi ruta" onRefresh={reload} />
      <Typography color="text.secondary">
        Registra y consulta las combis/unidades de tu ruta{lineaNombre ? ` (${lineaNombre})` : ''}. La
        asignación de combi a chofer se gestiona desde la app móvil.
      </Typography>
      <FeedbackAlert message={msg} onClose={() => setMsg(null)} />

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1.5 }}>
            Añadir combi
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
              required
            />
            <TextField
              select
              label="Línea (subruta)"
              value={form.lineaId}
              onChange={(event) => setForm({ ...form, lineaId: event.target.value })}
              size="small"
              sx={{ minWidth: 260 }}
              helperText={loadingLineas ? 'Cargando líneas...' : 'Subrutas de tu ruta (igual que en el mapa)'}
            >
              {lineasDisponibles.map((linea) => (
                <MenuItem key={linea.id} value={String(linea.id)} disabled={linea.id <= 0}>
                  {linea.nombre}
                  {linea.id <= 0 ? ' (sin registro en BD)' : ''}
                </MenuItem>
              ))}
            </TextField>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleCrear}
              disabled={saving || !form.placa.trim() || !form.lineaId}
            >
              {saving ? 'Guardando...' : 'Registrar combi'}
            </Button>
          </Stack>
          {lineaAsignadaId == null && (
            <Alert severity="info" sx={{ borderRadius: 3, mt: 1.5 }}>
              Tu cuenta no tiene una línea asociada, por eso no puedes registrar combis.
            </Alert>
          )}
        </CardContent>
      </Card>

      {lineaAsignadaId == null && (
        <Alert severity="info" sx={{ borderRadius: 3 }}>
          Sin línea asociada: se muestran las unidades del sistema como referencia.
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
          {lista.map((unidad) => {
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
                          Padrón {unidad.numeroPadron || '-'} · {unidad.placa || '-'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Línea {unidad.lineaNombre ?? (unidad.lineaId != null ? `ID ${unidad.lineaId}` : '-')} · Estado{' '}
                          {unidad.estado || 'OPERATIVA'}
                        </Typography>
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                      <Chip label={unidad.estado || 'OPERATIVA'} color={unidad.estado === 'OPERATIVA' ? 'success' : 'default'} />
                      <Button size="small" startIcon={<EditIcon />} onClick={() => startEdit(unidad)} disabled={busyId === unidad.id}>
                        Editar
                      </Button>
                      <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => handleEliminar(unidad)} disabled={busyId === unidad.id}>
                        Eliminar
                      </Button>
                    </Stack>
                  </Stack>

                  {editing && editForm && (
                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Editar combi</Typography>
                      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
                        <TextField
                          label="Nº padrón"
                          value={editForm.numeroPadron}
                          onChange={(e) => setEditForm({ ...editForm, numeroPadron: e.target.value })}
                          size="small"
                        />
                        <TextField
                          label="Placa"
                          value={editForm.placa}
                          onChange={(e) => setEditForm({ ...editForm, placa: e.target.value })}
                          size="small"
                          required
                        />
                        <TextField
                          select
                          label="Línea (subruta)"
                          value={editForm.lineaId}
                          onChange={(e) => setEditForm({ ...editForm, lineaId: e.target.value })}
                          size="small"
                          sx={{ minWidth: 260 }}
                        >
                          {lineasDisponibles.map((linea) => (
                            <MenuItem key={linea.id} value={String(linea.id)} disabled={linea.id <= 0}>
                              {linea.nombre}{linea.id <= 0 ? ' (sin registro en BD)' : ''}
                            </MenuItem>
                          ))}
                        </TextField>
                        <TextField
                          select
                          label="Estado"
                          value={editForm.estado}
                          onChange={(e) => setEditForm({ ...editForm, estado: e.target.value })}
                          size="small"
                          sx={{ minWidth: 150 }}
                        >
                          <MenuItem value="OPERATIVA">OPERATIVA</MenuItem>
                          <MenuItem value="INACTIVA">INACTIVA</MenuItem>
                          <MenuItem value="MANTENIMIENTO">MANTENIMIENTO</MenuItem>
                        </TextField>
                        <Button variant="contained" size="small" startIcon={<SaveIcon />} onClick={() => handleActualizar(unidad.id)} disabled={busyId === unidad.id}>
                          Guardar
                        </Button>
                        <Button variant="text" size="small" startIcon={<CloseIcon />} onClick={() => { setEditId(null); setEditForm(null) }}>
                          Cancelar
                        </Button>
                      </Stack>
                    </Box>
                  )}
                </CardContent>
              </Card>
            )
          })}
          {lista.length === 0 && (
            <Alert severity="info" sx={{ borderRadius: 3 }}>
              No hay combis registradas en tu ruta.
            </Alert>
          )}
        </Stack>
      )}
    </Stack>
  )
}
