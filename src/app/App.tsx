import { useEffect, useMemo, useState } from 'react'
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
  return ['inicio', 'solicitudes', 'mapa', 'cuentas', 'rutas', 'unidades']
}

function AppContent() {
  const { sesion } = useSession()
  const [view, setView] = useState<View>('inicio')

  const rol = sesion?.usuario.rol ?? 'ADMIN'
  const allowed = useMemo(() => allowedViewsFor(rol), [rol])

  useEffect(() => {
    if (!allowed.includes(view)) setView('inicio')
  }, [allowed, view])

  if (!sesion) return <LoginPage />

  return (
    <AdminLayout view={view} onNavigate={setView}>
      <ViewRouter view={view} onNavigate={setView} rol={rol} />
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
      return isJefe ? <JefeDashboardPage /> : <DashboardPage onNavigate={onNavigate} />
    case 'mapa':
      return <MapPage />
    case 'solicitudes':
      return <SolicitudesPage />
    case 'cuentas':
      return isJefe ? <JefeDashboardPage /> : <CuentasPage />
    case 'rutas':
      return isJefe ? <JefeDashboardPage /> : <RutasPage />
    case 'unidades':
      return isJefe ? <JefeDashboardPage /> : <UnidadesPage />
    case 'mis-choferes':
      return <MisChoferesPage />
    case 'combis':
      return <CombisPage />
    case 'ajustes':
      return <AjustesPage />
    default:
      return isJefe ? <JefeDashboardPage /> : <DashboardPage onNavigate={onNavigate} />
  }
}
