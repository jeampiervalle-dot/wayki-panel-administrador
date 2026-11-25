import { useMemo, useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import CancelIcon from '@mui/icons-material/HighlightOffRounded'
import AssignmentIndIcon from '@mui/icons-material/AssignmentIndRounded'
import LockIcon from '@mui/icons-material/LockRounded'
import { toErrorMessage } from '../../domain/errors'
import type { SolicitudRegistro, TipoSolicitud } from '../../domain/models'
import { useSolicitudes } from '../../application/useSolicitudes'
import { useDependencies, useSession } from '../../app/providers'
import { subrutaStore } from '../../data/subrutaStore'
import { FeedbackAlert } from '../components/FeedbackAlert'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { ListPanel, ListRow } from '../components/ListRow'
import { StatusChip } from '../components/StatusChip'

const TIPO_LABEL: Record<TipoSolicitud, string> = {
  CHOFER: 'Chofer (app)',
  JEFE_RUTA: 'Jefe de ruta',
  CAMBIO_RUTA: 'Cambio de ruta',
}

type Filtro = 'TODAS' | 'PENDIENTE' | 'APROBADA' | 'RECHAZADA'

export default function SolicitudesPage() {
  const { sesion } = useSession()
  const { solicitudes: solicitudesRepo } = useDependencies()
  const rol = sesion?.usuario.rol
  const esJefe = rol === 'JEFE_RUTA'
  const guardada = sesion?.usuario.dni ? subrutaStore.leerUsuario(sesion.usuario.dni) : null
  const subrutaJefe =
    Number(
      sesion?.usuario.subrutaDbId ??
        guardada?.subrutaDbId ??
        guardada?.subrutaId ??
        sesion?.usuario.subrutaId ??
        0,
    ) || undefined
  const jefeSinSubruta = esJefe && !subrutaJefe
  const { solicitudes, loading, error, reload, aprobar, rechazar } = useSolicitudes(
    solicitudesRepo,
    esJefe ? rol : undefined,
    esJefe ? subrutaJefe : undefined,
    !jefeSinSubruta,
  )
  const [msg, setMsg] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | number | null>(null)
  const [filtro, setFiltro] = useState<Filtro>('PENDIENTE')

  const visibles = useMemo(
    () => (filtro === 'TODAS' ? solicitudes : solicitudes.filter((s) => s.estado === filtro)),
    [solicitudes, filtro],
  )
  const conteos = useMemo(
    () => ({
      TODAS: solicitudes.length,
      PENDIENTE: solicitudes.filter((s) => s.estado === 'PENDIENTE').length,
      APROBADA: solicitudes.filter((s) => s.estado === 'APROBADA').length,
      RECHAZADA: solicitudes.filter((s) => s.estado === 'RECHAZADA').length,
    }),
    [solicitudes],
  )

  const titulo = esJefe ? 'Altas de choferes' : 'Solicitudes'
  const descripcion = esJefe
    ? 'Los choferes se registran en la app móvil. Aprueba a los de tu subruta para que puedan iniciar sesión.'
    : 'Altas de jefes de ruta, choferes y cambios de ruta pendientes de revisión.'

  async function handleAprobar(solicitud: SolicitudRegistro) {
    setBusyId(solicitud.id)
    setMsg(null)
    try {
      await aprobar(solicitud.id)
      if (solicitud.tipo === 'CHOFER') {
        setMsg(`Chofer aprobado. Ya puede entrar a la app con el PIN que creó al registrarse.`)
      } else if (solicitud.tipo === 'CAMBIO_RUTA') {
        setMsg('Cambio de ruta aprobado.')
      } else {
        setMsg('Jefe de ruta aprobado. Ya puede ingresar al panel.')
      }
    } catch (cause) {
      setMsg(`No se pudo aprobar: ${toErrorMessage(cause)}`)
    } finally {
      setBusyId(null)
    }
  }

  async function handleRechazar(solicitud: SolicitudRegistro) {
    if (!confirm(`¿Rechazar la solicitud de ${solicitud.nombreCompleto || solicitud.dni}?`)) return
    setBusyId(solicitud.id)
    try {
      await rechazar(solicitud.id)
      setMsg('Solicitud rechazada.')
    } catch (cause) {
      setMsg(`No se pudo rechazar: ${toErrorMessage(cause)}`)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader title={titulo} description={descripcion} onRefresh={reload} />
      <FeedbackAlert message={msg} onClose={() => setMsg(null)} />

      {jefeSinSubruta && (
        <Alert severity="info">
          Tu cuenta aún no tiene una subruta asignada. Selecciónala desde Inicio para ver las altas de choferes de tu recorrido.
        </Alert>
      )}

      <ToggleButtonGroup
        exclusive
        size="small"
        value={filtro}
        onChange={(_, valor: Filtro | null) => valor && setFiltro(valor)}
        sx={{ alignSelf: 'flex-start', flexWrap: 'wrap' }}
      >
        {([
          ['PENDIENTE', 'Pendientes'],
          ['APROBADA', 'Aprobadas'],
          ['RECHAZADA', 'Rechazadas'],
          ['TODAS', 'Todas'],
        ] as const).map(([valor, etiqueta]) => (
          <ToggleButton key={valor} value={valor} sx={{ px: 1.5, minHeight: 34 }}>
            {etiqueta} <Box component="span" sx={{ ml: 0.75, opacity: 0.65 }}>{conteos[valor]}</Box>
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {loading ? (
        <Box sx={{ p: 6, display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>
      ) : error ? (
        <Alert severity="warning">{error}</Alert>
      ) : visibles.length === 0 ? (
        <EmptyState
          titulo={filtro === 'PENDIENTE' ? 'Sin solicitudes pendientes' : `No hay solicitudes ${filtro.toLowerCase()}`}
          detalle={esJefe ? 'Las altas de choferes aparecerán aquí cuando se registren en la app.' : 'Cuando lleguen nuevas solicitudes se mostrarán en esta lista.'}
          icono={<AssignmentIndIcon />}
        />
      ) : (
        <ListPanel>
          {visibles.map((solicitud) => {
            const pendiente = solicitud.estado === 'PENDIENTE'
            const busy = busyId === solicitud.id
            return (
              <ListRow
                key={String(solicitud.id)}
                leading={
                  <Avatar sx={{ bgcolor: 'action.hover', color: 'primary.main', width: 40, height: 40 }}>
                    <AssignmentIndIcon fontSize="small" />
                  </Avatar>
                }
                title={
                  <Typography variant="subtitle2">{solicitud.nombreCompleto || '(sin nombre)'}</Typography>
                }
                subtitle={
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      DNI {solicitud.dni || '-'} · {solicitud.telefono || 's/tel'}
                      {solicitud.placaNumero ? ` · Placa ${solicitud.placaNumero}` : ''}
                      {solicitud.rutaTrabajo ? ` · Ruta ${solicitud.rutaTrabajo}` : ''}
                    </Typography>
                    {solicitud.tipo === 'CHOFER' && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.4 }}>
                        <LockIcon sx={{ fontSize: 13 }} /> PIN creado en la app · no se muestra aquí
                      </Typography>
                    )}
                  </Box>
                }
                meta={
                  <>
                    {solicitud.tipo && (
                      <Chip size="small" variant="outlined" label={TIPO_LABEL[solicitud.tipo]} />
                    )}
                    <StatusChip estado={solicitud.estado} />
                  </>
                }
                actions={
                  pendiente ? (
                    <>
                      <Button size="small" variant="contained" startIcon={<CheckCircleIcon />} onClick={() => handleAprobar(solicitud)} disabled={busy}>
                        Aprobar
                      </Button>
                      <Button size="small" color="error" variant="outlined" startIcon={<CancelIcon />} onClick={() => handleRechazar(solicitud)} disabled={busy}>
                        Rechazar
                      </Button>
                    </>
                  ) : undefined
                }
              />
            )
          })}
        </ListPanel>
      )}
    </Stack>
  )
}
