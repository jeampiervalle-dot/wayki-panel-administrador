// ============================================================
// Datos locales de demostración (sin backend).
// Todo se guarda en localStorage: rutas, combis, cuentas y
// solicitudes sobreviven a recargas del navegador.
// ============================================================

import type {
  Linea,
  NuevoUsuario,
  PuntoControl,
  SolicitudRegistro,
  Unidad,
  Usuario,
} from '../../domain/models'

export interface CredencialLocal {
  dni: string
  pin: string
  usuarioId: string
}

export interface RegistroPendiente {
  dni: string
  pin: string
  datos: NuevoUsuario
}

export interface Secuencias {
  linea: number
  unidad: number
  solicitud: number
  usuario: number
}

export interface MockDb {
  lineas: Linea[]
  unidades: Unidad[]
  usuarios: Usuario[]
  solicitudes: SolicitudRegistro[]
  credenciales: CredencialLocal[]
  pendientes: RegistroPendiente[]
  secuencias: Secuencias
}

const STORAGE_KEY = 'react-interfaz-panel:db'

function paradero(
  id: number,
  nombre: string,
  lat: number,
  lng: number,
  orden: number,
): PuntoControl {
  return { id, nombre, lat, lng, orden, radioMetros: 80, toleranciaMinutos: 5 }
}

function paraderosC1(): PuntoControl[] {
  return [
    paradero(101, 'Terminal Terrestre', -16.4286, -71.509, 1),
    paradero(102, 'Av. Andrés Avelino Cáceres', -16.4192, -71.5246, 2),
    paradero(103, 'Puente Grau', -16.3955, -71.541, 3),
    paradero(104, 'Plaza de Armas', -16.3989, -71.5375, 4),
    paradero(105, 'Mercado San Camilo', -16.4021, -71.5392, 5),
    paradero(106, 'Estadio Melgar', -16.4046, -71.535, 6),
  ]
}

function paraderosC2(): PuntoControl[] {
  return [
    paradero(201, 'Salaverry', -16.4122, -71.5301, 1),
    paradero(202, 'Villa Los Milagros', -16.4482, -71.5152, 3),
    paradero(203, 'Av. Venezuela', -16.4221, -71.5452, 2),
  ]
}

function paraderosC3(): PuntoControl[] {
  return [
    paradero(301, 'Mujeres con Esperanza', -16.3912, -71.5503, 1),
    paradero(302, 'Las Convenciones', -16.4521, -71.5311, 3),
    paradero(303, 'Terminal Pesquero', -16.4312, -71.5223, 2),
  ]
}

function paraderosC4(): PuntoControl[] {
  return [
    paradero(401, 'Av. Salaverry', -16.4075, -71.5482, 1),
    paradero(402, 'El Mirador', -16.4351, -71.5613, 2),
    paradero(403, 'San Luis', -16.4462, -71.5502, 3),
  ]
}

function paraderosC5(): PuntoControl[] {
  return [
    paradero(501, 'Estadio Melgar', -16.4046, -71.535, 1),
    paradero(502, 'Atalaya', -16.3871, -71.5203, 2),
    paradero(503, 'San Jerónimo', -16.3691, -71.5614, 3),
  ]
}

function seedDb(): MockDb {
  const lineas: Linea[] = [
    {
      id: 1,
      nombre: 'Línea C1',
      origen: 'Terminal Terrestre',
      destino: 'Ciudad Blanca',
      corredor: 'C1',
      colorHex: '#E53935',
      paraderos: paraderosC1(),
    },
    {
      id: 2,
      nombre: 'Línea C2',
      origen: 'Salaverry',
      destino: 'Villa Los Milagros',
      corredor: 'C2',
      colorHex: '#1E88E5',
      paraderos: paraderosC2(),
    },
    {
      id: 3,
      nombre: 'Línea C3',
      origen: 'Mujeres con Esperanza',
      destino: 'Las Convenciones',
      corredor: 'C3',
      colorHex: '#43A047',
      paraderos: paraderosC3(),
    },
    {
      id: 4,
      nombre: 'Línea C4',
      origen: 'Av. Salaverry',
      destino: 'El Mirador',
      corredor: 'C4',
      colorHex: '#FB8C00',
      paraderos: paraderosC4(),
    },
    {
      id: 5,
      nombre: 'Línea C5',
      origen: 'Estadio Melgar',
      destino: 'San Jerónimo',
      corredor: 'C5',
      colorHex: '#8E24AA',
      paraderos: paraderosC5(),
    },
  ]

  const unidades: Unidad[] = [
    {
      id: 1,
      numeroPadron: 'P-001',
      placa: 'V1A-234',
      lineaId: 1,
      lineaNombre: 'Línea C1',
      estado: 'OPERATIVA',
      posicionActual: { lat: -16.4051, lng: -71.5352, ultimaActualizacion: '2026-11-14T12:00:00' },
    },
    {
      id: 2,
      numeroPadron: 'P-002',
      placa: 'V1B-567',
      lineaId: 1,
      lineaNombre: 'Línea C1',
      estado: 'OPERATIVA',
      posicionActual: { lat: -16.415, lng: -71.524, ultimaActualizacion: '2026-11-14T12:00:00' },
    },
    {
      id: 3,
      numeroPadron: 'P-003',
      placa: 'V2C-890',
      lineaId: 2,
      lineaNombre: 'Línea C2',
      estado: 'EN MANTENIMIENTO',
      posicionActual: null,
    },
    {
      id: 4,
      numeroPadron: 'P-004',
      placa: 'V3D-112',
      lineaId: 3,
      lineaNombre: 'Línea C3',
      estado: 'OPERATIVA',
      posicionActual: null,
    },
  ]

  const usuarios: Usuario[] = [
    {
      id: 'u-admin',
      nombre: 'Administrador general',
      dni: '12345678',
      telefono: '959111222',
      email: 'admin@wayki.demo',
      rol: 'ADMIN',
      isOnline: true,
    },
    {
      id: 'u-jefe',
      nombre: 'María Quispe',
      dni: '87654321',
      telefono: '959333444',
      email: 'maria.jefa@wayki.demo',
      rol: 'JEFE_RUTA',
      lineaId: 1,
      lineaNombre: 'Línea C1',
      isOnline: true,
    },
    {
      id: 'u-chofer-1',
      nombre: 'Luis Mamani',
      dni: '41111111',
      telefono: '959555666',
      email: 'luis.chofer@wayki.demo',
      rol: 'CHOFER',
      lineaId: 1,
      lineaNombre: 'Línea C1',
      isOnline: true,
    },
    {
      id: 'u-chofer-2',
      nombre: 'Rosa Huamán',
      dni: '42222222',
      telefono: '959777888',
      email: 'rosa.chofer@wayki.demo',
      rol: 'CHOFER',
      lineaId: 1,
      lineaNombre: 'Línea C1',
      isOnline: false,
    },
    {
      id: 'u-chofer-3',
      nombre: 'Pedro Ccallo',
      dni: '43333333',
      telefono: '959999000',
      rol: 'CHOFER',
      lineaId: 2,
      lineaNombre: 'Línea C2',
      isOnline: false,
    },
  ]

  const solicitudes: SolicitudRegistro[] = [
    {
      id: 1,
      dni: '73333333',
      nombreCompleto: 'Carlos Mamani',
      telefono: '958111333',
      placaNumero: 'V1X-999',
      rutaTrabajo: 'Línea C1',
      tipo: 'CHOFER',
      estado: 'PENDIENTE',
      creadoEn: '2026-11-12T09:30:00',
    },
    {
      id: 2,
      dni: '74444444',
      nombreCompleto: 'Ana Torres',
      telefono: '958222444',
      placaNumero: 'V1Y-111',
      rutaTrabajo: 'Línea C1',
      tipo: 'CHOFER',
      estado: 'PENDIENTE',
      creadoEn: '2026-11-13T15:10:00',
    },
    {
      id: 3,
      dni: '75555555',
      nombreCompleto: 'Miguel Salas',
      telefono: '958333555',
      rutaTrabajo: 'Línea C2',
      tipo: 'JEFE_RUTA',
      estado: 'PENDIENTE',
      creadoEn: '2026-11-13T18:40:00',
    },
    {
      id: 4,
      dni: '76666666',
      nombreCompleto: 'Jorge Apaza',
      telefono: '958444666',
      placaNumero: 'V2Z-222',
      rutaTrabajo: 'Línea C2',
      tipo: 'CHOFER',
      estado: 'PENDIENTE',
      creadoEn: '2026-11-14T08:05:00',
    },
  ]

  const credenciales: CredencialLocal[] = [
    { dni: '12345678', pin: '1234', usuarioId: 'u-admin' },
    { dni: '87654321', pin: '1234', usuarioId: 'u-jefe' },
    { dni: '41111111', pin: '1234', usuarioId: 'u-chofer-1' },
    { dni: '42222222', pin: '1234', usuarioId: 'u-chofer-2' },
    { dni: '43333333', pin: '1234', usuarioId: 'u-chofer-3' },
  ]

  // Registros hechos en la app móvil: el PIN lo crea el usuario allí y se
  // mantiene en espera hasta que el panel apruebe la solicitud.
  const pendientes: RegistroPendiente[] = [
    {
      dni: '73333333',
      pin: '4321',
      datos: {
        nombre: 'Carlos Mamani',
        dni: '73333333',
        telefono: '958111333',
        pin: '4321',
        rol: 'CHOFER',
        lineaId: 1,
      },
    },
    {
      dni: '74444444',
      pin: '1122',
      datos: {
        nombre: 'Ana Torres',
        dni: '74444444',
        telefono: '958222444',
        pin: '1122',
        rol: 'CHOFER',
        lineaId: 1,
      },
    },
    {
      dni: '75555555',
      pin: '1234',
      datos: {
        nombre: 'Miguel Salas',
        dni: '75555555',
        telefono: '958333555',
        pin: '1234',
        rol: 'JEFE_RUTA',
        lineaId: 2,
      },
    },
    {
      dni: '76666666',
      pin: '9999',
      datos: {
        nombre: 'Jorge Apaza',
        dni: '76666666',
        telefono: '958444666',
        pin: '9999',
        rol: 'CHOFER',
        lineaId: 2,
      },
    },
  ]

  return {
    lineas,
    unidades,
    usuarios,
    solicitudes,
    credenciales,
    pendientes,
    secuencias: {
      linea: lineas.length + 1,
      unidad: unidades.length + 1,
      solicitud: solicitudes.length + 1,
      usuario: usuarios.length + 1,
    },
  }
}

function esDbValida(value: unknown): value is MockDb {
  if (!value || typeof value !== 'object') return false
  const db = value as Partial<MockDb>
  return (
    Array.isArray(db.lineas) &&
    Array.isArray(db.unidades) &&
    Array.isArray(db.usuarios) &&
    Array.isArray(db.solicitudes) &&
    Array.isArray(db.credenciales) &&
    Array.isArray(db.pendientes) &&
    !!db.secuencias &&
    typeof db.secuencias === 'object'
  )
}

let db: MockDb = cargar()

function cargar(): MockDb {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedDb()
    const parsed: unknown = JSON.parse(raw)
    return esDbValida(parsed) ? parsed : seedDb()
  } catch {
    return seedDb()
  }
}

export function getDb(): MockDb {
  return db
}

export function guardarDb(): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
  } catch {
    // localStorage no disponible: se sigue usando la copia en memoria.
  }
}

export function reiniciarDb(): void {
  db = seedDb()
  guardarDb()
}
