// ============================================================
// Datos: persistencia local de la subruta elegida por el jefe
// de ruta y de la subruta asignada a cada combi.
//
// El backend Django todavía no tiene una columna `subruta` en
// usuario_linea / unidad, así que la selección se guarda aquí
// para que sobreviva al login y a los recargas de la página.
// ============================================================

export interface SubrutaSeleccion {
  /** Código de línea del catálogo (C2, C3, ...) o nombre de la línea. */
  codigoLinea?: string
  /** id de la línea real de gowayki_db (tabla `linea`). */
  lineaId: number
  nombreLinea: string
  /** routeId de SmartBus de la subruta elegida. */
  subrutaId: string
  /** Id numérico de la subruta en gowayki_db (el que devuelve /unidades). */
  subrutaDbId?: string
  nombreSubruta: string
}

export interface SubrutaUnidad {
  subrutaId: string
  subrutaDbId?: string
  nombreSubruta: string
}

const USUARIO_KEY = 'wayki_panel_subruta_usuario'
const UNIDAD_KEY = 'wayki_panel_subruta_unidades'

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

function leerJson<T>(storage: StorageLike, key: string, fallback: T): T {
  try {
    const raw = storage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function escribirJson(storage: StorageLike, key: string, valor: unknown): void {
  try {
    storage.setItem(key, JSON.stringify(valor))
  } catch {
    // Almacenamiento no disponible: la selección no se podrá recuperar.
  }
}

function claveDni(dni: string): string {
  return dni.trim().toLowerCase()
}

export function createSubrutaStore(storage: StorageLike = window.localStorage) {
  return {
    guardarUsuario(dni: string, seleccion: SubrutaSeleccion): void {
      const todos = leerJson<Record<string, SubrutaSeleccion>>(storage, USUARIO_KEY, {})
      todos[claveDni(dni)] = seleccion
      escribirJson(storage, USUARIO_KEY, todos)
    },

    leerUsuario(dni: string): SubrutaSeleccion | null {
      const todos = leerJson<Record<string, SubrutaSeleccion>>(storage, USUARIO_KEY, {})
      return todos[claveDni(dni)] ?? null
    },

    guardarUnidad(unidadId: number, subruta: SubrutaUnidad): void {
      const todos = leerJson<Record<string, SubrutaUnidad>>(storage, UNIDAD_KEY, {})
      todos[String(unidadId)] = subruta
      escribirJson(storage, UNIDAD_KEY, todos)
    },

    leerUnidad(unidadId: number): SubrutaUnidad | null {
      const todos = leerJson<Record<string, SubrutaUnidad>>(storage, UNIDAD_KEY, {})
      return todos[String(unidadId)] ?? null
    },
  }
}

export const subrutaStore = createSubrutaStore()
