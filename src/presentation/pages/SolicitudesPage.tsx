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
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import CancelIcon from '@mui/icons-material/HighlightOffRounded'
import AssignmentIndIcon from '@mui/icons-material/AssignmentIndRounded'
import { toErrorMessage } from '../../domain/errors'
import type { SolicitudRegistro } from '../../domain/models'
import { useSolicitudes } from '../../application/useSolicitudes'
import { useDependencies, useSession } from '../../app/providers'
import { FeedbackAlert } from '../components/FeedbackAlert'
import { PageHeader } from '../components/PageHeader'

function estadoColor(estado: SolicitudRegistro['estado']) {
  if (estado === 'APROBADA') return 'success' as const
  if (estado === 'RECHAZADA') return 'error' as const
  return 'warning' as const
}

export default function SolicitudesPage() {
  const { sesion } = useSession()
  const { solicitudes: solicitudesRepo } = useDependencies()
  const { solicitudes, loading, error, reload, aprobar, rechazar } = useSolicitudes(solicitudesRepo)
  const [msg, setMsg] = useState<string | null>(null)
  const [aprobandoId, setAprobandoId] = useState<string | number | null>(null)
  const [usuarioAsignado, setUsuarioAsignado] = useState('')
  const [busyId, setBusyId] = useState<string | number | null>(null)

  const rol = sesion?.usuario.rol
  const esJefe = rol === 'JEFE_RUTA'
  const titulo = esJefe ? 'Solicitudes de choferes' : 'Solicitudes de registro'
  const descripcion = esJefe
    ? 'Solicitudes de choferes para tu ruta enviadas desde la app móvil. Aprueba o rechaza y asigna el identificador para que el chofer cree su PIN. (El filtrado por tu línea requiere soporte de solicitudes tipadas/scoped en el backend.)'
    : 'Solicitudes de registro enviadas desde la app móvil (p. ej. jefes de ruta). Revisa y aprueba o rechaza; al aprobar asigna el identificador de acceso.'

  async function handleAprobar(solicitud: SolicitudRegistro) {
    const identificador = usuarioAsignado.trim()
    if (!identificador) {
      setMsg('Ingresa el identificador de acceso para aprobar la solicitud.')
      return
    }
    setBusyId(solicitud.id)
    try {
      await aprobar(solicitud.id, identificador)
      setMsg(`Solicitud aprobada. Identificador asignado: ${identificador}.`)
      setAprobandoId(null)
      setUsuarioAsignado('')
    } catch (cause) {
      setMsg(`No se pudo aprobar (¿endpoint no disponible?): ${toErrorMessage(cause)}`)
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
      if (aprobandoId === solicitud.id) {
        setAprobandoId(null)
        setUsuarioAsignado('')
      }
    } catch (cause) {
      setMsg(`No se pudo rechazar (¿endpoint no disponible?): ${toErrorMessage(cause)}`)
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
          <Typography variant="body2" sx={{ mt: 1 }}>
            Verifica que el backend admin exponga <code>/api/solicitudes-registro</code> (misma base{' '}
            <code>gowayki_db</code>).
          </Typography>
        </Alert>
      ) : (
        <Stack spacing={1.5}>
          {solicitudes.map((solicitud) => {
            const pendiente = solicitud.estado === 'PENDIENTE'
            const aprobando = aprobandoId === solicitud.id
            const busy = busyId === solicitud.id
            return (
              <Card key={String(solicitud.id)} variant="outlined">
                <CardContent>
                  <Stack spacing={1.5}>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={1.5}
                      alignItems={{ sm: 'center' }}
                      justifyContent="space-between"
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center">
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
                          {solicitud.usuarioAsignado && (
                            <Typography variant="body2" color="text.secondary">
                              Identificador asignado: {solicitud.usuarioAsignado}
                            </Typography>
                          )}
                        </Box>
                      </Stack>

                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                        <Chip label={solicitud.estado} color={estadoColor(solicitud.estado)} />
                        {pendiente && !aprobando && (
                          <>
                            <Button
                              size="small"
                              color="success"
                              startIcon={<CheckCircleIcon />}
                              onClick={() => {
                                setAprobandoId(solicitud.id)
                                setUsuarioAsignado(solicitud.usuarioAsignado || '')
                                setMsg(null)
                              }}
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

                    {aprobando && (
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
                        <TextField
                          label="Identificador de acceso (para crear PIN)"
                          value={usuarioAsignado}
                          onChange={(event) => setUsuarioAsignado(event.target.value)}
                          size="small"
                          sx={{ minWidth: 260 }}
                          disabled={busy}
                        />
                        <Button
                          variant="contained"
                          color="success"
                          onClick={() => handleAprobar(solicitud)}
                          disabled={busy || !usuarioAsignado.trim()}
                        >
                          Confirmar aprobación
                        </Button>
                        <Button
                          onClick={() => {
                            setAprobandoId(null)
                            setUsuarioAsignado('')
                          }}
                          disabled={busy}
                        >
                          Cancelar
                        </Button>
                      </Stack>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            )
          })}
          {solicitudes.length === 0 && (
            <Alert severity="info" sx={{ borderRadius: 3 }}>
              No hay solicitudes de registro para mostrar.
            </Alert>
          )}
        </Stack>
      )}
    </Stack>
  )
}
