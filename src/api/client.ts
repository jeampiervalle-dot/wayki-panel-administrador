import { config } from '../config'

// ============================================================
// AQUÍ VA LA API DE CONEXIÓN (cliente HTTP)
// Todas las peticiones al backend pasan por esta función.
// La URL base viene de src/config.ts -> .env (VITE_API_URL).
// ============================================================
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  if (!config.apiUrl) throw new Error('Configura VITE_API_URL en .env (URL de tu VPS, ej. http://IP:8080/api)')
  const url = path.startsWith('http') ? path : `${config.apiUrl}${path.startsWith('/') ? '' : '/'}${path}`
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) }, ...init })
  const text = await res.text()
  let data: any = null
  try { data = text ? JSON.parse(text) : null } catch { data = text }
  if (!res.ok) {
    const msg = (data && (data.message || data.mensaje || data.error)) || `Error ${res.status}`
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg))
  }
  return data as T
}
