import { useState } from 'react'
import { createDependencies } from './dependencies'
import { DependenciesProvider, SessionProvider, useSession } from './providers'
import type { View } from './navigation'
import AdminLayout from '../presentation/layout/AdminLayout'
import LoginPage from '../presentation/pages/LoginPage'
import DashboardPage from '../presentation/pages/DashboardPage'
import MapPage from '../presentation/pages/MapPage'
import CuentasPage from '../presentation/pages/CuentasPage'
import RutasPage from '../presentation/pages/RutasPage'
import UnidadesPage from '../presentation/pages/UnidadesPage'
import PortalConductorPage from '../presentation/pages/PortalConductorPage'

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

function AppContent() {
  const { sesion } = useSession()
  const [view, setView] = useState<View>('inicio')

  if (!sesion) return <LoginPage />

  return (
    <AdminLayout view={view} onNavigate={setView}>
      <ViewRouter view={view} onNavigate={setView} />
    </AdminLayout>
  )
}

function ViewRouter({
  view,
  onNavigate,
}: {
  view: View
  onNavigate: (view: View) => void
}) {
  switch (view) {
    case 'inicio':
      return <DashboardPage onNavigate={onNavigate} />
    case 'mapa':
      return <MapPage />
    case 'cuentas':
      return <CuentasPage />
    case 'rutas':
      return <RutasPage />
    case 'unidades':
      return <UnidadesPage />
    case 'portal':
      return <PortalConductorPage />
    default:
      return null
  }
}
