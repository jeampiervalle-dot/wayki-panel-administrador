import { useMemo, useState } from 'react'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettingsRounded'
import { toErrorMessage } from '../../domain/errors'
import type { Linea } from '../../domain/models'
import { useDependencies, useSession } from '../../app/providers'
import { useLineas } from '../../application/useLineas'

type Mode = 'login' | 'register'

function extraerCodigoRuta(linea: Pick<Linea, 'nombre' | 'corredor'>): string | null {
  const fromNombre = (linea.nombre ?? '').match(/\bC\d+\b/i)?.[0]
  if (fromNombre) return fromNombre.toUpperCase()
  const corredor = (linea.corredor ?? '').trim()
  const fromCorredor = corredor.match(/\bC\d+\b/i)?.[0]
  if (fromCorredor) return fromCorredor.toUpperCase()
  if (/^C\d+$/i.test(corredor)) return corredor.toUpperCase()
  return null
}

function lineasEmpresa(todas: Linea[]): Linea[] {
  const porCodigo = new Map<string, Linea[]>()
  for (const l of todas) {
    const code = extraerCodigoRuta(l)
    if (!code) continue
    if (!porCodigo.has(code)) porCodigo.set(code, [])
    porCodigo.get(code)!.push(l)
  }
  const res: Linea[] = []
  for (const [code, grupo] of porCodigo.entries()) {
    const principal = grupo.find((l) => /^L[ií]nea\s*C\d+/i.test(l.nombre ?? '')) ?? grupo.sort((a, b) => a.id - b.id)[0]
    res.push({
      ...principal,
      nombre: /^L[ií]nea\s*C\d+/i.test(principal.nombre ?? '') ? principal.nombre : `Corredor ${code}`,
      corredor: code,
    })
  }
  return res.sort((a, b) => {
    const na = parseInt((extraerCodigoRuta(a) || 'C0').slice(1), 10)
    const nb = parseInt((extraerCodigoRuta(b) || 'C0').slice(1), 10)
    return na - nb
  })
}

export default function LoginPage() {
  const { iniciarSesion, registrar } = useSession()
  const { lineas: lineasRepo } = useDependencies()
  const { lineas, loading: loadingLineas } = useLineas(lineasRepo)
  const empresas = useMemo(() => lineasEmpresa(lineas), [lineas])

  const [mode, setMode] = useState<Mode>('login')
  const [dni, setDni] = useState('')
  const [pin, setPin] = useState('')
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [lineaId, setLineaId] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  const credencialesValidas =
    mode === 'login'
      ? dni.trim().length >= 4 && pin.trim().length >= 4
      : dni.trim().length >= 8 && pin.trim().length >= 4
  const registroValido =
    dni.trim().length >= 8 &&
    pin.trim().length >= 4 &&
    !!nombre.trim() &&
    telefono.trim().length >= 9 &&
    !!lineaId

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
      await registrar({
        nombre: nombre.trim(),
        dni: dni.trim(),
        telefono: telefono.trim(),
        email: email.trim() || undefined,
        pin: pin.trim(),
        rol: 'JEFE_RUTA',
        ...(lineaId ? { lineaId: Number(lineaId) } : {}),
      })
      setOk(
        'Cuenta creada. Seleccionaste tu ruta; podrás iniciar sesión cuando sea aprobada/activada según el flujo.',
      )
      setMode('login')
      setNombre('')
      setTelefono('')
      setEmail('')
      setLineaId('')
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
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        p: 2,
        background:
          'radial-gradient(1200px 600px at 10% -10%, #E4DCF8 0%, transparent 60%), radial-gradient(900px 500px at 110% 10%, #DDD2F6 0%, transparent 55%), #F6F3FC',
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 500, p: 1 }}>
        <CardContent>
          <Stack spacing={2.2}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 52, height: 52 }}>
                <AdminPanelSettingsIcon />
              </Avatar>
              <Box>
                <Typography variant="h5">Wayki Nest</Typography>
                <Typography color="text.secondary">
                  {mode === 'login' ? 'Acceso al panel de administración' : 'Crear cuenta (jefe de ruta)'}
                </Typography>
              </Box>
            </Stack>

            {mode === 'login' ? (
              <Alert severity="info" sx={{ borderRadius: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  Datos locales (sin backend)
                </Typography>
                <Typography variant="body2">
                  Admin: <code>12345678</code> / <code>1234</code>
                  <br />
                  Jefe de ruta: <code>87654321</code> / <code>1234</code>
                  <br />
                  Los choferes ingresan solo desde la app móvil.
                </Typography>
              </Alert>
            ) : (
              <Alert severity="info" sx={{ borderRadius: 3 }}>
                El registro del panel es solo para <strong>jefes de ruta</strong>. Crea una solicitud
                que el admin aprueba; los choferes se registran en la app móvil.
              </Alert>
            )}

            {mode === 'register' && (
              <>
                <TextField
                  label="Nombre completo"
                  value={nombre}
                  onChange={(event) => setNombre(event.target.value)}
                  fullWidth
                />
                <TextField
                  label="Teléfono (9 dígitos)"
                  value={telefono}
                  onChange={(event) => setTelefono(event.target.value.replace(/\D/g, '').slice(0, 9))}
                  fullWidth
                />
                <TextField
                  label="Email (opcional)"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  fullWidth
                />
                <TextField
                  select
                  label="Selecciona tu ruta (empresa / línea de transporte)"
                  value={lineaId}
                  onChange={(event) => setLineaId(event.target.value)}
                  fullWidth
                  helperText={
                    loadingLineas
                      ? 'Cargando rutas...'
                      : 'Como jefe de ruta, elige la línea o corredor en el que trabajarás.'
                  }
                >
                  {empresas.map((linea) => (
                    <MenuItem key={linea.id} value={String(linea.id)}>
                      {linea.nombre}
                    </MenuItem>
                  ))}
                </TextField>
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

            {error && (
              <Alert severity="error" sx={{ borderRadius: 3 }}>
                {error}
              </Alert>
            )}
            {ok && (
              <Alert severity="success" sx={{ borderRadius: 3 }}>
                {ok}
              </Alert>
            )}

            {mode === 'login' ? (
              <Button
                variant="contained"
                size="large"
                onClick={handleLogin}
                disabled={busy || !credencialesValidas}
              >
                {busy ? <CircularProgress size={22} color="inherit" /> : 'Iniciar sesión'}
              </Button>
            ) : (
              <Button
                variant="contained"
                size="large"
                onClick={handleRegister}
                disabled={busy || !registroValido}
              >
                {busy ? <CircularProgress size={22} color="inherit" /> : 'Crear cuenta'}
              </Button>
            )}

            <Button variant="text" onClick={toggleMode}>
              {mode === 'login' ? 'Crear cuenta' : 'Ya tengo cuenta, iniciar sesión'}
            </Button>

            <Typography variant="caption" color="text.secondary">
              Acceso restringido. Los permisos dependen del rol asignado.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
