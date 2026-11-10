// ============================================================
// API de conexión (gowayki-nest-admin-back / gowayki_db)
// Define VITE_API_URL en .env apuntando al backend admin.
// - gowayki-nest-admin-back (Django): http://localhost:8000/api
// - Backend principal (Spring):      http://localhost:8080/api
// ============================================================
export const config = {
  apiUrl: ((import.meta.env.VITE_API_URL as string) || '').replace(/\/$/, ''),
  mapboxToken: (import.meta.env.VITE_MAPBOX_TOKEN as string) || '',
}
