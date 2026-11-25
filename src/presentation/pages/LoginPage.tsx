import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import RouteIcon from '@mui/icons-material/AltRouteRounded'
import GroupsIcon from '@mui/icons-material/GroupsRounded'
import DirectionsBusIcon from '@mui/icons-material/DirectionsBusRounded'
import { toErrorMessage } from '../../domain/errors'
import type { Linea } from '../../domain/models'
import { useDependencies, useSession } from '../../app/providers'
import { useLineas } from '../../application/useLineas'
import { etiquetaSubruta, useSubrutas } from '../../application/useSubrutas'
import { RouteBadge } from '../components/RouteBadge'

type Mode = 'login' | 'register'

function etiquetaLinea(linea: Linea): string {
  const extremos = [linea.origen, linea.destino].filter(Boolean).join(' → ')
  return extremos ? `${linea.nombre} · ${extremos}` : linea.nombre
}

const RASGOS = [
  { icono: <RouteIcon />, texto: 'Trazados y paraderos de la red real de Arequipa.' },
  { icono: <GroupsIcon />, texto: 'Aprueba choferes y jefes de ruta en un solo lugar.' },
  { icono: <DirectionsBusIcon />, texto: 'Controla la flota, su línea y su subruta.' },
]

export default function LoginPage() {
  const { iniciarSesion, registrar } = useSession()
  const { lineas: lineasRepo } = useDependencies()
  const { lineas, loading: loadingLineas, error: errorLineas } = useLineas(lineasRepo)
  const opcionesLineas = useMemo(() => [...lineas].sort((a, b) => a.id - b.id), [lineas])
  const { subrutasDe, loading: loadingSubrutas } = useSubrutas()
  const tema = useTheme()
  const compacto = useMediaQuery(tema.breakpoints.down('md'))

  const [mode, setMode] = useState<Mode>('login')
  const [dni, setDni] = useState('')
  const [pin, setPin] = useState('')
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [lineaId, setLineaId] = useState('')
  const [subrutaId, setSubrutaId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  const credencialesValidas = dni.trim().length >= 4 && pin.trim().length >= 4
  const lineaElegida = useMemo(
    () => opcionesLineas.find((linea) => String(linea.id) === lineaId) ?? null,
    [opcionesLineas, lineaId],
  )
  const subrutas = useMemo(() => subrutasDe(lineaElegida), [subrutasDe, lineaElegida])
  const subrutaElegida = useMemo(
    () => subrutas.find((ruta) => ruta.id === subrutaId) ?? null,
    [subrutas, subrutaId],
  )
  const subrutaSinIdNumerico =
    !!subrutaElegida && !/^\d+$/.test(String(subrutaElegida.subrutaDbId ?? ''))

  const registroValido =
    dni.trim().length >= 8 &&
    pin.trim().length >= 4 &&
    !!nombre.trim() &&
    telefono.trim().length >= 9 &&
    !!lineaId &&
    !!subrutaElegida &&
    !subrutaSinIdNumerico

  async function handleLogin() {
    setError(null)
    setOk(null)
    setBusy(true)
    try {
      await iniciarSesion({ dni: dni.trim(), pin: pin.trim() })
    } catch (cause) {
      setError(toErrorMessage(cause, 'No se pudo iniciar sesión'))
    } finally {
      setBusy(false)
    }
  }

  async function handleRegister() {
    setError(null)
    setOk(null)
    setBusy(true)
    try {
      const subruta = subrutas.find((ruta) => ruta.id === subrutaId)
      await registrar({
        nombre: nombre.trim(),
        dni: dni.trim(),
        telefono: telefono.trim(),
        email: email.trim() || undefined,
        pin: pin.trim(),
        rol: 'JEFE_RUTA',
        ...(lineaId ? { lineaId: Number(lineaId) } : {}),
        ...(lineaElegida ? { nombreLinea: lineaElegida.nombre } : {}),
        ...(subruta
          ? {
              subrutaId: subruta.id,
              subrutaDbId: subruta.subrutaDbId ? String(subruta.subrutaDbId) : undefined,
              nombreSubruta: etiquetaSubruta(subruta),
              codigoLinea: subruta.agency.id || undefined,
            }
          : {}),
      })
      setOk('Solicitud enviada. Podrás ingresar cuando el administrador apruebe tu cuenta.')
      setMode('login')
      setNombre('')
      setTelefono('')
      setEmail('')
      setLineaId('')
      setSubrutaId('')
    } catch (cause) {
      setError(toErrorMessage(cause, 'No se pudo crear la cuenta'))
    } finally {
      setBusy(false)
    }
  }

  function toggleMode() {
    setMode((current) => (current === 'login' ? 'register' : 'login'))
    setError(null)
    setOk(null)
    setLineaId('')
    setSubrutaId('')
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', bgcolor: 'background.default' }}>
      {!compacto && (
        <Box
          sx={{
            width: '46%',
            maxWidth: 620,
            flexShrink: 0,
            bgcolor: 'primary.dark',
            color: 'common.white',
            p: 5,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              component="img"
              src="/wayki-logo.png"
              alt="Wayki Nest"
              sx={{ width: 44, height: 44, objectFit: 'contain', p: 0.5, bgcolor: 'common.white', borderRadius: 1, flexShrink: 0 }}
            />
            <Box>
              <Typography sx={{ fontFamily: '"Unbounded", sans-serif', fontSize: 26, fontWeight: 700, lineHeight: 0.95 }}>
                WAYKI NEST
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7 }}>
                PANEL DE OPERACIONES
              </Typography>
            </Box>
          </Box>

          <Box sx={{ maxWidth: 440, position: 'relative', zIndex: 1 }}>
            <Typography
              sx={{
                fontFamily: '"Unbounded", sans-serif',
                fontSize: { md: 52, lg: 60 },
                fontWeight: 700,
                lineHeight: 0.92,
                letterSpacing: '-0.01em',
              }}
            >
              Tu ruta,
              <br />
              bajo control.
            </Typography>
            <Typography sx={{ mt: 2.5, fontSize: 15, opacity: 0.82, maxWidth: 380 }}>
              Gestiona solicitudes, flota y trazados desde una sola pantalla.
            </Typography>

            <Stack spacing={1.75} sx={{ mt: 4 }}>
              {RASGOS.map((rasgo) => (
                <Stack key={rasgo.texto} direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', color: 'secondary.main', fontSize: 20 }}>{rasgo.icono}</Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>{rasgo.texto}</Typography>
                </Stack>
              ))}
            </Stack>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, position: 'relative', zIndex: 1 }}>
            {['C1', 'C2', 'C4', 'C5'].map((code, index) => (
              <RouteBadge key={code} code={code} color={index === 2 ? 'secondary.main' : 'rgba(255,255,255,0.16)'} size="sm" />
            ))}
            <Typography variant="caption" sx={{ ml: 1, opacity: 0.6 }}>
              Red integrada · Arequipa
            </Typography>
          </Box>

          <Box
            sx={{
              position: 'absolute',
              right: -120,
              bottom: -80,
              width: 360,
              height: 360,
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.09)',
              boxShadow: '0 0 0 46px rgba(255,255,255,0.025), 0 0 0 92px rgba(255,255,255,0.018)',
            }}
          />
        </Box>
      )}

      <Box sx={{ flex: 1, display: 'grid', placeItems: 'center', px: { xs: 2, sm: 4 }, py: 4 }}>
        <Box sx={{ width: '100%', maxWidth: 460 }}>
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.25, mb: 4 }}>
            <Box
              component="img"
              src="/wayki-logo.png"
              alt="Wayki Nest"
              sx={{ width: 40, height: 40, objectFit: 'contain', p: 0.5, bgcolor: 'common.white', borderRadius: 1, flexShrink: 0 }}
            />
            <Typography sx={{ fontFamily: '"Unbounded", sans-serif', fontSize: 24, fontWeight: 700 }}>
              WAYKI NEST
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', borderBottom: '1px solid', borderColor: 'divider', mb: 3 }}>
            {([
              ['login', 'Iniciar sesión'],
              ['register', 'Crear cuenta'],
            ] as const).map(([value, label]) => (
              <Button
                key={value}
                onClick={() => (value === mode ? undefined : toggleMode())}
                sx={{
                  borderRadius: 0,
                  px: 1.5,
                  minHeight: 42,
                  color: mode === value ? 'primary.main' : 'text.secondary',
                  borderBottom: '2px solid',
                  borderColor: mode === value ? 'primary.main' : 'transparent',
                  '&:hover': { bgcolor: 'transparent' },
                }}
              >
                {label}
              </Button>
            ))}
          </Box>

          <Typography variant="h4" component="h1" sx={{ mb: 0.5 }}>
            {mode === 'login' ? 'Bienvenido de vuelta' : 'Solicitar acceso'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {mode === 'login'
              ? 'Ingresa con tu DNI y el PIN de tu cuenta.'
              : 'El registro del panel es solo para jefes de ruta.'}
          </Typography>

          <Stack spacing={2}>
            {mode === 'register' && (
              <>
                <Alert severity="info">
                  Tu solicitud queda pendiente hasta que el administrador la apruebe. Los choferes se registran en la app móvil.
                </Alert>
                <TextField label="Nombre completo" value={nombre} onChange={(event) => setNombre(event.target.value)} fullWidth />
                <TextField
                  label="Teléfono (9 dígitos)"
                  value={telefono}
                  onChange={(event) => setTelefono(event.target.value.replace(/\D/g, '').slice(0, 9))}
                  fullWidth
                />
                <TextField label="Email (opcional)" value={email} onChange={(event) => setEmail(event.target.value)} fullWidth />
                <TextField
                  select
                  label="1. Línea (empresa de transporte)"
                  value={lineaId}
                  onChange={(event) => { setLineaId(event.target.value); setSubrutaId('') }}
                  fullWidth
                  helperText={
                    loadingLineas
                      ? 'Cargando líneas desde la base de datos…'
                      : errorLineas
                        ? `Error al cargar líneas: ${errorLineas}`
                        : `Elige la línea en la que trabajarás (${opcionesLineas.length} disponibles).`
                  }
                >
                  {opcionesLineas.map((linea) => (
                    <MenuItem key={linea.id} value={String(linea.id)}>{etiquetaLinea(linea)}</MenuItem>
                  ))}
                </TextField>
                <TextField
                  select
                  label="2. Subruta (recorrido)"
                  value={subrutaId}
                  onChange={(event) => setSubrutaId(event.target.value)}
                  fullWidth
                  disabled={!lineaId || loadingSubrutas}
                  helperText={
                    !lineaId
                      ? 'Primero selecciona una línea.'
                      : loadingSubrutas
                        ? 'Cargando subrutas del catálogo…'
                        : subrutas.length === 0
                          ? 'Esta línea no tiene subrutas en el catálogo.'
                          : `Subrutas de tu línea (${subrutas.length}). Se requiere su ID numérico para asignarte la ruta.`
                  }
                >
                  {subrutas.map((ruta) => (
                    <MenuItem key={ruta.id} value={ruta.id}>{etiquetaSubruta(ruta)}</MenuItem>
                  ))}
                </TextField>
                {subrutaSinIdNumerico && (
                  <Alert severity="warning">
                    Esta subruta del catálogo no tiene un ID numérico de base de datos. Elige otra
                    subruta o pide al administrador que actualice el catálogo; de otro modo no se
                    puede asignarte la ruta.
                  </Alert>
                )}
              </>
            )}

            <TextField
              label={mode === 'login' ? 'Usuario / DNI' : 'DNI (8 dígitos)'}
              value={dni}
              onChange={(event) => {
                const v = event.target.value
                setDni(mode === 'login' ? v.replace(/\s/g, '').slice(0, 20) : v.replace(/\D/g, '').slice(0, 8))
              }}
              fullWidth
              autoComplete="username"
            />
            <TextField
              label="Contraseña / PIN"
              value={pin}
              onChange={(event) => setPin(event.target.value.slice(0, 64))}
              type="password"
              fullWidth
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              onKeyDown={(event) => {
                if (event.key !== 'Enter') return
                if (mode === 'login') void handleLogin()
                else void handleRegister()
              }}
            />

            {error && <Alert severity="error">{error}</Alert>}
            {ok && <Alert severity="success">{ok}</Alert>}

            <Button
              variant="contained"
              size="large"
              onClick={mode === 'login' ? handleLogin : handleRegister}
              disabled={busy || (mode === 'login' ? !credencialesValidas : !registroValido)}
              sx={{ mt: 0.5, minHeight: 46 }}
            >
              {busy ? <CircularProgress size={21} color="inherit" /> : mode === 'login' ? 'Iniciar sesión' : 'Enviar solicitud'}
            </Button>
          </Stack>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3 }}>
            Acceso restringido. Los permisos dependen del rol asignado en el sistema.
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}
