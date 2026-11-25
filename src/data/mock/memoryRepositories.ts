// ============================================================
// Implementaciones "en memoria" de los puertos del dominio.
// Sustituyen a los repositorios HTTP: la interfaz funciona
// completa sin backend, con los datos guardados en localStorage.
// ============================================================

import { AppError } from '../../domain/errors'
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
import { getDb, guardarDb, type MockDb } from './db'

export interface SolicitudesRepoLocal extends SolicitudesRepository {
  crearCambioRuta(datos: {
    usuarioId?: string
    lineaSolicitadaId?: number
    subrutaSolicitadaId?: number
  }): Promise<void>
}

const PIN_POR_DEFECTO = '1234'

function clonar<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function codigoDeLinea(linea: Linea): string | null {
  const match = `${linea.nombre} ${linea.corredor ?? ''}`.match(/\bC\d+\b/i)
  return match ? match[0].toUpperCase() : null
}

function buscarLineaPorRuta(db: MockDb, ruta?: string): Linea | undefined {
  if (!ruta) return undefined
  const texto = ruta.trim().toLowerCase()
  if (!texto) return undefined
  const porNombre = db.lineas.find((linea) => linea.nombre.toLowerCase() === texto)
  if (porNombre) return porNombre
  const codigo = texto.match(/\bC\d+\b/i)?.[0].toUpperCase()
  if (codigo) return db.lineas.find((linea) => codigoDeLinea(linea) === codigo)
  return db.lineas.find((linea) => linea.nombre.toLowerCase().includes(texto))
}

function nombreLinea(db: MockDb, lineaId?: number): string | undefined {
  if (lineaId == null) return undefined
  return db.lineas.find((linea) => linea.id === lineaId)?.nombre
}

function crearUsuario(
  db: MockDb,
  datos: {
    nombre: string
    dni: string
    telefono?: string
    email?: string
    rol: string
    lineaId?: number
  },
): Usuario {
  const usuario: Usuario = {
    id: `u-${db.secuencias.usuario++}`,
    nombre: datos.nombre,
    dni: datos.dni,
    telefono: datos.telefono,
    email: datos.email,
    rol: datos.rol,
    lineaId: datos.lineaId,
    lineaNombre: nombreLinea(db, datos.lineaId),
    isOnline: false,
  }
  db.usuarios.push(usuario)
  return usuario
}

// ------------------------------------------------------------
// Autenticación: valida contra las credenciales locales.
// Registrarse deja la cuenta PENDIENTE en Solicitudes.
// ------------------------------------------------------------
export function createMemoryAuthRepository(): AuthRepository {
  return {
    async iniciarSesion({ dni, pin }: Credenciales): Promise<Sesion> {
      const db = getDb()
      const usuarioDni = dni.trim()
      const clave = pin.trim()

      const credencial = db.credenciales.find((item) => item.dni === usuarioDni)
      if (!credencial || credencial.pin !== clave) {
        throw new AppError('DNI o PIN incorrectos. Prueba con 12345678 / 1234.')
      }

      const usuario = db.usuarios.find((item) => item.id === credencial.usuarioId)
      if (!usuario) throw new AppError('La cuenta ya no existe.')

      if (usuario.rol === 'CHOFER') {
        throw new AppError('Esta cuenta es de chofer: ingresa desde la app móvil, no desde el panel.')
      }

      const pendiente = db.pendientes.some((item) => item.dni === usuarioDni)
      if (pendiente) throw new AppError('Tu cuenta aún espera aprobación en Solicitudes.')

      return { usuario: clonar(usuario), token: 'demo-local' }
    },

    async registrar(datos: NuevoUsuario): Promise<void> {
      const db = getDb()
      const dni = datos.dni.trim()

      const existe =
        db.usuarios.some((usuario) => usuario.dni === dni) ||
        db.pendientes.some((item) => item.dni === dni) ||
        db.solicitudes.some((solicitud) => solicitud.dni === dni && solicitud.estado === 'PENDIENTE')
      if (existe) throw new AppError('Ya existe una cuenta o solicitud con ese DNI.')

      const linea = db.lineas.find((item) => item.id === datos.lineaId)

      db.pendientes.push({ dni, pin: datos.pin.trim(), datos: clonar(datos) })
      db.solicitudes.push({
        id: db.secuencias.solicitud++,
        dni,
        nombreCompleto: datos.nombre,
        telefono: datos.telefono,
        rutaTrabajo: linea?.nombre ?? 'Sin ruta',
        tipo: 'JEFE_RUTA',
        estado: 'PENDIENTE',
        creadoEn: new Date().toISOString(),
      })
      guardarDb()
    },
  }
}

// ------------------------------------------------------------
// Usuarios / cuentas
// ------------------------------------------------------------
export function createMemoryUsuariosRepository(): UsuariosRepository {
  return {
    async listar(): Promise<Usuario[]> {
      return clonar(getDb().usuarios)
    },

    async actualizarRol(id: string, rol: string): Promise<void> {
      const db = getDb()
      const usuario = db.usuarios.find((item) => item.id === id)
      if (!usuario) throw new AppError('La cuenta no existe.')
      usuario.rol = rol
      guardarDb()
    },

    async actualizarSubruta(id: string, subrutaId: number): Promise<Usuario> {
      const db = getDb()
      const usuario = db.usuarios.find((item) => item.id === id)
      if (!usuario) throw new AppError('La cuenta no existe.')
      usuario.subrutaId = String(subrutaId)
      usuario.subrutaDbId = String(subrutaId)
      guardarDb()
      return clonar(usuario)
    },

    async eliminar(id: string): Promise<void> {
      const db = getDb()
      const usuario = db.usuarios.find((item) => item.id === id)
      if (!usuario) throw new AppError('La cuenta no existe.')

      db.usuarios = db.usuarios.filter((item) => item.id !== id)
      db.credenciales = db.credenciales.filter((item) => item.usuarioId !== id)
      db.pendientes = db.pendientes.filter((item) => item.dni !== usuario.dni)
      guardarDb()
    },
  }
}

// ------------------------------------------------------------
// Líneas / rutas
// ------------------------------------------------------------
export function createMemoryLineasRepository(): LineasRepository {
  return {
    async listar(): Promise<Linea[]> {
      return clonar([...getDb().lineas].sort((a, b) => a.id - b.id))
    },

    async obtener(id: number): Promise<Linea> {
      const linea = getDb().lineas.find((item) => item.id === id)
      if (!linea) throw new AppError('La ruta no existe.')
      return clonar(linea)
    },

    async crear(datos: DatosLinea): Promise<Linea> {
      const db = getDb()
      const linea: Linea = {
        id: db.secuencias.linea++,
        nombre: datos.nombre,
        origen: datos.origen,
        destino: datos.destino,
        corredor: datos.corredor,
        colorHex: datos.colorHex || '#7B82A0',
        paraderos: [],
      }
      db.lineas.push(linea)
      guardarDb()
      return clonar(linea)
    },

    async actualizar(id: number, datos: DatosLinea): Promise<Linea> {
      const db = getDb()
      const linea = db.lineas.find((item) => item.id === id)
      if (!linea) throw new AppError('La ruta no existe.')

      linea.nombre = datos.nombre ?? linea.nombre
      linea.origen = datos.origen ?? linea.origen
      linea.destino = datos.destino ?? linea.destino
      linea.corredor = datos.corredor ?? linea.corredor
      linea.colorHex = datos.colorHex ?? linea.colorHex

      for (const unidad of db.unidades) {
        if (unidad.lineaId === id) unidad.lineaNombre = linea.nombre
      }
      guardarDb()
      return clonar(linea)
    },

    async eliminar(id: number): Promise<string | null> {
      const db = getDb()
      db.lineas = db.lineas.filter((item) => item.id !== id)
      db.unidades = db.unidades.filter((item) => item.lineaId !== id)
      guardarDb()
      return null
    },

    async puntosControl(lineaId: number): Promise<PuntoControl[]> {
      const linea = getDb().lineas.find((item) => item.id === lineaId)
      const puntos = linea?.paraderos ?? []
      return clonar([...puntos].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0)))
    },
  }
}

// ------------------------------------------------------------
// Unidades / combis
// ------------------------------------------------------------
export function createMemoryUnidadesRepository(): UnidadesRepository {
  return {
    async listar(): Promise<Unidad[]> {
      return clonar(getDb().unidades)
    },

    async listarPorLinea(lineaId: number): Promise<Unidad[]> {
      return clonar(getDb().unidades.filter((unidad) => unidad.lineaId === lineaId))
    },

    async crear(datos: DatosUnidad): Promise<Unidad> {
      const db = getDb()
      const unidad: Unidad = {
        id: db.secuencias.unidad++,
        numeroPadron: datos.numeroPadron,
        placa: datos.placa,
        lineaId: datos.lineaId,
        lineaNombre: nombreLinea(db, datos.lineaId),
        estado: datos.estado ?? 'OPERATIVA',
        posicionActual: null,
      }
      db.unidades.push(unidad)
      guardarDb()
      return clonar(unidad)
    },

    async actualizar(id: number, datos: DatosUnidad): Promise<Unidad> {
      const db = getDb()
      const unidad = db.unidades.find((item) => item.id === id)
      if (!unidad) throw new AppError('La unidad no existe.')

      unidad.numeroPadron = datos.numeroPadron ?? unidad.numeroPadron
      unidad.placa = datos.placa ?? unidad.placa
      unidad.lineaId = datos.lineaId ?? unidad.lineaId
      unidad.lineaNombre = nombreLinea(db, unidad.lineaId)
      unidad.estado = datos.estado ?? unidad.estado
      guardarDb()
      return clonar(unidad)
    },

    async eliminar(id: number): Promise<string | null> {
      const db = getDb()
      db.unidades = db.unidades.filter((item) => item.id !== id)
      guardarDb()
      return null
    },
  }
}

// ------------------------------------------------------------
// Solicitudes: aprobar activa la cuenta pendiente.
// ------------------------------------------------------------
export function createMemorySolicitudesRepository(): SolicitudesRepoLocal {
  function buscarSolicitud(db: MockDb, id: number | string): SolicitudRegistro {
    const solicitud = db.solicitudes.find((item) => String(item.id) === String(id))
    if (!solicitud) throw new AppError('La solicitud no existe.')
    return solicitud
  }

  return {
    async listar(rol?: string, subrutaId?: number): Promise<SolicitudRegistro[]> {
      // El backend aplica estos filtros; el mock los respeta para las pruebas.
      void rol
      void subrutaId
      return clonar(getDb().solicitudes)
    },

    async aprobar(id: number | string, usuarioAsignado?: string): Promise<SolicitudRegistro> {
      const db = getDb()
      const solicitud = buscarSolicitud(db, id)
      const linea = buscarLineaPorRuta(db, solicitud.rutaTrabajo)

      solicitud.estado = 'APROBADA'
      solicitud.usuarioAsignado = usuarioAsignado?.trim() || solicitud.dni
      solicitud.actualizadoEn = new Date().toISOString()

      const pendiente = db.pendientes.find((item) => item.dni === solicitud.dni)
      if (pendiente) {
        const usuario = crearUsuario(db, {
          nombre: pendiente.datos.nombre,
          dni: pendiente.datos.dni,
          telefono: pendiente.datos.telefono,
          email: pendiente.datos.email,
          rol: pendiente.datos.rol || 'JEFE_RUTA',
          lineaId: pendiente.datos.lineaId ?? linea?.id,
        })
        db.credenciales.push({ dni: pendiente.dni, pin: pendiente.pin, usuarioId: usuario.id })
        db.pendientes = db.pendientes.filter((item) => item.dni !== pendiente.dni)
      } else {
        const existente = db.usuarios.find((item) => item.dni === solicitud.dni)
        if (existente) {
          // Solicitud de cambio de ruta: solo se mueve la línea del usuario.
          existente.lineaId = linea?.id ?? existente.lineaId
          existente.lineaNombre = nombreLinea(db, existente.lineaId)
        } else {
          // Alta desde la app: chofer o jefe de ruta según el tipo de solicitud.
          const usuario = crearUsuario(db, {
            nombre: solicitud.nombreCompleto || solicitud.dni,
            dni: solicitud.dni,
            telefono: solicitud.telefono,
            rol: solicitud.tipo === 'CHOFER' ? 'CHOFER' : 'JEFE_RUTA',
            lineaId: linea?.id,
          })
          db.credenciales.push({
            dni: solicitud.dni,
            pin: PIN_POR_DEFECTO,
            usuarioId: usuario.id,
          })
        }
      }

      guardarDb()
      return clonar(solicitud)
    },

    async rechazar(id: number | string): Promise<SolicitudRegistro> {
      const db = getDb()
      const solicitud = buscarSolicitud(db, id)

      solicitud.estado = 'RECHAZADA'
      solicitud.actualizadoEn = new Date().toISOString()
      db.pendientes = db.pendientes.filter((item) => item.dni !== solicitud.dni)
      guardarDb()
      return clonar(solicitud)
    },

    async crearCambioRuta(datos): Promise<void> {
      const db = getDb()
      const usuario = db.usuarios.find((item) => item.id === datos.usuarioId)
      if (!usuario) throw new AppError('No se encontró la cuenta que solicita el cambio.')
      if (datos.lineaSolicitadaId == null) throw new AppError('Selecciona una ruta.')

      const linea = db.lineas.find((item) => item.id === datos.lineaSolicitadaId)
      if (!linea) throw new AppError('La ruta solicitada no existe.')

      db.solicitudes.push({
        id: db.secuencias.solicitud++,
        dni: usuario.dni,
        nombreCompleto: usuario.nombre,
        telefono: usuario.telefono,
        rutaTrabajo: linea.nombre,
        tipo: 'CAMBIO_RUTA',
        estado: 'PENDIENTE',
        creadoEn: new Date().toISOString(),
      })
      guardarDb()
    },
  }
}

// ------------------------------------------------------------
// Estado general (reemplaza el ping al backend)
// ------------------------------------------------------------
export function createMemoryEstadoRepository(): EstadoRepository {
  return {
    async consultar(): Promise<unknown> {
      const db = getDb()
      return {
        modo: 'datos locales',
        ok: true,
        rutas: db.lineas.length,
        unidades: db.unidades.length,
        cuentas: db.usuarios.length,
        solicitudesPendientes: db.solicitudes.filter((item) => item.estado === 'PENDIENTE').length,
      }
    },
  }
}
