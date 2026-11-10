import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import SendIcon from '@mui/icons-material/SendRounded'
import type { Linea } from '../../domain/models'
import { useLineas } from '../../application/useLineas'
import { useDependencies, useSession } from '../../app/providers'
import { toErrorMessage } from '../../domain/errors'
import { FeedbackAlert } from '../components/FeedbackAlert'

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

export default function AjustesPage() {
  const { sesion } = useSession()
  const { lineas: lineasRepo, solicitudes } = useDependencies()
  const { lineas } = useLineas(lineasRepo)
  const empresas = useMemo(() => lineasEmpresa(lineas), [lineas])
  const [nuevaLineaId, setNuevaLineaId] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const usuario = sesion?.usuario
  const lineaActual = usuario?.lineaNombre
    ? `${usuario.lineaNombre}${usuario.lineaId != null ? ` (ID ${usuario.lineaId})` : ''}`
    : 'No asignada'

  async function solicitarCambioRuta() {
    if (!nuevaLineaId) return
    const linea = empresas.find((l) => String(l.id) === nuevaLineaId)
    setBusy(true)
    setMsg(null)
    try {
      // Intento genérico: crea una solicitud de registro/cambio con datos disponibles.
      // El backend definitivo debe exponer un tipo CAMBIO_RUTA y validar alcance/aprobación.
      await (solicitudes as any).crearCambioRuta?.({
        usuarioId: usuario?.id,
        lineaSolicitadaId: Number(nuevaLineaId),
      })
      setMsg(`Solicitud de cambio enviada${linea ? ` a ${linea.nombre}` : ''}.`)
    } catch (cause) {
      // Fallback informativo si el endpoint no existe.
      setMsg(
        `No se pudo registrar la solicitud en el backend (requiere endpoint de cambio de ruta). ` +
          `Ruta solicitada: ${linea?.nombre || nuevaLineaId}. Detalle: ${toErrorMessage(cause)}`,
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h4">Ajustes</Typography>
      <Typography color="text.secondary">
        Configuración de tu cuenta y de tu ruta de trabajo.
      </Typography>

      <FeedbackAlert message={msg} onClose={() => setMsg(null)} />

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Mi línea actual
          </Typography>
          <Alert severity="info" sx={{ borderRadius: 3 }}>
            Línea asignada: <b>{lineaActual}</b>. Si tu cuenta aún no tiene línea, el administrador debe asignártela.
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={1.5}>
            <Typography variant="h6">Solicitar cambio de ruta</Typography>
            <Typography variant="body2" color="text.secondary">
              Si te cambias de ruta, envía una solicitud para que sea aprobada según el flujo definido (admin/jefe
              destino). Requiere soporte de solicitudes tipadas (<code>CAMBIO_RUTA</code>) en el backend.
            </Typography>
            <TextField
              select
              label="Nueva línea / empresa"
              value={nuevaLineaId}
              onChange={(e) => setNuevaLineaId(e.target.value)}
              sx={{ maxWidth: 420 }}
              helperText="Selecciona la empresa/corredor (C2–C11), no una subruta específica."
            >
              {empresas.map((l) => (
                <MenuItem key={l.id} value={String(l.id)}>
                  {l.nombre}
                </MenuItem>
              ))}
            </TextField>
            <Box>
              <Button
                variant="contained"
                startIcon={<SendIcon />}
                onClick={solicitarCambioRuta}
                disabled={!nuevaLineaId || busy}
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
