// ============================================================
// Aplicación: hook genérico de consulta asíncrona.
// Evita duplicar loading/error/data en cada pantalla.
// El estado vive en un store externo para no actualizar el estado
// de React de forma síncrona desde dentro de un efecto.
// ============================================================

import {
  useCallback,
  useEffect,
  useState,
  useSyncExternalStore,
  type DependencyList,
} from 'react'
import { toErrorMessage } from '../domain/errors'

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export interface AsyncQuery<T> extends AsyncState<T> {
  reload: () => void
}

interface QueryStore<T> {
  suscribir: (listener: () => void) => () => void
  snapshot: () => AsyncState<T>
  actualizarLoader: (loader: () => Promise<T>) => void
  ejecutar: (limpiar: boolean) => void
}

function crearStore<T>(loaderInicial: () => Promise<T>): QueryStore<T> {
  let loader = loaderInicial
  let estado: AsyncState<T> = { data: null, loading: true, error: null }
  const oyentes = new Set<() => void>()
  let id = 0

  const notificar = () => {
    for (const oyente of oyentes) oyente()
  }

  return {
    suscribir(listener) {
      oyentes.add(listener)
      return () => {
        oyentes.delete(listener)
      }
    },
    snapshot: () => estado,
    actualizarLoader(next) {
      loader = next
    },
    ejecutar(limpiar) {
      const actual = ++id
      estado = { data: limpiar ? null : estado.data, loading: true, error: null }
      notificar()
      Promise.resolve()
        .then(loader)
        .then(
          (data) => {
            if (actual === id) {
              estado = { data, loading: false, error: null }
              notificar()
            }
          },
          (error: unknown) => {
            if (actual === id) {
              estado = { data: null, loading: false, error: toErrorMessage(error) }
              notificar()
            }
          },
        )
    },
  }
}

export function useAsync<T>(loader: () => Promise<T>, deps: DependencyList = []): AsyncQuery<T> {
  const [store] = useState(() => crearStore(loader))

  useEffect(() => {
    store.actualizarLoader(loader)
    store.ejecutar(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, store])

  const estado = useSyncExternalStore(store.suscribir, store.snapshot)
  const reload = useCallback(() => store.ejecutar(false), [store])

  return { ...estado, reload }
}
