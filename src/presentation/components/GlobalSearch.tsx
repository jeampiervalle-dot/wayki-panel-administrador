// ============================================================
// Búsqueda global del panel: consulta los repositorios HTTP
// (BD real) y permite saltar al módulo que corresponda.
// ============================================================

import { useMemo, useState, type KeyboardEvent } from 'react'
import { useSession } from '../../app/providers'
import {
  Box,
  ClickAwayListener,
  CircularProgress,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Paper,
  Popper,
  TextField,
  Typography,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/SearchRounded'
import type { View } from '../../app/navigation'
import { useDependencies } from '../../app/providers'
import { useAsync } from '../../application/useAsync'
import { subrutaStore } from '../../data/subrutaStore'

interface NavItem {
  view: View
  label: string
  description: string
}

interface Resultado {
  id: string
  tipo: string
  titulo: string
  detalle: string
  view: View
}

interface DatosBusqueda {
  lineas: Awaited<ReturnType<ReturnType<typeof useDependencies>['lineas']['listar']>>
  usuarios: Awaited<ReturnType<ReturnType<typeof useDependencies>['usuarios']['listar']>>
  unidades: Awaited<ReturnType<ReturnType<typeof useDependencies>['unidades']['listar']>>
  solicitudes: Awaited<ReturnType<ReturnType<typeof useDependencies>['solicitudes']['listar']>>
  rutas: Awaited<ReturnType<ReturnType<typeof useDependencies>['rutasMapa']['rutas']>>
  fallos: number
}

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function coincide(texto: string | undefined, q: string): boolean {
  return normalizar(texto ?? '').includes(q)
}

export default function GlobalSearch({
  navItems,
  rol,
  onNavigate,
}: {
  navItems: NavItem[]
  rol: string
  onNavigate: (view: View) => void
}) {
  const { lineas, usuarios, unidades, solicitudes, rutasMapa } = useDependencies()
  const { sesion } = useSession()
  const esJefe = rol === 'JEFE_RUTA'
  const lineaId = sesion?.usuario.lineaId
  const guardada = sesion?.usuario.dni ? subrutaStore.leerUsuario(sesion.usuario.dni) : null
  const subrutaJefe =
    sesion?.usuario.subrutaDbId ??
    guardada?.subrutaDbId ??
    guardada?.subrutaId ??
    sesion?.usuario.subrutaId ??
    null
  const subrutaJefeNumero = Number(subrutaJefe ?? 0) || undefined

  const consulta = useAsync<DatosBusqueda>(async () => {
    const [rLineas, rUsuarios, rUnidades, rSolicitudes, rRutas] = await Promise.allSettled([
      lineas.listar(),
      usuarios.listar(),
      unidades.listar(),
      // 'ADMIN' no es un TipoSolicitud: los admins omiten el parámetro.
      solicitudes.listar(esJefe ? 'JEFE_RUTA' : undefined, esJefe ? subrutaJefeNumero : undefined),
      rutasMapa.rutas(),
    ])

    const porLinea = <T,>(items: T[], lineaDe: (item: T) => number | undefined): T[] =>
      esJefe && lineaId != null ? items.filter((item) => lineaDe(item) === lineaId) : items
    const enSubruta = (valor: string | undefined | null): boolean => {
      if (!esJefe || !subrutaJefe) return true
      // Si el backend no informa la subruta, se conserva el registro.
      return !valor || String(valor) === String(subrutaJefe)
    }

    return {
      lineas: rLineas.status === 'fulfilled' ? porLinea(rLineas.value, (linea) => linea.id) : [],
      usuarios:
        rUsuarios.status === 'fulfilled'
          ? porLinea(rUsuarios.value, (usuario) => usuario.lineaId).filter((usuario) =>
              enSubruta(usuario.subrutaDbId ?? usuario.subrutaId),
            )
          : [],
      unidades:
        rUnidades.status === 'fulfilled'
          ? porLinea(rUnidades.value, (unidad) => unidad.lineaId).filter((unidad) => {
              const local = subrutaStore.leerUnidad(unidad.id)
              return enSubruta(unidad.subrutaId ?? local?.subrutaDbId ?? local?.subrutaId)
            })
          : [],
      solicitudes:
        rSolicitudes.status === 'fulfilled'
          ? rSolicitudes.value.filter((solicitud) =>
              enSubruta(
                solicitud.subrutaSolicitadaId != null
                  ? String(solicitud.subrutaSolicitadaId)
                  : undefined,
              ),
            )
          : [],
      rutas: rRutas.status === 'fulfilled' ? rRutas.value : [],
      fallos: [rLineas, rUsuarios, rUnidades, rSolicitudes, rRutas].filter(
        (resultado) => resultado.status === 'rejected',
      ).length,
    }
  }, [lineas, usuarios, unidades, solicitudes, rutasMapa, esJefe, lineaId, subrutaJefe])

  const [term, setTerm] = useState('')
  const [open, setOpen] = useState(false)
  const [activo, setActivo] = useState(0)
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)

  const datos = consulta.data
  const q = normalizar(term)
  const visible = open && q.length >= 2

  const resultados = useMemo<Resultado[]>(() => {
    if (!datos || q.length < 2) return []
    const out: Resultado[] = []

    for (const entry of navItems) {
      if (coincide(entry.label, q) || coincide(entry.description, q)) {
        out.push({
          id: `mod-${entry.view}`,
          tipo: 'Módulo',
          titulo: entry.label,
          detalle: entry.description,
          view: entry.view,
        })
      }
    }
    for (const linea of datos.lineas) {
      if (
        coincide(linea.nombre, q) ||
        coincide(linea.corredor, q) ||
        coincide(linea.origen, q) ||
        coincide(linea.destino, q)
      ) {
        out.push({
          id: `lin-${linea.id}`,
          tipo: 'Empresa',
          titulo: linea.nombre,
          detalle: [linea.origen, linea.destino].filter(Boolean).join(' → ') || `ID ${linea.id}`,
          view: esJefe ? 'ajustes' : 'rutas',
        })
      }
    }
    for (const usuario of datos.usuarios) {
      if (
        coincide(usuario.nombre, q) ||
        coincide(usuario.dni, q) ||
        coincide(usuario.rol, q) ||
        coincide(usuario.lineaNombre, q)
      ) {
        out.push({
          id: `usu-${usuario.id}`,
          tipo: 'Usuario',
          titulo: usuario.nombre || usuario.dni,
          detalle: [usuario.rol, usuario.lineaNombre].filter(Boolean).join(' · '),
          view: esJefe ? 'mis-choferes' : 'cuentas',
        })
      }
    }
    for (const unidad of datos.unidades) {
      if (
        coincide(unidad.placa, q) ||
        coincide(unidad.numeroPadron, q) ||
        coincide(unidad.lineaNombre, q) ||
        coincide(unidad.estado, q)
      ) {
        out.push({
          id: `uni-${unidad.id}`,
          tipo: 'Unidad',
          titulo: [unidad.placa, unidad.numeroPadron].filter(Boolean).join(' · ') || `Unidad ${unidad.id}`,
          detalle: [unidad.lineaNombre, unidad.estado].filter(Boolean).join(' · '),
          view: esJefe ? 'combis' : 'unidades',
        })
      }
    }
    for (const solicitud of datos.solicitudes) {
      if (
        coincide(solicitud.nombreCompleto, q) ||
        coincide(solicitud.dni, q) ||
        coincide(solicitud.rutaTrabajo, q) ||
        coincide(solicitud.estado, q)
      ) {
        out.push({
          id: `sol-${solicitud.id}`,
          tipo: 'Solicitud',
          titulo: solicitud.nombreCompleto || solicitud.dni,
          detalle: [solicitud.estado, solicitud.rutaTrabajo].filter(Boolean).join(' · '),
          view: 'solicitudes',
        })
      }
    }
    for (const ruta of datos.rutas) {
      if (
        coincide(ruta.longName, q) ||
        coincide(ruta.shortName, q) ||
        coincide(ruta.agency?.name, q) ||
        coincide(ruta.from, q) ||
        coincide(ruta.to, q)
      ) {
        out.push({
          id: `rut-${ruta.id}`,
          tipo: 'Ruta',
          titulo: ruta.longName || ruta.shortName,
          detalle: ruta.agency?.name ?? '',
          view: 'mapa',
        })
      }
    }
    return out.slice(0, 40)
  }, [datos, q, navItems, esJefe])

  function ir(resultado: Resultado) {
    onNavigate(resultado.view)
    setTerm('')
    setOpen(false)
    setActivo(0)
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setOpen(false)
      return
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActivo((actual) => Math.min(actual + 1, Math.max(resultados.length - 1, 0)))
      return
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActivo((actual) => Math.max(actual - 1, 0))
      return
    }
    if (event.key === 'Enter') {
      event.preventDefault()
      const elegido = resultados[activo] ?? resultados[0]
      if (elegido) ir(elegido)
    }
  }

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Box ref={setAnchorEl} sx={{ width: { xs: 120, sm: 200, md: 290 }, flexShrink: 0 }}>
        <TextField
          size="small"
          value={term}
          placeholder="Buscar línea, usuario, placa…"
          aria-label="Buscar en todo el panel"
          onChange={(event) => {
            setTerm(event.target.value)
            setOpen(true)
            setActivo(0)
          }}
          onFocus={() => {
            if (q.length >= 2) setOpen(true)
          }}
          onKeyDown={onKeyDown}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 17, color: 'text.secondary' }} />
                </InputAdornment>
              ),
              endAdornment: consulta.loading ? (
                <InputAdornment position="end">
                  <CircularProgress size={13} />
                </InputAdornment>
              ) : undefined,
            },
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: 'background.default',
              fontSize: 13,
              height: 38,
            },
            '& input::placeholder': { opacity: 0.8 },
          }}
        />

        <Popper
          open={visible}
          anchorEl={anchorEl}
          placement="bottom-end"
          sx={{ zIndex: (tema) => tema.zIndex.modal + 1, width: 360, maxWidth: '90vw' }}
        >
          <Paper
            elevation={0}
            sx={{
              mt: 0.75,
              maxHeight: 420,
              overflow: 'auto',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: 8,
            }}
          >
            <List dense disablePadding>
              {resultados.length === 0 && (
                <ListItem>
                  <ListItemText
                    primary={consulta.loading ? 'Cargando datos…' : 'Sin resultados'}
                    secondary={consulta.loading ? undefined : `No hay coincidencias para “${term}”.`}
                    slotProps={{ primary: { sx: { fontSize: 12 } }, secondary: { sx: { fontSize: 11 } } }}
                  />
                </ListItem>
              )}
              {resultados.map((resultado, index) => (
                <ListItemButton
                  key={resultado.id}
                  selected={index === activo}
                  onMouseEnter={() => setActivo(index)}
                  onClick={() => ir(resultado)}
                >
                  <ListItemText
                    primary={`${resultado.tipo}: ${resultado.titulo}`}
                    secondary={resultado.detalle}
                    slotProps={{
                      primary: { sx: { fontSize: 12, fontWeight: 600 } },
                      secondary: { sx: { fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } },
                    }}
                  />
                </ListItemButton>
              ))}
            </List>
            {(resultados.length > 0 || (datos?.fallos ?? 0) > 0) && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', px: 2, py: 0.8 }}>
                {resultados.length} resultado{resultados.length === 1 ? '' : 's'} · ↵ para abrir
                {(datos?.fallos ?? 0) > 0 && ' · Algunos datos no cargaron; los resultados pueden estar incompletos'}
              </Typography>
            )}
          </Paper>
        </Popper>
      </Box>
    </ClickAwayListener>
  )
}
