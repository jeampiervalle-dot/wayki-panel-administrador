import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import RefreshIcon from '@mui/icons-material/RefreshRounded'
import SendIcon from '@mui/icons-material/SendRounded'
import type { Linea } from '../../domain/models'
import { useLineas } from '../../application/useLineas'
import { useSubrutas } from '../../application/useSubrutas'
import { useDependencies, useSession } from '../../app/providers'
import { toErrorMessage } from '../../domain/errors'
import { FeedbackAlert } from '../components/FeedbackAlert'
import { PageHeader } from '../components/PageHeader'

function etiquetaLinea(linea: Linea): string {
  const extremos = [linea.origen, linea.destino].filter(Boolean).join(' → ')
  return extremos ? `${linea.nombre} · ${extremos}` : linea.nombre
}

export default function AjustesPage() {
  const { sesion, actualizarUsuario } = useSession()
  const { lineas: lineasRepo, solicitudes, usuarios: usuariosRepo } = useDependencies()
  const {
    lineas,
    loading: cargandoLineas,
    error: errorLineas,
    reload: recargarLineas,
  } = useLineas(lineasRepo)

  const [nuevaLineaId, setNuevaLineaId] = useState('')
  const [nuevaSubrutaId, setNuevaSubrutaId] = useState('')
  // El catálogo ya lo carga useSubrutas: evitar una segunda petición.
  const { subrutasDe, rutas } = useSubrutas()
  const [msg, setMsg] = useState<string | null>(null)
  const [refrescando, setRefrescando] = useState(false)

  const usuario = sesion?.usuario
  const esAdmin = usuario?.rol === 'ADMIN'
  const puedeSolicitar = !esAdmin

  // La línea asignada está en la BD (tabla usuario_linea) y viene en el login.
  // Se vuelve a consultar al entrar para reflejar cambios hechos desde Cuentas.
  async function refrescarUsuario() {
    if (!usuario?.id) return
    try {
      const todos = await usuariosRepo.listar()
      const fresco = todos.find((u) => u.id === usuario.id)
      if (fresco) actualizarUsuario(fresco)
    } catch {
      // Si falla el backend se conserva el dato del login; no bloqueamos la pantalla.
    }
  }

  useEffect(() => {
    void refrescarUsuario()
    // Solo al entrar o cambiar de usuario, no en cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario?.id])

  const opciones = useMemo(() => [...lineas].sort((a, b) => a.id - b.id), [lineas])

  const lineaActual = usuario?.lineaNombre
    ? `${usuario.lineaNombre}${usuario.lineaId != null ? ` (ID ${usuario.lineaId})` : ''}`
    : 'No asignada'

  async function solicitarCambioRuta() {
    if (!nuevaLineaId || !nuevaSubrutaId || !puedeSolicitar) return
    const linea = lineas.find((l) => String(l.id) === nuevaLineaId)
    const ruta = rutas.find((r) => String(r.subrutaDbId) === nuevaSubrutaId)
    setMsg(null)
    try {
      await solicitudes.crearCambioRuta({
        usuarioId: usuario?.id,
        lineaSolicitadaId: Number(nuevaLineaId),
        subrutaSolicitadaId: Number(nuevaSubrutaId),
      })
      setMsg(`Solicitud de cambio enviada a ${ruta?.longName ?? ruta?.shortName ?? linea?.nombre ?? 'la subruta'}.`)
      setNuevaLineaId('')
      setNuevaSubrutaId('')
    } catch (cause) {
      setMsg(`No se pudo registrar la solicitud. Detalle: ${toErrorMessage(cause)}`)
    }
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Ajustes"
        description="Datos de tu cuenta y de tu ruta de trabajo, en sincronía con la base de datos."
      />

      <FeedbackAlert message={msg} onClose={() => setMsg(null)} />

      <Card>
        <CardContent>
          <Stack direction="row" spacing={1} sx={{ mb: 1, alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">Mi línea actual</Typography>
            <Tooltip title="Consultar de nuevo la base de datos">
              <span>
                <IconButton
                  size="small"
                  disabled={refrescando}
                  onClick={() => {
                    setRefrescando(true)
                    void refrescarUsuario().finally(() => setRefrescando(false))
                    recargarLineas()
                  }}
                >
                  <RefreshIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
          <Alert severity="info" sx={{ borderRadius: 3 }}>
            Línea asignada: <b>{lineaActual}</b>.{' '}
            {usuario?.lineaNombre
              ? 'Asociación obtenida de la base de datos (usuario_linea).'
              : 'Si tu cuenta aún no tiene línea, el administrador debe asignártela desde Cuentas.'}
            {usuario?.nombreSubruta && (
              <>
                <br />
                Subruta elegida: <b>{usuario.nombreSubruta}</b>.
              </>
            )}
          </Alert>
          {(usuario?.lineaNombre || usuario?.nombreSubruta) && (
            <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {usuario.lineaNombre && (
                <Chip size="small" color="success" variant="outlined" label={`ID ${usuario.lineaId ?? '-'}`} />
              )}
              {usuario.nombreSubruta && (
                <Chip size="small" color="primary" variant="outlined" label={usuario.nombreSubruta} />
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={1.5}>
            <Typography variant="h6">Solicitar cambio de ruta</Typography>
            <Typography variant="body2" color="text.secondary">
              Elige una de las líneas registradas. La solicitud queda pendiente y el administrador la
              revisa desde Solicitudes. Líneas disponibles en la BD: <b>{lineas.length}</b>.
            </Typography>

            {!puedeSolicitar && (
              <Alert severity="info" sx={{ borderRadius: 3 }}>
                Como administrador, gestiona las líneas desde <b>Rutas / Líneas</b>.
              </Alert>
            )}

            {errorLineas && (
              <Alert severity="warning" sx={{ borderRadius: 3 }}>
                No se pudieron cargar las líneas: {errorLineas}
              </Alert>
            )}

            <TextField
              select
              label="Nueva línea / empresa"
              value={nuevaLineaId}
              onChange={(event) => {
                setNuevaLineaId(event.target.value)
                setNuevaSubrutaId('')
              }}
              sx={{ maxWidth: 520 }}
              disabled={!puedeSolicitar || cargandoLineas}
              helperText={
                cargandoLineas
                  ? 'Cargando líneas desde la base de datos…'
                  : 'Selecciona la línea a la que quieres cambiarte.'
              }
            >
              {cargandoLineas && (
                <MenuItem disabled value="">
                  Cargando…
                </MenuItem>
              )}
              {opciones.map((linea) => (
                <MenuItem key={linea.id} value={String(linea.id)}>
                  {etiquetaLinea(linea)}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Nueva subruta"
              value={nuevaSubrutaId}
              onChange={(event) => setNuevaSubrutaId(event.target.value)}
              sx={{ maxWidth: 520 }}
              disabled={!puedeSolicitar || cargandoLineas}
              helperText="Selecciona la subruta destino; su jefe deberá aprobar el cambio."
            >
              {(() => {
                const linea = lineas.find((l) => String(l.id) === nuevaLineaId)
                const opciones = linea ? subrutasDe(linea) : rutas
                return opciones
                  .filter((ruta) => ruta.subrutaDbId != null)
                  .map((ruta) => (
                    <MenuItem key={ruta.id} value={String(ruta.subrutaDbId)}>
                      {ruta.longName || ruta.shortName}
                    </MenuItem>
                  ))
              })()}
            </TextField>

            <Box>
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                onClick={solicitarCambioRuta}
                disabled={!nuevaLineaId || !nuevaSubrutaId || !puedeSolicitar || cargandoLineas}
              >
                Enviar solicitud de cambio
              </Button>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  )
}
