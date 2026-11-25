import { useCallback, useMemo, useState } from 'react'
import { createDependencies } from './dependencies'
import { DependenciesProvider, SessionProvider, useSession } from './providers'
import type { View } from './navigation'
import AdminLayout from '../presentation/layout/AdminLayout'
import LoginPage from '../presentation/pages/LoginPage'
import DashboardPage from '../presentation/pages/DashboardPage'
import JefeDashboardPage from '../presentation/pages/JefeDashboardPage'
import MapPage from '../presentation/pages/MapPage'
import SolicitudesPage from '../presentation/pages/SolicitudesPage'
import CuentasPage from '../presentation/pages/CuentasPage'
import RutasPage from '../presentation/pages/RutasPage'
import UnidadesPage from '../presentation/pages/UnidadesPage'
import MisChoferesPage from '../presentation/pages/MisChoferesPage'
import CombisPage from '../presentation/pages/CombisPage'
import AjustesPage from '../presentation/pages/AjustesPage'

// Composition root: se crea una sola vez por carga de la app.
const dependencies = createDependencies()

export default function App() {
  return (
    <DependenciesProvider dependencies={dependencies}>
      <SessionProvider>
        <AppContent />
      </SessionProvider>
    </DependenciesProvider>
  )
}

function allowedViewsFor(rol: string): View[] {
  if (rol === 'JEFE_RUTA') {
    return ['inicio', 'solicitudes', 'mis-choferes', 'combis', 'mapa', 'ajustes']
  }
  // ADMIN (y fallback global)
  return ['inicio', 'solicitudes', 'mapa', 'cuentas', 'rutas', 'unidades', 'ajustes']
}

function AppContent() {
  const { sesion } = useSession()
  const rol = sesion?.usuario.rol ?? 'ADMIN'
  const allowed = useMemo(() => allowedViewsFor(rol), [rol])

  // La vista inicial puede compartirse con ?v=mapa, ?v=cuentas, etc.
  const [view, setView] = useState<View>(() => {
    const parametro = new URLSearchParams(window.location.search).get('v') as View | null
    return parametro && allowed.includes(parametro) ? parametro : 'inicio'
  })

  // La vista válida se deriva del rol: nunca se muestra una pantalla no
  // permitida, sin necesidad de sincronizar estado en un efecto.
  const vista = allowed.includes(view) ? view : 'inicio'
  const navegar = useCallback(
    (next: View) => {
      const destino = allowed.includes(next) ? next : 'inicio'
      setView(destino)
      const url = new URL(window.location.href)
      url.searchParams.set('v', destino)
      window.history.replaceState(null, '', url)
    },
    [allowed],
  )

  if (!sesion) return <LoginPage />

  return (
    <AdminLayout view={vista} onNavigate={navegar}>
      <ViewRouter view={vista} onNavigate={navegar} rol={rol} />
    </AdminLayout>
  )
}

function ViewRouter({
  view,
  onNavigate,
  rol,
}: {
  view: View
  onNavigate: (view: View) => void
  rol: string
}) {
  const isJefe = rol === 'JEFE_RUTA'

  switch (view) {
    case 'inicio':
      return isJefe ? <JefeDashboardPage onNavigate={onNavigate} /> : <DashboardPage onNavigate={onNavigate} />
    case 'mapa':
      return <MapPage />
    case 'solicitudes':
      return <SolicitudesPage />
    // Estas vistas no están en allowedViewsFor('JEFE_RUTA'): solo admin.
    case 'cuentas':
      return <CuentasPage />
    case 'rutas':
      return <RutasPage />
    case 'unidades':
      return <UnidadesPage />
    case 'mis-choferes':
      return <MisChoferesPage />
    case 'combis':
      return <CombisPage />
    case 'ajustes':
      return <AjustesPage />
    default:
      return isJefe ? <JefeDashboardPage onNavigate={onNavigate} /> : <DashboardPage onNavigate={onNavigate} />
  }
}
