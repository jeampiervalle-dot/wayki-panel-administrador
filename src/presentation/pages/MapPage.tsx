import { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
  Card,
  CardContent,
  Chip,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { config } from '../../config'
import type { Linea, PuntoControl } from '../../domain/models'
import { useMapa } from '../../application/useMapa'
import { useDependencies } from '../../app/providers'

const DEFAULT_CENTER: [number, number] = [-16.409, -71.537]
const PUNTOS_DESTACADOS = 6

function Fit({ points }: { points: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (points.length) map.fitBounds(points, { padding: [30, 30], maxZoom: 16 })
  }, [map, points])
  return null
}

function toLatLng(punto: PuntoControl): [number, number] | null {
  if (punto.lat == null || punto.lng == null) return null
  return [punto.lat, punto.lng]
}

function isLatLng(value: [number, number] | null): value is [number, number] {
  return value !== null
}

function routeLabel(linea: Linea) {
  const origenDestino =
    linea.origen && linea.destino
      ? ` · ${linea.origen} → ${linea.destino}`
      : linea.origen
        ? ` · ${linea.origen}`
        : ''
  return `${linea.nombre}${origenDestino}`
}

function puntosDestacados(puntos: PuntoControl[]): PuntoControl[] {
  if (puntos.length <= PUNTOS_DESTACADOS) return puntos
  const resultado: PuntoControl[] = []
  for (let index = 0; index < PUNTOS_DESTACADOS; index++) {
    const punto = Math.floor((index * (puntos.length - 1)) / (PUNTOS_DESTACADOS - 1))
    resultado.push(puntos[punto])
  }
  return resultado
}

export default function MapPage() {
  const { lineas: lineasRepo } = useDependencies()
  const { lineas, selected, selectLinea, puntos, loadingLineas, loadingPuntos, error } =
    useMapa(lineasRepo)

  const [showAll, setShowAll] = useState(false)

  const points = useMemo(() => puntos.map(toLatLng).filter(isLatLng), [puntos])
  const color = selected?.colorHex || '#6750A4'
  const importantPuntos = useMemo(() => puntosDestacados(puntos), [puntos])
  const markerPuntos = showAll ? puntos : importantPuntos

  const tileUrl = config.mapboxToken
    ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${config.mapboxToken}`
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  const attribution = config.mapboxToken
    ? '© Mapbox © OpenStreetMap'
    : '© OpenStreetMap contributors'
  const mapboxTileProps = config.mapboxToken ? { tileSize: 512, zoomOffset: -1 } : {}

  return (
    <Stack spacing={2}>
      <Typography variant="h4">Mapa de rutas</Typography>
      <Typography color="text.secondary">
        Líneas y paraderos desde la base de datos (
        {config.apiUrl ? 'API configurada' : 'sin API'}).{' '}
        {config.mapboxToken ? 'Usando Mapbox.' : 'Usando OpenStreetMap.'} Total: {lineas.length}{' '}
        rutas.
      </Typography>

      {error && (
        <Alert severity="warning" sx={{ borderRadius: 3 }}>
          {error} — verifica <code>VITE_API_URL</code> y el backend.
        </Alert>
      )}

      <Card>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
            <Autocomplete
              options={lineas}
              value={selected}
              onChange={(_, value) => selectLinea(value?.id ?? null)}
              getOptionLabel={routeLabel}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              filterOptions={(options, { inputValue }) => {
                const query = inputValue.toLowerCase()
                return options.filter(
                  (linea) =>
                    routeLabel(linea).toLowerCase().includes(query) ||
                    (linea.corredor || '').toLowerCase().includes(query),
                )
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Buscar línea / ruta"
                  size="small"
                  placeholder="Ej. C2, C7, SIT, Paucarpata..."
                />
              )}
              sx={{ minWidth: 320, flex: 1 }}
              loading={loadingLineas}
              noOptionsText="Sin rutas"
            />
            {selected && (
              <Chip
                label={selected.nombre}
                sx={{ bgcolor: color, color: '#fff', fontWeight: 700 }}
              />
            )}
            {selected?.corredor && <Chip label={`Corredor ${selected.corredor}`} variant="outlined" />}
            <Chip label={`${puntos.length} paraderos`} variant="outlined" />
            <Chip
              label={`${importantPuntos.length} puntos de control`}
              color="primary"
              variant="outlined"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={showAll}
                  onChange={(event) => setShowAll(event.target.checked)}
                />
              }
              label={showAll ? 'Mostrando todos' : 'Mostrar todos'}
            />
            {loadingPuntos && <Chip label="Cargando paraderos..." />}
          </Stack>
        </CardContent>
      </Card>

      <Card sx={{ overflow: 'hidden' }}>
        <Box sx={{ height: { xs: 420, md: 600 } }}>
          <MapContainer
            center={points[0] ?? DEFAULT_CENTER}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer url={tileUrl} attribution={attribution} {...mapboxTileProps} />
            {points.length > 1 && (
              <Polyline positions={points} pathOptions={{ color, weight: 5, opacity: 0.85 }} />
            )}
            {markerPuntos.map((punto, index) => {
              const coords = toLatLng(punto)
              if (!coords) return null
              return (
                <CircleMarker
                  key={punto.id ?? `${selected?.id}-${index}`}
                  center={coords}
                  radius={5}
                  pathOptions={{ color, fillColor: '#fff', fillOpacity: 1, weight: 2 }}
                >
                  <Popup>
                    <b>{punto.nombre || `Paradero ${punto.orden ?? index + 1}`}</b>
                    {punto.orden != null ? (
                      <>
                        <br />
                        Orden: {punto.orden}
                      </>
                    ) : null}
                    {punto.radioMetros != null ? (
                      <>
                        <br />
                        Radio: {punto.radioMetros} m
                      </>
                    ) : null}
                  </Popup>
                </CircleMarker>
              )
            })}
            {points.length > 0 && <Fit points={points} />}
          </MapContainer>
        </Box>
      </Card>

      {!config.apiUrl && (
        <Alert severity="info" sx={{ borderRadius: 3 }}>
          Sin <code>VITE_API_URL</code>: configura la URL del backend en <code>.env</code> (local:{' '}
          <code>http://localhost:8080/api</code>).
        </Alert>
      )}
      <Typography variant="caption" color="text.secondary">
        {showAll
          ? `Mostrando los ${puntos.length} paraderos.`
          : `Mostrando 6 puntos de control importantes (como la app) sobre el trazado completo.`}{' '}
        Activa "Mostrar todos" para ver todos los paraderos.
      </Typography>
    </Stack>
  )
}
