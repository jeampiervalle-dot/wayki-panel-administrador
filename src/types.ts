export type RequestStatus = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'REVOCADA'
export interface RegistrationRequest {
  id: string
  dni: string
  fullName: string
  phone: string
  plateNumber: string
  workRoute: string
  status: RequestStatus
  createdAt: string
  reviewedAt?: string
  assignedUsername?: string
  notes?: string
}
export interface WorkRoute { id: string; name: string }
export interface Linea { id: number; nombre: string; origen?: string; destino?: string; corredor?: string; colorHex?: string }
export interface Unidad { id: number; numeroPadron?: string; placa?: string; lineaId?: number; estado?: string }
export interface PuntoControl { id?: number; nombre?: string; lat?: number; lng?: number; latitud?: number; longitud?: number; latitude?: number; longitude?: number; orden?: number; radioMetros?: number; radioToleranciaMetros?: number }
export interface Usuario { id: string; nombre: string; dni: string; telefono?: string; email?: string; rol?: string; isOnline?: boolean }
