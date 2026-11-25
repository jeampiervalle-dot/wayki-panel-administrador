export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  // Backend Spring: catálogo de subrutas, geometría y paraderos (lee gowayki_db).
  rutasApiUrl: import.meta.env.VITE_RUTAS_API_URL || 'http://localhost:8080/api',
  // Reverse geocoding de paraderos: define VITE_GEOCODING_TOKEN en .env.local.
  geocodingToken: import.meta.env.VITE_GEOCODING_TOKEN || '',
  mapboxToken: import.meta.env.VITE_MAPBOX_TOKEN || '',
}
