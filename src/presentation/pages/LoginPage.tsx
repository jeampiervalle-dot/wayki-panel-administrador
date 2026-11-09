import { useState } from 'react'
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
import { config } from '../../config'
import { ROLES } from '../../domain/models'
import { toErrorMessage } from '../../domain/errors'
import { useSession } from '../../app/providers'

type Mode = 'login' | 'register'

export default function LoginPage() {
  const { iniciarSesion, registrar } = useSession()

  const [mode, setMode] = useState<Mode>('login')
  const [dni, setDni] = useState('')
  const [pin, setPin] = useState('')
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [rol, setRol] = useState<string>('ADMIN')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)

  const credencialesValidas = dni.length >= 8 && pin.length >= 4
  const registroValido = credencialesValidas && !!nombre.trim() && telefono.length >= 9

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
        rol,
      })
      setOk('Cuenta creada. Ya puedes iniciar sesión.')
      setMode('login')
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
          'radial-gradient(1200px 600px at 10% -10%, #D7EBDD 0%, transparent 60%), radial-gradient(900px 500px at 110% 10%, #CFE6D8 0%, transparent 55%), #F6FBF4',
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 500, p: 1 }}>
        <CardContent>
          <Stack spacing={2.2}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ bgcolor: 'primary.main', width: 52, height: 52 }}>
                <AdminPanelSettingsIcon />
              </Avatar>
              <Box>
                <Typography variant="h5">Wayki Nest</Typography>
                <Typography color="text.secondary">
                  {mode === 'login' ? 'Panel administrador (root)' : 'Crear cuenta'}
                </Typography>
              </Box>
            </Stack>

            {!config.apiUrl && (
              <Alert severity="warning" sx={{ borderRadius: 3 }}>
                Configura <code>VITE_API_URL</code> en <code>.env</code> (ej.{' '}
                <code>http://IP_VPS:8080/api</code>).
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
                  onChange={(event) =>
                    setTelefono(event.target.value.replace(/\D/g, '').slice(0, 9))
                  }
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
                  label="Rol"
                  value={rol}
                  onChange={(event) => setRol(event.target.value)}
                  fullWidth
                >
                  {ROLES.map((role) => (
                    <MenuItem key={role} value={role}>
                      {role}
                    </MenuItem>
                  ))}
                </TextField>
              </>
            )}

            <TextField
              label="DNI (8 dígitos)"
              value={dni}
              onChange={(event) => setDni(event.target.value.replace(/\D/g, '').slice(0, 8))}
              fullWidth
            />
            <TextField
              label="PIN (4+ dígitos)"
              value={pin}
              onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 8))}
              type="password"
              fullWidth
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
              Conectado al backend VPS. Los permisos dependen del rol.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}
