import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  Stack,
  Switch,
  Typography,
} from '@mui/material'
import DirectionsBusIcon from '@mui/icons-material/DirectionsBusRounded'
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polyline,
  Popup,
  Tooltip,
  useMap,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import {
  describirParaderos,
  type DescripcionParadero,
} from '../../data/http/descripcionesParaderos'
import { extraerCodigoRuta } from '../../application/useMapa'
import { etiquetaRuta, useRutasMapa } from '../../application/useRutasMapa'
import { useDependencies, useSession } from '../../app/providers'
import { useLineas } from '../../application/useLineas'
import { useSubrutas } from '../../application/useSubrutas'
import { subrutaStore } from '../../data/subrutaStore'
import { PageHeader } from '../components/PageHeader'
import { RouteBadge } from '../components/RouteBadge'

const DEFAULT_CENTER: [number, number] = [-16.409, -71.537]

function Fit({ points }: { points: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length) map.fitBounds(points, { padding: [30, 30], maxZoom: 16 })
  }, [map, points])
  return null
}

export default function MapPage() {
  const { rutasMapa } = useDependencies()
  const { sesion } = useSession()
  const usuario = sesion?.usuario
  const esJefe = usuario?.rol === 'JEFE_RUTA'
  const deps = useDependencies()
  const { lineas: todasLineas } = useLineas(deps.lineas)
  const { rutas: rutasSmartBus } = useSubrutas()
  const lineaAsignada = todasLineas.find((l) => l.id === usuario?.lineaId)
  const preferCodigo = extraerCodigoRuta({
    nombre: lineaAsignada?.nombre ?? usuario?.lineaNombre ?? '',
    corredor: lineaAsignada?.corredor ?? '',
  })

  const guardada = usuario?.dni ? subrutaStore.leerUsuario(usuario.dni) : null
  const subrutaAsignadaId =
    usuario?.subrutaDbId ?? guardada?.subrutaDbId ?? guardada?.subrutaId ?? usuario?.subrutaId ?? null
  // La subruta asignada se resuelve al id del catálogo para no mostrar nunca
  // todas las rutas de la empresa cuando el texto no coincide.
  const subrutaJefe = esJefe
    ? rutasSmartBus.find(
        (r) =>
          (r.subrutaDbId != null && String(r.subrutaDbId) === String(subrutaAsignadaId)) ||
          r.id === String(subrutaAsignadaId),
      ) ?? null
    : null
  const agenciaJefe = subrutaJefe?.agency?.name ?? null
  // Si la cuenta guardó un routeId SmartBus directo, también se respeta.
  const preferRutaId = esJefe
    ? subrutaJefe?.id ??
      (subrutaAsignadaId && !/^\d+$/.test(subrutaAsignadaId) ? subrutaAsignadaId : null)
    : null

  const {
    grupos,
    grupo,
    ruta,
    trazos,
    detalleVuelta,
    seleccionarGrupo,
    seleccionarRuta,
    loading,
    error,
  } = useRutasMapa(rutasMapa, preferCodigo, preferRutaId)

  const [verRetorno, setVerRetorno] = useState(false)
  // null = "auto": se abre el grupo activo en cuanto llega el catálogo.
  const [expandido, setExpandido] = useState<string | null>(null)

  // El jefe de ruta solo ve su propia línea/subruta en el mapa.
  const gruposVisibles = useMemo(() => {
    if (!esJefe) return grupos
    // 1) Por agencia de la subruta asignada (SmartBus).
    if (agenciaJefe) {
      const filtrados = grupos.filter((item) => item.key === agenciaJefe)
      if (filtrados.length > 0) return filtrados
    }
    // 2) Por código de línea (C2, C3...).
    if (preferCodigo) {
      const filtrados = grupos.filter((item) => item.codigo.toUpperCase() === preferCodigo.toUpperCase())
      if (filtrados.length > 0) return filtrados
    }
    // 3) Por nombre de la línea asignada (Emarsistran, etc.).
    const nombreLinea = (lineaAsignada?.nombre ?? usuario?.lineaNombre ?? '').trim().toLowerCase()
    if (nombreLinea) {
      const filtrados = grupos.filter((item) => {
        const empresa = item.empresa.toLowerCase()
        const key = item.key.toLowerCase()
        const codigo = item.codigo.toLowerCase()
        return (
          (empresa.length > 0 && (empresa.includes(nombreLinea) || nombreLinea.includes(empresa))) ||
          key.includes(nombreLinea) ||
          (codigo.length > 3 && codigo.includes(nombreLinea))
        )
      })
      if (filtrados.length > 0) return filtrados
    }
    // 4) Fallback: solo la línea seleccionada (auto-seleccionada).
    if (grupo) {
      return grupos.filter((item) => item.key === grupo.key)
    }
    return grupos
  }, [grupos, esJefe, agenciaJefe, preferCodigo, lineaAsignada, usuario, grupo])

  // Rutas visibles dentro de cada empresa para el jefe: solo su subruta.
  function rutasDeGrupo(item: (typeof grupos)[number]) {
    if (!esJefe) return item.rutas
    if (subrutaJefe) {
      return item.rutas.filter(
        (route) => route.id === subrutaJefe.id || route.routeIdRetorno === subrutaJefe.id,
      )
    }
    const subrutaNombre = (usuario?.nombreSubruta ?? '').toLowerCase()
    if (!subrutaNombre) {
      // Sin subruta resuelta, no dejamos el panel vacío: mostramos la ruta
      // auto-seleccionada en su empresa.
      return ruta && item.key === grupo?.key ? [ruta] : []
    }
    return item.rutas.filter((route) => {
      const longName = (route.longName ?? route.nombre ?? '').toLowerCase()
      const from = (route.from ?? '').toLowerCase()
      const to = (route.to ?? '').toLowerCase()
      if (from && to && subrutaNombre.includes(from) && subrutaNombre.includes(to)) return true
      return !!longName && (longName.includes(subrutaNombre) || subrutaNombre.includes(longName))
    })
  }

  // Igual que en GuíaBus: la geometría original, sin ajustes ni divisiones.
  const visibles = useMemo(
    () => (verRetorno ? trazos : trazos.filter((trazo) => trazo.key === 'ida')),
    [trazos, verRetorno],
  )
  const positions = useMemo(() => visibles.flatMap((trazo) => trazo.positions), [visibles])
  const paraderos = useMemo(() => visibles.flatMap((trazo) => trazo.paraderos), [visibles])

  const [descripciones, setDescripciones] = useState<Record<string, DescripcionParadero>>({})
  useEffect(() => {
    if (!paraderos.length) return
    let cancelado = false
    const control = new AbortController()
    void describirParaderos(
      paraderos,
      (id, descripcion) => {
        if (cancelado) return
        setDescripciones((actual) => ({ ...actual, [id]: descripcion }))
      },
      control.signal,
    )
    return () => {
      cancelado = true
      control.abort()
    }
  }, [paraderos])

  const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  const attribution = '© OpenStreetMap contributors'

  return (
    <Stack spacing={2}>
      <style>{`
        .leaflet-tooltip.paradero-num {
          background: #fff;
          border: 2px solid #7B82A0;
          border-radius: 6px;
          color: #3D4365;
          font-size: 10px;
          font-weight: 700;
          padding: 1px 5px;
          box-shadow: none;
        }
        .leaflet-tooltip.paradero-num::before { display: none; }
      `}</style>
      <PageHeader
        title="Mapa de rutas"
        description={`Trazados y paraderos de la base de datos · ${gruposVisibles.length} líneas visibles`}
      />

      {error && (
        <Alert severity="warning">
          {error} — no se pudo cargar el catálogo de rutas del backend.
        </Alert>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '300px minmax(0, 1fr) 280px' },
          gap: 2,
          alignItems: 'stretch',
        }}
      >
        {/* Panel de líneas y rutas */}
        <Card sx={{ maxHeight: 680, overflowY: 'auto' }}>
          <CardContent sx={{ p: 1.5 }}>
            <Typography variant="overline" color="text.secondary">
              Empresas y rutas
            </Typography>
            {loading && !gruposVisibles.length && (
              <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mt: 2 }}>
                <CircularProgress size={18} />
                <Typography variant="body2">Cargando rutas...</Typography>
              </Stack>
            )}
            <Stack spacing={0.5} sx={{ mt: 1 }}>
              {gruposVisibles.map((item) => {
                const abierto = expandido === null ? item.key === grupo?.key : expandido === item.key
                const rutasFinal = rutasDeGrupo(item)
                return (
                  <Box key={item.key}>
                    <Button
                      fullWidth
                      onClick={() => {
                        seleccionarGrupo(item.key)
                        setExpandido(abierto ? '' : item.key)
                      }}
                      startIcon={<DirectionsBusIcon />}
                      endIcon={
                        <Chip size="small" label={`${rutasFinal.length} ruta${rutasFinal.length === 1 ? '' : 's'}`} variant="outlined" />
                      }
                      sx={{
                        justifyContent: 'flex-start',
                        textAlign: 'left',
                        color: grupo?.key === item.key ? 'primary.main' : 'text.primary',
                        '& .MuiButton-endIcon': { ml: 'auto' },
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {item.codigo}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                          {item.empresa}
                        </Typography>
                      </Box>
                    </Button>
                    {abierto && (
                      <Stack spacing={0} sx={{ pl: 1, pb: 0.5 }}>
                        {rutasFinal.length === 0 && (
                          <Typography variant="caption" color="text.secondary" sx={{ px: 1, py: 1 }}>
                            No hay rutas de tu subruta en esta empresa.
                          </Typography>
                        )}
                        {rutasFinal.map((route) => (
                          <Button
                            key={route.id}
                            size="small"
                            fullWidth
                            onClick={() => seleccionarRuta(route.id)}
                            sx={{
                              justifyContent: 'flex-start',
                              textAlign: 'left',
                              textTransform: 'none',
                              color: ruta?.id === route.id ? 'primary.main' : 'text.secondary',
                              bgcolor: ruta?.id === route.id ? 'action.selected' : 'transparent',
                            }}
                          >
                            <Box sx={{ minWidth: 0, width: '100%' }}>
                              <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                  {route.shortName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {route.stopsCount} paradas
                                </Typography>
                              </Stack>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}
                              >
                                {etiquetaRuta(route)}
                              </Typography>
                            </Box>
                          </Button>
                        ))}
                      </Stack>
                    )}
                  </Box>
                )
              })}
            </Stack>
          </CardContent>
        </Card>

        {/* Mapa */}
        <Card sx={{ overflow: 'hidden' }}>
          {loading && (
            <Box sx={{ height: 3, bgcolor: 'primary.main', opacity: 0.6 }} />
          )}
          <Box sx={{ height: { xs: 420, md: 640 }, bgcolor: '#F1ECF0' }}>
            <MapContainer
              center={positions[0] ?? DEFAULT_CENTER}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer url={tileUrl} attribution={attribution} />
              {visibles.map((trazo) => (
                <Polyline
                  key={trazo.key}
                  positions={trazo.positions}
                  pathOptions={{ color: trazo.color, weight: 5, opacity: 0.95 }}
                />
              ))}
              {paraderos.map((punto, index) => {
                if (punto.lat == null || punto.lng == null) return null
                return (
                  <CircleMarker
                    key={`${punto.nombre}-${index}`}
                    center={[punto.lat, punto.lng]}
                    radius={8}
                    pathOptions={{
                      color: visibles[0]?.color ?? '#7B82A0',
                      fillColor: '#fff',
                      fillOpacity: 1,
                      weight: 2,
                    }}
                  >
                    <Tooltip permanent direction="center" className="paradero-num">
                      {(punto.orden ?? index) + 1}
                    </Tooltip>
                    <Popup>
                      <b>
                        {(punto.orden ?? index) + 1}. {punto.nombre}
                      </b>
                      <br />
                      {(() => {
                        const d = descripciones[`${punto.lat?.toFixed(5)}|${punto.lng?.toFixed(5)}`]
                        if (!d) return 'Obteniendo ubicación...'
                        return [d.calle, d.cerca && `Cerca de ${d.cerca}`].filter(Boolean).join(' · ')
                      })()}
                    </Popup>
                  </CircleMarker>
                )
              })}
              {positions.length > 0 && <Fit points={positions} />}
            </MapContainer>
          </Box>
        </Card>

        {/* Detalle de la ruta */}
        <Card>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="overline" color="text.secondary">
              Ruta seleccionada
            </Typography>
            {ruta ? (
              <>
                <Stack direction="row" spacing={1.25} sx={{ mt: 0.5, alignItems: 'center' }}>
                  <RouteBadge code={grupo?.codigo ?? '—'} color={ruta.color} size="md" />
                  <Typography variant="h5">{ruta.shortName}</Typography>
                </Stack>
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                  {etiquetaRuta(ruta)}
                </Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap' }}>
                  <Chip size="small" label={grupo?.codigo ?? ''} color="primary" />
                  <Chip size="small" label={grupo?.empresa ?? ''} variant="outlined" />
                  <Chip size="small" label={`${paraderos.length} paradas`} variant="outlined" />
                </Stack>
                <Divider sx={{ my: 2 }} />
                <Typography variant="overline" color="text.secondary">
                  Trazado
                </Typography>
                <Stack spacing={1} sx={{ mt: 1 }}>
                  {visibles.map((trazo) => (
                    <Stack key={trazo.key} direction="row" spacing={1} sx={{ alignItems: 'flex-start' }}>
                      <Box
                        sx={{
                          width: 16, height: 4, bgcolor: trazo.color, borderRadius: 2,
                          mt: 0.8, flexShrink: 0,
                        }}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {trazo.key === 'ida' ? 'Ida' : 'Retorno'} · {trazo.nombre}
                      </Typography>
                    </Stack>
                  ))}
                  {!visibles.length && loading && (
                    <Typography variant="body2" color="text.secondary">Cargando trazado...</Typography>
                  )}
                </Stack>
                {detalleVuelta && (
                  <FormControlLabel
                    sx={{ mt: 1 }}
                    control={
                      <Switch checked={verRetorno} onChange={(e) => setVerRetorno(e.target.checked)} />
                    }
                    label="Mostrar retorno"
                  />
                )}
                <Divider sx={{ my: 2 }} />
                <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Paraderos en el mapa</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>{paraderos.length}</Typography>
                </Stack>
                <Box sx={{ mt: 1, maxHeight: 240, overflowY: 'auto', pr: 0.5 }}>
                  {paraderos.map((punto, index) => {
                    const d = descripciones[`${punto.lat?.toFixed(5)}|${punto.lng?.toFixed(5)}`]
                    const texto = d
                      ? [d.calle, d.cerca && `Cerca de ${d.cerca}`].filter(Boolean).join(' · ')
                      : 'Obteniendo ubicación...'
                    return (
                      <Stack
                        key={`${punto.nombre}-${index}`}
                        direction="row"
                        spacing={1}
                        sx={{ py: 0.7, borderBottom: '1px solid', borderColor: 'divider' }}
                      >
                        <Box
                          sx={{
                            minWidth: 22, height: 22, borderRadius: '50%', bgcolor: 'primary.main',
                            color: 'background.default', display: 'grid', placeItems: 'center',
                            fontSize: 10, fontWeight: 700, flexShrink: 0,
                          }}
                        >
                          {(punto.orden ?? index) + 1}
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="caption" sx={{ display: 'block', fontWeight: 700 }}>
                            {punto.nombre}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                            {texto}
                          </Typography>
                        </Box>
                      </Stack>
                    )
                  })}
                </Box>
              </>
            ) : (
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Selecciona una empresa y una ruta para ver su trazado.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Box>
    </Stack>
  )
}
