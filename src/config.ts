// ============================================================
// AQUÍ VA LA API DE CONEXIÓN
// La URL del backend se define en el archivo .env (VITE_API_URL).
// Ejemplo: VITE_API_URL=http://TU_VPS:8080/api
// ============================================================
export const config = {
  apiUrl: ((import.meta.env.VITE_API_URL as string) || '').replace(/\/$/, ''),
  mapboxToken: (import.meta.env.VITE_MAPBOX_TOKEN as string) || '',
}
