// ============================================================
// Aplicación: hook genérico de consulta asíncrona.
// Evita duplicar loading/error/data en cada pantalla.
// ============================================================

import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react'
import { toErrorMessage } from '../domain/errors'

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export interface AsyncQuery<T> extends AsyncState<T> {
  reload: () => void
}

export function useAsync<T>(loader: () => Promise<T>, deps: DependencyList = []): AsyncQuery<T> {
  const loaderRef = useRef(loader)
  loaderRef.current = loader

  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: true,
    error: null,
  })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelled = false
    setState((previous) => ({ ...previous, loading: true, error: null }))

    loaderRef
      .current()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: null })
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState((previous) => ({
            ...previous,
            loading: false,
            error: toErrorMessage(error),
          }))
        }
      })

    return () => {
      cancelled = true
    }
    // deps + version controlan cuándo se vuelve a ejecutar el loader.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version])

  const reload = useCallback(() => setVersion((current) => current + 1), [])

  return { ...state, reload }
}
