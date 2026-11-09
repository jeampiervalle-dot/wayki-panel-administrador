import { api } from './client'
import type { Linea, PuntoControl, Unidad, Usuario } from '../types'

export const backend = {
  estado: () => api<any>('/estado'),
  lineas: () => api<Linea[]>('/lineas'),
  linea: (id: number | string) => api<Linea>(`/lineas/${id}`),
  puntosControl: (lineaId: number | string) => api<PuntoControl[]>(`/lineas/${lineaId}/puntos-control`),
  unidades: () => api<Unidad[]>('/unidades'),
  unidadesByLinea: (lineaId: number | string) => api<Unidad[]>(`/lineas/${lineaId}/unidades`),
  usuarios: () => api<Usuario[]>('/usuarios'),
  login: (dni: string, pin: string) => api<any>('/auth/login', { method: 'POST', body: JSON.stringify({ dni, pin }) }),
  registro: (body: { nombre: string; dni: string; telefono: string; email?: string; pin: string; rol?: string }) =>
    api<any>('/auth/registro', { method: 'POST', body: JSON.stringify(body) }),
  // Endpoints que pueden no existir aún en el backend: la UI los usa cuando estén disponibles.
  updateUsuario: (id: string, body: any) => api<any>(`/usuarios/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteUsuario: (id: string) => api<any>(`/usuarios/${id}`, { method: 'DELETE' }),
  createLinea: (body: any) => api<any>('/lineas', { method: 'POST', body: JSON.stringify(body) }),
  updateLinea: (id: number | string, body: any) => api<any>(`/lineas/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteLinea: (id: number | string) => api<any>(`/lineas/${id}`, { method: 'DELETE' }),
  createUnidad: (body: any) => api<any>('/unidades', { method: 'POST', body: JSON.stringify(body) }),
  updateUnidad: (id: number | string, body: any) => api<any>(`/unidades/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteUnidad: (id: number | string) => api<any>(`/unidades/${id}`, { method: 'DELETE' }),
}
