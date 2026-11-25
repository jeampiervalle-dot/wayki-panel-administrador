import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
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
import type { TurnoActivo, Unidad } from '../../domain/models'
import { etiquetaSubruta, useSubrutas } from '../../application/useSubrutas'
import { useLineas } from '../../application/useLineas'
import { useUnidades } from '../../application/useUnidades'
import { useDependencies, useSession } from '../../app/providers'
import { subrutaStore } from '../../data/subrutaStore'
import { FeedbackAlert } from '../components/FeedbackAlert'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { ListPanel, ListRow } from '../components/ListRow'
import { StatusChip } from '../components/StatusChip'
import { RouteBadge } from '../components/RouteBadge'

interface FormUnidad {
  numeroPadron: string
  placa: string
  estado: string
  lineaId: string
  subrutaId: string
}

function nombreSubrutaDe(unidad: Unidad): string | undefined {
  return unidad.nombreSubruta ?? subrutaStore.leerUnidad(unidad.id)?.nombreSubruta ?? undefined
}

function codigoLinea(unidad: Unidad, nombre: string): string {
  return nombre.match(/\bC\d{1,2}\b/i)?.[0]?.toUpperCase() ?? (unidad.lineaId != null ? String(unidad.lineaId) : '—')
}

export default function CombisPage() {
  const { sesion } = useSession()
  const { unidades: unidadesRepo, lineas: lineasRepo, turnos: turnosRepo } = useDependencies()
  const { unidades, loading, error, reload, crear, actualizar, eliminar } = useUnidades(unidadesRepo)
  const [turnos, setTurnos] = useState<TurnoActivo[]>([])

  // Los turnos son un catálogo independiente: no dependen de la lista de
  // unidades. Incluir `unidades` aquí provocaba un bucle de peticiones.
  useEffect(() => {
    let vivo = true
    turnosRepo.listarActivos().then((lista) => {
      if (vivo) setTurnos(lista)
    }).catch(() => {
      if (vivo) setTurnos([])
    })
    return () => { vivo = false }
  }, [turnosRepo])

  const { lineas: todasLineas, loading: loadingLineas } = useLineas(lineasRepo)
  const { subrutasDe, rutas } = useSubrutas()

  const lineaAsignadaId = sesion?.usuario.lineaId
  const lineaNombre = sesion?.usuario.lineaNombre
  const guardadaSesion = sesion?.usuario.dni ? subrutaStore.leerUsuario(sesion.usuario.dni) : null
  const subrutaAsignadaId =
    sesion?.usuario.subrutaDbId ?? guardadaSesion?.subrutaDbId ?? sesion?.usuario.subrutaId
  const subrutaAsignadaNombre = sesion?.usuario.nombreSubruta
  const esJefe = sesion?.usuario.rol === 'JEFE_RUTA'

  const rutaAsignada = useMemo(
    () =>
      rutas.find(
        (ruta) =>
          (ruta.subrutaDbId != null && String(ruta.subrutaDbId) === subrutaAsignadaId) ||
          ruta.id === subrutaAsignadaId,
      ) ?? null,
    [rutas, subrutaAsignadaId],
  )
  const subrutaFiltroId =
    (rutaAsignada?.subrutaDbId ? String(rutaAsignada.subrutaDbId) : null) ?? subrutaAsignadaId

  const opcionesLineas = useMemo(() => [...todasLineas].sort((a, b) => a.id - b.id), [todasLineas])
  const [msg, setMsg] = useState<string | null>(null)
  const [form, setForm] = useState<FormUnidad>(() => ({
    numeroPadron: '',
    placa: '',
    estado: 'OPERATIVA',
    lineaId: lineaAsignadaId != null ? String(lineaAsignadaId) : '',
    subrutaId: subrutaAsignadaId ?? '',
  }))
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState<FormUnidad | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [mostrarBajas, setMostrarBajas] = useState(false)

  const subrutasDisponibles = useMemo(() => {
    const linea = opcionesLineas.find((item) => String(item.id) === form.lineaId) ?? null
    return subrutasDe(linea)
  }, [subrutasDe, opcionesLineas, form.lineaId])

  const subrutasEdicion = useMemo(() => {
    if (!editForm) return []
    const linea = opcionesLineas.find((item) => String(item.id) === editForm.lineaId) ?? null
    return subrutasDe(linea)
  }, [subrutasDe, opcionesLineas, editForm])

  let lista = mostrarBajas ? [...unidades] : unidades.filter((u) => u.estado !== 'BAJA')
  if (esJefe && lineaAsignadaId != null) lista = lista.filter((u) => u.lineaId === lineaAsignadaId)
  if (esJefe && subrutaFiltroId) {
    lista = lista.filter(
      (u) =>
        u.subrutaId === subrutaFiltroId ||
        subrutaStore.leerUnidad(u.id)?.subrutaDbId === subrutaFiltroId ||
        subrutaStore.leerUnidad(u.id)?.subrutaId === subrutaFiltroId,
    )
  }

  const grupos = new Map<string, { nombre: string; items: Unidad[] }>()
  for (const unidad of lista) {
    const guardada = subrutaStore.leerUnidad(unidad.id)
    const id = unidad.subrutaId ?? guardada?.subrutaDbId ?? 'sin-subruta'
    const nombre = unidad.nombreSubruta ?? guardada?.nombreSubruta ?? 'Sin subruta asignada'
    const clave = `${id}|${nombre}`
    const grupo = grupos.get(clave) ?? { nombre, items: [] }
    grupo.items.push(unidad)
    grupos.set(clave, grupo)
  }

  function startEdit(u: Unidad) {
    const guardada = subrutaStore.leerUnidad(u.id)
    setEditId(u.id)
    setEditForm({
      numeroPadron: u.numeroPadron ?? '',
      placa: u.placa ?? '',
      estado: u.estado ?? 'OPERATIVA',
      lineaId:
        esJefe && lineaAsignadaId != null
          ? String(lineaAsignadaId)
          : u.lineaId != null
            ? String(u.lineaId)
            : lineaAsignadaId != null
              ? String(lineaAsignadaId)
              : '',
      subrutaId:
        esJefe && subrutaAsignadaId
          ? subrutaAsignadaId
          : u.subrutaId ?? guardada?.subrutaId ?? subrutaAsignadaId ?? '',
    })
  }

  async function handleActualizar(id: number) {
    if (!editForm) return
    const lineaIdNum = Number(editForm.lineaId)
    if (!editForm.placa.trim() || !editForm.lineaId || !Number.isFinite(lineaIdNum) || lineaIdNum <= 0) {
      setMsg('Completa la placa y selecciona una línea válida.')
      return
    }
    setBusyId(id)
    try {
      const lineaFinal = esJefe && lineaAsignadaId != null ? Number(lineaAsignadaId) : lineaIdNum
      const subrutaFinal = esJefe
        ? (subrutasEdicion.find((ruta) => String(ruta.subrutaDbId) === String(subrutaAsignadaId))?.id ?? subrutaAsignadaId ?? editForm.subrutaId)
        : editForm.subrutaId
      const subruta = subrutasEdicion.find((ruta) => ruta.id === subrutaFinal)
      const guardada = await actualizar(id, {
        numeroPadron: editForm.numeroPadron.trim() || undefined,
        placa: editForm.placa.trim(),
        lineaId: lineaFinal,
        estado: editForm.estado,
        subrutaId: subrutaFinal || undefined,
        subrutaDbId: subruta?.subrutaDbId ? String(subruta.subrutaDbId) : undefined,
        subrutaCodigo: subruta ? subruta.subrutaCodigo ?? subruta.id : subrutaFinal || undefined,
        nombreSubruta: subruta ? etiquetaSubruta(subruta) : undefined,
      })
      if (subrutaFinal) {
        subrutaStore.guardarUnidad(guardada.id ?? id, {
          subrutaId: subrutaFinal,
          subrutaDbId: subruta ? String(subruta.subrutaDbId ?? subruta.id) : undefined,
          nombreSubruta: subruta ? etiquetaSubruta(subruta) : subrutaFinal,
        })
      }
      setMsg(
        editForm.estado === 'BAJA'
          ? 'Combi dada de baja. Activa “Mostrar dadas de baja” para verla.'
          : 'Combi actualizada.',
      )
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
      const mensaje = await eliminar(u.id)
      setMsg(mensaje ?? 'Combi eliminada.')
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
      setMsg('La línea seleccionada no es válida.')
      return
    }
    setSaving(true)
    try {
      const lineaFinal = esJefe && lineaAsignadaId != null ? Number(lineaAsignadaId) : lineaIdNum
      const subrutaFinal = esJefe
        ? (subrutasDisponibles.find((ruta) => String(ruta.subrutaDbId) === String(subrutaAsignadaId))?.id ?? subrutaAsignadaId ?? form.subrutaId)
        : form.subrutaId
      const subruta = subrutasDisponibles.find((ruta) => ruta.id === subrutaFinal)
      const creada = await crear({
        numeroPadron: form.numeroPadron.trim() || undefined,
        placa: form.placa.trim(),
        lineaId: lineaFinal,
        estado: form.estado,
        subrutaId: subrutaFinal || undefined,
        subrutaDbId: subruta?.subrutaDbId ? String(subruta.subrutaDbId) : undefined,
        subrutaCodigo: subruta ? subruta.subrutaCodigo ?? subruta.id : subrutaFinal || undefined,
        nombreSubruta: subruta ? etiquetaSubruta(subruta) : undefined,
      })
      if (subrutaFinal) {
        subrutaStore.guardarUnidad(creada.id, {
          subrutaId: subrutaFinal,
          subrutaDbId: subruta ? String(subruta.subrutaDbId ?? subruta.id) : undefined,
          nombreSubruta: subruta ? etiquetaSubruta(subruta) : subrutaFinal,
        })
      }
      setMsg('Combi registrada.')
      setForm({ numeroPadron: '', placa: '', estado: 'OPERATIVA', lineaId: form.lineaId, subrutaId: form.subrutaId })
    } catch (cause) {
      setMsg(`No se pudo registrar la combi: ${toErrorMessage(cause)}`)
    } finally {
      setSaving(false)
    }
  }

  const sinSubruta = !subrutaAsignadaId

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Combis"
        description={`Unidades de tu ruta${lineaNombre ? ` (${lineaNombre})` : ''}${subrutaAsignadaNombre ? ` · ${subrutaAsignadaNombre}` : ''}. La asignación de combi a chofer se gestiona desde la app móvil.`}
        onRefresh={() => { reload() }}
      />
      <FeedbackAlert message={msg} onClose={() => setMsg(null)} />

      <FormControlLabel
        sx={{ alignSelf: 'flex-start' }}
        control={
          <Checkbox
            size="small"
            checked={mostrarBajas}
            onChange={(event) => setMostrarBajas(event.target.checked)}
          />
        }
        label="Mostrar dadas de baja"
      />

      <Box component="form" onSubmit={(event) => { event.preventDefault(); void handleCrear() }} sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2.5 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Añadir combi</Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
          <TextField label="Nº padrón" value={form.numeroPadron} onChange={(event) => setForm({ ...form, numeroPadron: event.target.value })} size="small" sx={{ minWidth: 130 }} />
          <TextField label="Placa" value={form.placa} onChange={(event) => setForm({ ...form, placa: event.target.value })} size="small" required sx={{ minWidth: 130 }} />
          {!esJefe && (
            <>
              <TextField select label="Línea" value={form.lineaId} onChange={(event) => setForm({ ...form, lineaId: event.target.value, subrutaId: '' })} size="small" sx={{ minWidth: 190 }} helperText={loadingLineas ? 'Cargando líneas…' : undefined}>
                {opcionesLineas.map((linea) => (
                  <MenuItem key={linea.id} value={String(linea.id)}>{linea.nombre}</MenuItem>
                ))}
              </TextField>
              <TextField select label="Subruta" value={form.subrutaId} onChange={(event) => setForm({ ...form, subrutaId: event.target.value })} size="small" sx={{ minWidth: 240 }} disabled={!form.lineaId}>
                {subrutasDisponibles.map((ruta) => (
                  <MenuItem key={ruta.id} value={ruta.id}>{etiquetaSubruta(ruta)}</MenuItem>
                ))}
              </TextField>
            </>
          )}
          <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={saving || !form.placa.trim() || !form.lineaId}>
            {saving ? 'Guardando…' : 'Registrar combi'}
          </Button>
        </Stack>
        {lineaAsignadaId == null && (
          <Alert severity="info" sx={{ mt: 2 }}>Tu cuenta no tiene una línea asociada, por eso no puedes registrar combis.</Alert>
        )}
        {lineaAsignadaId != null && sinSubruta && (
          <Alert severity="info" sx={{ mt: 2 }}>Tu cuenta no tiene subruta asignada. Selecciónala desde Inicio o pide al administrador que actualice tu asociación.</Alert>
        )}
      </Box>

      {loading ? (
        <Box sx={{ p: 6, display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="warning">{error}</Alert>
      ) : lista.length === 0 ? (
        <EmptyState
          titulo="No hay combis para mostrar"
          detalle={subrutaAsignadaId ? 'Registra la primera combi de tu subruta con el formulario anterior.' : 'Registra la primera combi de tu línea.'}
        />
      ) : (
        <Stack spacing={2.5}>
          {[...grupos.entries()].map(([clave, grupo]) => (
            <Box key={clave}>
              <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', mb: 1 }}>
                <Typography variant="h6">{grupo.nombre}</Typography>
                <Typography variant="caption" color="text.secondary">{grupo.items.length} combi(s)</Typography>
              </Stack>
              <ListPanel>
                {grupo.items.map((unidad) => {
                  const editing = editId === unidad.id && editForm
                  const turno = turnos.find((t) => t.unidadId === unidad.id)
                  return (
                    <ListRow
                      key={unidad.id}
                      leading={<RouteBadge code={codigoLinea(unidad, unidad.lineaNombre ?? '')} size="sm" />}
                      title={
                        <Typography variant="subtitle2">
                          Padrón {unidad.numeroPadron || '-'} · {unidad.placa || '-'}
                        </Typography>
                      }
                      subtitle={
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {unidad.lineaNombre ?? (unidad.lineaId != null ? `Línea ID ${unidad.lineaId}` : 'Sin línea')}
                            {turno?.choferNombre ? ` · Chofer: ${turno.choferNombre}` : ''}
                          </Typography>
                          {nombreSubrutaDe(unidad) && (
                            <Typography variant="caption" color="primary.main" sx={{ display: 'block' }}>
                              {nombreSubrutaDe(unidad)}
                            </Typography>
                          )}
                        </Box>
                      }
                      meta={<StatusChip estado={unidad.estado ?? 'OPERATIVA'} />}
                      actions={
                        <>
                          <Button size="small" startIcon={<EditIcon />} onClick={() => startEdit(unidad)} disabled={busyId === unidad.id}>Editar</Button>
                          <Button size="small" color="error" variant="outlined" startIcon={<DeleteIcon />} onClick={() => handleEliminar(unidad)} disabled={busyId === unidad.id}>Eliminar</Button>
                        </>
                      }
                    >
                      {editing && editForm && (
                        <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>Editar combi</Typography>
                          <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} useFlexGap sx={{ flexWrap: 'wrap' }}>
                            <TextField label="Nº padrón" value={editForm.numeroPadron} onChange={(event) => setEditForm({ ...editForm, numeroPadron: event.target.value })} size="small" />
                            <TextField label="Placa" value={editForm.placa} onChange={(event) => setEditForm({ ...editForm, placa: event.target.value })} size="small" required />
                            {!esJefe && (
                              <>
                                <TextField select label="Línea" value={editForm.lineaId} onChange={(event) => setEditForm({ ...editForm, lineaId: event.target.value, subrutaId: '' })} size="small" sx={{ minWidth: 190 }}>
                                  {opcionesLineas.map((linea) => (
                                    <MenuItem key={linea.id} value={String(linea.id)}>{linea.nombre}</MenuItem>
                                  ))}
                                </TextField>
                                <TextField select label="Subruta" value={editForm.subrutaId} onChange={(event) => setEditForm({ ...editForm, subrutaId: event.target.value })} size="small" sx={{ minWidth: 240 }} disabled={!editForm.lineaId}>
                                  {subrutasEdicion.map((ruta) => (
                                    <MenuItem key={ruta.id} value={ruta.id}>{etiquetaSubruta(ruta)}</MenuItem>
                                  ))}
                                </TextField>
                              </>
                            )}
                            <TextField select label="Estado" value={editForm.estado} onChange={(event) => setEditForm({ ...editForm, estado: event.target.value })} size="small" sx={{ minWidth: 160 }}>
                              <MenuItem value="OPERATIVA">Operativa</MenuItem>
                              <MenuItem value="BAJA">Baja</MenuItem>
                              <MenuItem value="MANTENIMIENTO">Mantenimiento</MenuItem>
                            </TextField>
                            <Button variant="contained" size="small" startIcon={<SaveIcon />} onClick={() => handleActualizar(unidad.id)} disabled={busyId === unidad.id}>Guardar</Button>
                            <Button variant="text" size="small" startIcon={<CloseIcon />} onClick={() => { setEditId(null); setEditForm(null) }}>Cancelar</Button>
                          </Stack>
                        </Box>
                      )}
                    </ListRow>
                  )
                })}
              </ListPanel>
            </Box>
          ))}
        </Stack>
      )}
    </Stack>
  )
}
