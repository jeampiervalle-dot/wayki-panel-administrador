import { createContext, useContext, type ReactNode } from 'react'
import { useAuth, type AuthState } from '../application/auth/useAuth'
import type { Dependencies } from './dependencies'

const DependenciesContext = createContext<Dependencies | null>(null)
const SessionContext = createContext<AuthState | null>(null)

export function useDependencies(): Dependencies {
  const dependencies = useContext(DependenciesContext)
  if (!dependencies) {
    throw new Error('useDependencies debe usarse dentro de <DependenciesProvider>')
  }
  return dependencies
}

export function DependenciesProvider({
  dependencies,
  children,
}: {
  dependencies: Dependencies
  children: ReactNode
}) {
  return (
    <DependenciesContext.Provider value={dependencies}>
      {children}
    </DependenciesContext.Provider>
  )
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const { auth, sessionStore } = useDependencies()
  const session = useAuth(auth, sessionStore)

  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>
}

export function useSession(): AuthState {
  const session = useContext(SessionContext)
  if (!session) {
    throw new Error('useSession debe usarse dentro de <SessionProvider>')
  }
  return session
}
