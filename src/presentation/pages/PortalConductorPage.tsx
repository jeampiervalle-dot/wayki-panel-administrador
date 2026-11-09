import { useState } from 'react'
import {
  Alert,
  Button,
  Card,
  CardContent,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import SaveIcon from '@mui/icons-material/SaveRounded'
import { toErrorMessage } from '../../domain/errors'
import { usePortalConductor } from '../../application/usePortalConductor'
import { useDependencies } from '../../app/providers'

type Mensaje = { ok: boolean; text: string }

export default function PortalConductorPage() {
  const { auth, lineas: lineasRepo } = useDependencies()
  const { lineas, sesion, busy, iniciarSesion } = usePortalConductor(auth, lineasRepo)

  const [dni, setDni] = useState('')
  const [pin, setPin] = useState('')
  const [lineaId, setLineaId] = useState('')
  const [msg, setMsg] = useState<Mensaje | null>(null)

  async function handleLogin() {
    setMsg(null)
    try {
      await iniciarSesion({ dni: dni.trim(), pin: pin.trim() })
      setMsg({ ok: true, text: 'Acceso correcto. Puedes seleccionar tu ruta.' })
    } catch (cause) {
      setMsg({ ok: false, text: toErrorMessage(cause) })
    }
  }

  function handleGuardarRuta() {
    const linea = lineas.find((item) => String(item.id) === lineaId)
    setMsg({
      ok: true,
      text: `Ruta seleccionada: ${linea?.nombre || lineaId}. Podrás cambiarla más adelante en Ajustes si decides cambiarte de ruta.`,
    })
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h4">Portal conductor</Typography>
      <Typography color="text.secondary">
        Acceso del conductor para seleccionar su ruta de trabajo. La ruta se puede cambiar más
        adelante si decides cambiarte de ruta.
      </Typography>

      {msg && (
        <Alert
          severity={msg.ok ? 'success' : 'warning'}
          sx={{ borderRadius: 3 }}
          onClose={() => setMsg(null)}
        >
          {msg.text}
        </Alert>
      )}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1.5 }}>
              Iniciar sesión
            </Typography>
            <Stack spacing={1.5}>
              <TextField
                label="DNI"
                value={dni}
                onChange={(event) => setDni(event.target.value.replace(/\D/g, '').slice(0, 8))}
              />
              <TextField
                label="PIN"
                type="password"
                value={pin}
                onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 8))}
              />
              <Button
                variant="contained"
                onClick={handleLogin}
                disabled={busy || dni.length < 8 || pin.length < 4}
              >
                Ingresar
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1.5 }}>
              Seleccionar ruta
            </Typography>
            <Stack spacing={1.5}>
              {sesion && (
                <Alert severity="info" sx={{ borderRadius: 3 }}>
                  Sesión: {sesion.usuario.nombre || sesion.usuario.dni || dni}
                </Alert>
              )}
              <TextField
                select
                label="Ruta de trabajo"
                value={lineaId}
                onChange={(event) => setLineaId(event.target.value)}
              >
                {lineas.map((linea) => (
                  <MenuItem key={linea.id} value={String(linea.id)}>
                    {linea.nombre}
                    {linea.origen ? ` (${linea.origen}→${linea.destino || ''})` : ''}
                  </MenuItem>
                ))}
              </TextField>
              <Typography variant="caption" color="text.secondary">
                Podrás cambiarla más adelante en Ajustes si decides cambiarte de ruta.
              </Typography>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleGuardarRuta}
                disabled={!lineaId}
              >
                Guardar selección
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Registro / solicitud (referencia)
          </Typography>
          <Typography color="text.secondary" variant="body2">
            El alta del conductor se gestiona como solicitud con verificación (DNI + nombre manual)
            y aprobación en horario laboral. La creación/persistencia real se conecta al backend
            (endpoint de registro/solicitudes) y al flujo de aprobación del administrador.
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  )
}
