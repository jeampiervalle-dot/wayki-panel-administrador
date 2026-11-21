import { useMemo, useState } from 'react'
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
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import CancelIcon from '@mui/icons-material/HighlightOffRounded'
import AssignmentIndIcon from '@mui/icons-material/AssignmentIndRounded'
import LockIcon from '@mui/icons-material/LockRounded'
import { toErrorMessage } from '../../domain/errors'
import type { SolicitudRegistro, TipoSolicitud } from '../../domain/models'
import { useSolicitudes } from '../../application/useSolicitudes'
import { useDependencies, useSession } from '../../app/providers'
import { FeedbackAlert } from '../components/FeedbackAlert'
import { PageHeader } from '../components/PageHeader'

function estadoColor(estado: SolicitudRegistro['estado']) {
  if (estado === 'APROBADA') return 'success' as const
  if (estado === 'RECHAZADA') return 'error' as const
  return 'warning' as const
}

const TIPO_LABEL: Record<TipoSolicitud, string> = {
  CHOFER: 'Chofer (app)',
  JEFE_RUTA: 'Jefe de ruta',
  CAMBIO_RUTA: 'Cambio de ruta',
}

function codigoRuta(texto?: string): string | null {
  return texto?.match(/\bC\d+\b/i)?.[0]?.toUpperCase() ?? null
}

export default function SolicitudesPage() {
  const { sesion } = useSession()
  const { solicitudes: solicitudesRepo } = useDependencies()
  const rol = sesion?.usuario.rol
  const esJefe = rol === 'JEFE_RUTA'
  const { solicitudes, loading, error, reload, aprobar, rechazar } = useSolicitudes(
    solicitudesRepo,
    rol,
    esJefe ? sesion?.usuario.lineaId : undefined,
  )
  const [msg, setMsg] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | number | null>(null)
  const miCodigo =
    codigoRuta(sesion?.usuario.lineaNombre) ??
    (sesion?.usuario.lineaId != null ? `C${sesion.usuario.lineaId}` : null)

  // Cada rol aprueba solo lo suyo: el jefe los choferes de su ruta y el
  // admin las altas de jefes de ruta y los cambios de ruta.
  const visibles = useMemo(() => {
    if (esJefe) {
      return solicitudes.filter(
        (solicitud) =>
          solicitud.tipo === 'CHOFER' &&
          (!miCodigo || codigoRuta(solicitud.rutaTrabajo) === miCodigo),
      )
    }
    return solicitudes.filter((solicitud) => solicitud.tipo !== 'CHOFER')
  }, [esJefe, miCodigo, solicitudes])

  const titulo = esJefe ? 'Altas de choferes' : 'Jefes de ruta'
  const descripcion = esJefe
    ? 'Los choferes se registran en la app móvil y crean su PIN allí. Aprueba a los de tu ruta para que puedan iniciar sesión en la app.'
    : 'Altas de jefes de ruta y cambios de ruta. Los choferes los aprueba el jefe de cada ruta; tú solo gestionas a los jefes.'

  async function handleAprobar(solicitud: SolicitudRegistro) {
    setBusyId(solicitud.id)
    setMsg(null)
    try {
      await aprobar(solicitud.id)
      if (solicitud.tipo === 'CHOFER') {
        setMsg(
          `Chofer aprobado${solicitud.rutaTrabajo ? ` para ${solicitud.rutaTrabajo}` : ''}. Ya puede entrar a la app con su DNI y el PIN que creó en su registro.`,
        )
      } else if (solicitud.tipo === 'CAMBIO_RUTA') {
        setMsg('Cambio de ruta aprobado.')
      } else {
        setMsg(
          `Jefe de ruta aprobado. Ya puede ingresar al panel con su DNI y el PIN que registró.`,
        )
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
    <Stack spacing={2}>
      <PageHeader title={titulo} onRefresh={reload} />
      <Typography color="text.secondary">{descripcion}</Typography>

      <FeedbackAlert message={msg} onClose={() => setMsg(null)} />

      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Alert severity="warning" sx={{ borderRadius: 3 }}>
          {error}
        </Alert>
      ) : (
        <Stack spacing={1.5}>
          {visibles.map((solicitud) => {
            const pendiente = solicitud.estado === 'PENDIENTE'
            const busy = busyId === solicitud.id
            return (
              <Card key={String(solicitud.id)} variant="outlined">
                <CardContent>
                  <Stack spacing={1.5}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          <AssignmentIndIcon />
                        </Avatar>
                        <Box>
                          <Typography variant="h6">
                            {solicitud.nombreCompleto || '(sin nombre)'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            DNI {solicitud.dni || '-'} · {solicitud.telefono || 's/tel'}
                            {solicitud.placaNumero ? ` · Placa ${solicitud.placaNumero}` : ''}
                            {solicitud.rutaTrabajo ? ` · Ruta ${solicitud.rutaTrabajo}` : ''}
                          </Typography>
                          {solicitud.tipo === 'CHOFER' && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}
                            >
                              <LockIcon sx={{ fontSize: 14 }} /> PIN creado por el chofer en la app (no se
                              muestra aquí)
                            </Typography>
                          )}
                        </Box>
                      </Stack>

                      <Stack direction="row" spacing={1} useFlexGap sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
                        {solicitud.tipo && (
                          <Chip
                            label={TIPO_LABEL[solicitud.tipo]}
                            variant="outlined"
                            size="small"
                            color={solicitud.tipo === 'CHOFER' ? 'primary' : 'default'}
                          />
                        )}
                        <Chip label={solicitud.estado} color={estadoColor(solicitud.estado)} />
                        {pendiente && (
                          <>
                            <Button
                              size="small"
                              color="success"
                              startIcon={<CheckCircleIcon />}
                              onClick={() => handleAprobar(solicitud)}
                              disabled={busy}
                            >
                              Aprobar
                            </Button>
                            <Button
                              size="small"
                              color="error"
                              startIcon={<CancelIcon />}
                              onClick={() => handleRechazar(solicitud)}
                              disabled={busy}
                            >
                              Rechazar
                            </Button>
                          </>
                        )}
                      </Stack>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            )
          })}
          {visibles.length === 0 && (
            <Alert severity="info" sx={{ borderRadius: 3 }}>
              {esJefe
                ? 'No hay solicitudes de choferes para tu ruta.'
                : 'No hay altas de jefes de ruta ni cambios de ruta.'}
            </Alert>
          )}
        </Stack>
      )}
    </Stack>
  )
}
