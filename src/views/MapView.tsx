import { useEffect, useMemo, useState } from 'react'
import { Alert, Autocomplete, Box, Card, CardContent, Chip, FormControlLabel, Stack, Switch, TextField, Typography } from '@mui/material'
import { MapContainer, TileLayer, CircleMarker, Polyline, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { config } from '../config'
import { backend } from '../api/backend'
import type { Linea, PuntoControl } from '../types'

function Fit({ points }: { points: [number, number][] }) {
  const map = useMap()
  useEffect(() => { if (points.length) map.fitBounds(points as any, { padding: [30, 30], maxZoom: 16 }) }, [map, points])
  return null
}

function pt(p: PuntoControl): [number, number] | null {
  const lat = p.lat ?? p.latitude ?? p.latitud
  const lng = p.lng ?? p.longitude ?? p.longitud
  if (lat == null || lng == null) return null
  return [Number(lat), Number(lng)]
}

function routeLabel(l: Linea) {
  const od = l.origen && l.destino ? ` · ${l.origen} → ${l.destino}` : l.origen ? ` · ${l.origen}` : ''
  return `${l.nombre}${od}`
}

export default function MapView() {
  const [lineas, setLineas] = useState<Linea[]>([])
  const [selected, setSelected] = useState<Linea | null>(null)
  const [puntos, setPuntos] = useState<PuntoControl[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingLineas, setLoadingLineas] = useState(false)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    setLoadingLineas(true)
    backend.lineas().then((d) => {
      const list = Array.isArray(d) ? d : []
      // principales (Línea C...) primero, luego SIT por id
      list.sort((a, b) => {
        const am = /^L[ií]nea\s*C\d+/i.test(a.nombre) ? 0 : 1
        const bm = /^L[ií]nea\s*C\d+/i.test(b.nombre) ? 0 : 1
        if (am !== bm) return am - bm
        return Number(a.id) - Number(b.id)
      })
      setLineas(list)
      if (list[0]) setSelected(list[0])
    }).catch((e) => setError(e.message)).finally(() => setLoadingLineas(false))
  }, [])

  useEffect(() => {
    if (!selected) return
    setLoading(true); setError(null)
    backend.puntosControl(selected.id).then((d) => setPuntos(Array.isArray(d) ? d : []))
      .catch((e) => { setError(e.message); setPuntos([]) })
      .finally(() => setLoading(false))
  }, [selected?.id])

  const points = useMemo(() => puntos.map(pt).filter(Boolean) as [number, number][], [puntos])
  const color = selected?.colorHex || '#6750A4'
  const tileUrl = config.mapboxToken
    ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${config.mapboxToken}`
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  const attribution = config.mapboxToken ? '© Mapbox © OpenStreetMap' : '© OpenStreetMap contributors'

  // 6 puntos de control más importantes (como la app), para no saturar el mapa/panel
  const importantPuntos = useMemo(() => {
    const count = 6
    if (puntos.length <= count) return puntos
    const r: PuntoControl[] = []
    for (let i = 0; i < count; i++) {
      const idx = Math.floor((i * (puntos.length - 1)) / (count - 1))
      r.push(puntos[idx])
    }
    return r
  }, [puntos])
  const markerPuntos = showAll ? puntos : importantPuntos

  return (
    <Stack spacing={2}>
      <Typography variant="h4">Mapa de rutas</Typography>
      <Typography color="text.secondary">
        Líneas y paraderos desde la base de datos ({config.apiUrl ? 'API configurada' : 'sin API'}). {config.mapboxToken ? 'Usando Mapbox.' : 'Usando OpenStreetMap.'} Total: {lineas.length} rutas.
      </Typography>
      {error && <Alert severity="warning" sx={{ borderRadius: 3 }}>{error} — verifica <code>VITE_API_URL</code> y el backend.</Alert>}
      <Card><CardContent>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
          <Autocomplete
            options={lineas}
            value={selected}
            onChange={(_, v) => setSelected(v)}
            getOptionLabel={routeLabel}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            filterOptions={(opts, { inputValue }) => {
              const q = inputValue.toLowerCase()
              return opts.filter((l) => routeLabel(l).toLowerCase().includes(q) || (l.corredor || '').toLowerCase().includes(q))
            }}
            renderInput={(params) => <TextField {...params} label="Buscar línea / ruta" size="small" placeholder="Ej. C2, C7, SIT, Paucarpata..." />}
            sx={{ minWidth: 320, flex: 1 }}
            loading={loadingLineas}
            noOptionsText="Sin rutas"
          />
          {selected && <Chip label={selected.nombre} sx={{ bgcolor: color, color: '#fff', fontWeight: 700 }} />}
          {selected?.corredor && <Chip label={`Corredor ${selected.corredor}`} variant="outlined" />}
          <Chip label={`${puntos.length} paraderos`} variant="outlined" />
          <Chip label={`${importantPuntos.length} puntos de control`} color="primary" variant="outlined" />
          <FormControlLabel control={<Switch checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />} label={showAll ? 'Mostrando todos' : 'Mostrar todos'} />
          {loading && <Chip label="Cargando paraderos..." />}
        </Stack>
      </CardContent></Card>
      <Card sx={{ overflow: 'hidden' }}>
        <Box sx={{ height: { xs: 420, md: 600 } }}>
          <MapContainer center={points[0] || [-16.409, -71.537]} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer url={tileUrl} attribution={attribution} {...(config.mapboxToken ? { tileSize: 512, zoomOffset: -1 } : {}) as any} />
            {points.length > 1 && <Polyline positions={points} pathOptions={{ color, weight: 5, opacity: 0.85 }} />}
            {markerPuntos.map((p, i) => {
              const c = pt(p); if (!c) return null
              return (
                <CircleMarker key={p.id ?? `${selected?.id}-${i}`} center={c} radius={5} pathOptions={{ color, fillColor: '#fff', fillOpacity: 1, weight: 2 }}>
                  <Popup><b>{p.nombre || `Paradero ${p.orden ?? i + 1}`}</b>{p.orden != null ? <><br/>Orden: {p.orden}</> : null}{(p.radioMetros ?? p.radioToleranciaMetros) != null ? <><br/>Radio: {p.radioMetros ?? p.radioToleranciaMetros} m</> : null}</Popup>
                </CircleMarker>
              )
            })}
            {points.length > 0 && <Fit points={points} />}
          </MapContainer>
        </Box>
      </Card>
      {!config.apiUrl && <Alert severity="info" sx={{ borderRadius: 3 }}>Sin <code>VITE_API_URL</code>: configura la URL del backend en <code>.env</code> (local: <code>http://localhost:8080/api</code>).</Alert>}
      <Typography variant="caption" color="text.secondary">
        {showAll ? `Mostrando los ${puntos.length} paraderos.` : `Mostrando 6 puntos de control importantes (como la app) sobre el trazado completo.`} Activa "Mostrar todos" para ver todos los paraderos.
      </Typography>
    </Stack>
  )
}
