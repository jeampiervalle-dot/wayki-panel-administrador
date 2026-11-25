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
  UnidadesRepository,
  UsuariosRepository,
  TurnoActivo,
  TurnosRepository,
} from '../../domain/ports'
import type { SolicitudesRepoLocal } from '../../data/mock/memoryRepositories'
import { assertSuccess, toLinea, toList, toPuntoControl, toSesion, toSolicitudRegistro, toUnidad, toUsuario } from '../mappers'
import { config } from '../../config'
import { AppError } from '../../domain/errors'
import { subrutaStore } from '../subrutaStore'
import { request, setAuthToken } from './client'

const RUTAS_BASE = (config.rutasApiUrl || 'http://localhost:8080/api').replace(/\/+$/, '')

/** El backend guarda un id numérico; los ids de SmartBus se omiten. */
function idSubrutaNumerico(datos: DatosUnidad): number | undefined {
  const valor = datos.subrutaDbId ?? datos.subrutaId
  if (valor == null || !/^\d+$/.test(String(valor))) return undefined
  const numero = Number(valor)
  return Number.isFinite(numero) && numero > 0 ? numero : undefined
}

function datosUnidadRequest(datos: DatosUnidad): Record<string, unknown> {
  return {
    numeroPadron: datos.numeroPadron,
    placa: datos.placa,
    lineaId: datos.lineaId,
    estado: datos.estado,
    // El backend persiste el id numérico y la app móvil necesita el código
    // del catálogo para seleccionar la ruta.
    subrutaId: idSubrutaNumerico(datos),
    subrutaCodigo: datos.subrutaCodigo,
    nombreSubruta: datos.nombreSubruta,
  }
}

/** El backend Django no devuelve la subruta: se recupera del registro local. */
function conSubrutaLocal(unidades: Unidad[]): Unidad[] {
  return unidades.map((unidad) => {
    if (unidad.subrutaId && unidad.nombreSubruta) return unidad
    const guardada = subrutaStore.leerUnidad(unidad.id)
    if (!guardada) return unidad
    return {
      ...unidad,
      subrutaId: unidad.subrutaId ?? guardada.subrutaDbId ?? guardada.subrutaId,
      nombreSubruta: unidad.nombreSubruta ?? guardada.nombreSubruta,
    }
  })
}

/** Solo se degrada al backend secundario ante fallos de red o ruta ausente. */
function puedeUsarRespaldo(error: unknown): boolean {
  if (!(error instanceof AppError)) return true
  return error.status == null || error.status === 404 || error.status >= 500
}

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
          // El backend espera el id numérico de gowayki_db; si solo viene el
          // routeId SmartBus (no numérico) se omite para no romper el registro.
          subrutaId: /^\d+$/.test(String(datos.subrutaDbId ?? datos.subrutaId ?? ''))
            ? Number(datos.subrutaDbId ?? datos.subrutaId)
            : undefined,
          nombreSubruta: datos.nombreSubruta,
          codigoLinea: datos.codigoLinea,
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
    async actualizarSubruta(id: string, subrutaId: number): Promise<Usuario> {
      const data = await request<unknown>(`/usuarios/${id}/subruta`, {
        method: 'PATCH',
        body: JSON.stringify({ subrutaId }),
      })
      return toUsuario(data)
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
    async eliminar(id: number): Promise<string | null> {
      const data = await request<{ detail?: string }>(`/lineas/${id}`, { method: 'DELETE' })
      return data?.detail ?? null
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
      try {
        // Spring lee gowayki_db y devuelve subrutaId/subrutaNombre reales.
        const data = await request<unknown>('/unidades', undefined, RUTAS_BASE)
        return conSubrutaLocal(toList(data, toUnidad))
      } catch (error) {
        if (!puedeUsarRespaldo(error)) throw error
        const data = await request<unknown>('/unidades')
        return conSubrutaLocal(toList(data, toUnidad))
      }
    },
    async listarPorLinea(lineaId: number): Promise<Unidad[]> {
      try {
        const data = await request<unknown>(`/lineas/${lineaId}/unidades`, undefined, RUTAS_BASE)
        return conSubrutaLocal(toList(data, toUnidad))
      } catch (error) {
        if (!puedeUsarRespaldo(error)) throw error
        const data = await request<unknown>(`/lineas/${lineaId}/unidades`)
        return conSubrutaLocal(toList(data, toUnidad))
      }
    },
    async crear(datos: DatosUnidad): Promise<Unidad> {
      const data = await request<unknown>('/unidades', {
        method: 'POST',
        body: JSON.stringify(datosUnidadRequest(datos)),
      })
      return toUnidad(data)
    },
    async actualizar(id: number, datos: DatosUnidad): Promise<Unidad> {
      const data = await request<unknown>(`/unidades/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(datosUnidadRequest(datos)),
      })
      return toUnidad(data)
    },
    async eliminar(id: number): Promise<string | null> {
      const data = await request<{ detail?: string }>(`/unidades/${id}`, { method: 'DELETE' })
      return data?.detail ?? null
    },
  }
}

export function createHttpTurnosRepository(): TurnosRepository {
  return {
    async listarActivos(): Promise<TurnoActivo[]> {
      const data = await request<unknown>('/turnos/activos', undefined, RUTAS_BASE)
      return toList(data, (raw) => {
        const record = raw as Record<string, unknown>
        return {
          id: String(record.id ?? ''),
          unidadId: typeof record.unidadId === 'number' ? record.unidadId : undefined,
          choferId: typeof record.choferId === 'string' ? record.choferId : undefined,
          choferNombre: typeof record.choferNombre === 'string' ? record.choferNombre : undefined,
          subrutaId: typeof record.subrutaId === 'number' ? record.subrutaId : undefined,
          subrutaNombre: typeof record.subrutaNombre === 'string' ? record.subrutaNombre : undefined,
          estado: typeof record.estado === 'string' ? record.estado : undefined,
        }
      })
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
    async listar(rol?: string, subrutaId?: number): Promise<SolicitudRegistro[]> {
      const params = new URLSearchParams()
      // 'ADMIN' es un rol, no un TipoSolicitud: nunca se envía como filtro.
      if (rol && rol !== 'ADMIN') params.set('rol', rol)
      if (subrutaId != null) params.set('subrutaId', String(subrutaId))
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
    async crearCambioRuta(datos: {
      usuarioId?: string
      lineaSolicitadaId?: number
      subrutaSolicitadaId?: number
    }): Promise<void> {
      await request<unknown>('/solicitudes-registro', {
        method: 'POST',
        body: JSON.stringify({
          tipo: 'CAMBIO_RUTA',
          usuarioId: datos.usuarioId,
          lineaSolicitadaId: datos.lineaSolicitadaId,
          subrutaSolicitadaId: datos.subrutaSolicitadaId,
        }),
      })
    },
  }
}