import type {
  Credenciales,
  DatosLinea,
  DatosUnidad,
  Linea,
  NuevoUsuario,
  PuntoControl,
  Sesion,
  SolicitudRegistro,
  Unidad,
  Usuario,
} from '../../domain/models'
import type {
  AuthRepository,
  EstadoRepository,
  LineasRepository,
  SolicitudesRepository,
  UnidadesRepository,
  UsuariosRepository,
} from '../../domain/ports'
import type { SolicitudesRepoLocal } from '../../data/mock/memoryRepositories'
import { assertSuccess, toLinea, toList, toPuntoControl, toSesion, toSolicitudRegistro, toUnidad, toUsuario } from '../mappers'
import { request, setAuthToken } from './client'

export function createHttpAuthRepository(): AuthRepository {
  return {
    async iniciarSesion(credenciales: Credenciales): Promise<Sesion> {
      const data = await request<unknown>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ dni: credenciales.dni, pin: credenciales.pin }),
      })
      const sesion = toSesion(data)
      setAuthToken(sesion.token ?? null)
      return sesion
    },
    async registrar(datos: NuevoUsuario): Promise<void> {
      const data = await request<unknown>('/auth/registro', {
        method: 'POST',
        body: JSON.stringify({
          nombre: datos.nombre,
          dni: datos.dni,
          telefono: datos.telefono,
          email: datos.email,
          pin: datos.pin,
          lineaId: datos.lineaId,
          rol: datos.rol,
        }),
      })
      assertSuccess(data, 'No se pudo registrar.')
    },
  }
}

export function createHttpUsuariosRepository(): UsuariosRepository {
  return {
    async listar(): Promise<Usuario[]> {
      const data = await request<unknown>('/usuarios')
      return toList(data, toUsuario)
    },
    async actualizarRol(id: string, rol: string): Promise<void> {
      await request<unknown>(`/usuarios/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ rol }),
      })
    },
    async eliminar(id: string): Promise<void> {
      await request<unknown>(`/usuarios/${id}`, { method: 'DELETE' })
    },
  }
}

export function createHttpLineasRepository(): LineasRepository {
  return {
    async listar(): Promise<Linea[]> {
      const data = await request<unknown>('/lineas')
      return toList(data, toLinea)
    },
    async obtener(id: number): Promise<Linea> {
      const data = await request<unknown>(`/lineas/${id}`)
      return toLinea(data)
    },
    async crear(datos: DatosLinea): Promise<Linea> {
      const data = await request<unknown>('/lineas', {
        method: 'POST',
        body: JSON.stringify({
          nombre: datos.nombre,
          origen: datos.origen,
          destino: datos.destino,
          corredor: datos.corredor,
          colorHex: datos.colorHex,
        }),
      })
      return toLinea(data)
    },
    async actualizar(id: number, datos: DatosLinea): Promise<Linea> {
      const data = await request<unknown>(`/lineas/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          nombre: datos.nombre,
          origen: datos.origen,
          destino: datos.destino,
          corredor: datos.corredor,
          colorHex: datos.colorHex,
        }),
      })
      return toLinea(data)
    },
    async eliminar(id: number): Promise<void> {
      await request<unknown>(`/lineas/${id}`, { method: 'DELETE' })
    },
    async puntosControl(lineaId: number): Promise<PuntoControl[]> {
      const data = await request<unknown>(`/lineas/${lineaId}/puntos-control`)
      return toList(data, toPuntoControl)
    },
  }
}

export function createHttpUnidadesRepository(): UnidadesRepository {
  return {
    async listar(): Promise<Unidad[]> {
      const data = await request<unknown>('/unidades')
      return toList(data, toUnidad)
    },
    async listarPorLinea(lineaId: number): Promise<Unidad[]> {
      const data = await request<unknown>(`/lineas/${lineaId}/unidades`)
      return toList(data, toUnidad)
    },
    async crear(datos: DatosUnidad): Promise<Unidad> {
      const data = await request<unknown>('/unidades', {
        method: 'POST',
        body: JSON.stringify({
          numeroPadron: datos.numeroPadron,
          placa: datos.placa,
          lineaId: datos.lineaId,
          estado: datos.estado,
        }),
      })
      return toUnidad(data)
    },
    async actualizar(id: number, datos: DatosUnidad): Promise<Unidad> {
      const data = await request<unknown>(`/unidades/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          numeroPadron: datos.numeroPadron,
          placa: datos.placa,
          lineaId: datos.lineaId,
          estado: datos.estado,
        }),
      })
      return toUnidad(data)
    },
    async eliminar(id: number): Promise<void> {
      await request<unknown>(`/unidades/${id}`, { method: 'DELETE' })
    },
  }
}

export function createHttpEstadoRepository(): EstadoRepository {
  return {
    async consultar(): Promise<unknown> {
      return request<unknown>('/estado')
    },
  }
}

export function createHttpSolicitudesRepository(): SolicitudesRepoLocal {
  return {
    async listar(rol?: string, lineaId?: number): Promise<SolicitudRegistro[]> {
      const params = new URLSearchParams()
      if (rol) params.set('rol', rol)
      if (lineaId != null) params.set('lineaId', String(lineaId))
      const qs = params.toString() ? `?${params.toString()}` : ''
      const data = await request<unknown>(`/solicitudes-registro${qs}`)
      return toList(data, toSolicitudRegistro)
    },
    async aprobar(id: number | string, usuarioAsignado?: string): Promise<SolicitudRegistro> {
      const data = await request<unknown>(`/solicitudes-registro/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ estado: 'APROBADA', usuarioAsignado }),
      })
      return toSolicitudRegistro(data)
    },
    async rechazar(id: number | string): Promise<SolicitudRegistro> {
      const data = await request<unknown>(`/solicitudes-registro/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ estado: 'RECHAZADA' }),
      })
      return toSolicitudRegistro(data)
    },
    async crearCambioRuta(datos: { usuarioId?: string; lineaSolicitadaId?: number }): Promise<void> {
      await request<unknown>('/solicitudes-registro', {
        method: 'POST',
        body: JSON.stringify({
          tipo: 'CAMBIO_RUTA',
          usuarioId: datos.usuarioId,
          lineaSolicitadaId: datos.lineaSolicitadaId,
        }),
      })
    },
  }
}