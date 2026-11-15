import type { ReactNode } from 'react'
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  List,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/DashboardRounded'
import MapIcon from '@mui/icons-material/MapRounded'
import RouteIcon from '@mui/icons-material/AltRouteRounded'
import PeopleIcon from '@mui/icons-material/PeopleAltRounded'
import DirectionsBusIcon from '@mui/icons-material/DirectionsBusRounded'
import LogoutIcon from '@mui/icons-material/LogoutRounded'
import DeleteForeverIcon from '@mui/icons-material/DeleteForeverRounded'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettingsRounded'
import AssignmentIndIcon from '@mui/icons-material/AssignmentIndRounded'
import GroupsIcon from '@mui/icons-material/GroupsRounded'
import SettingsIcon from '@mui/icons-material/SettingsRounded'
import { config } from '../../config'
import { useDependencies, useSession } from '../../app/providers'
import type { View } from '../../app/navigation'

const DRAWER = 290

interface NavEntry {
  view: View
  icon: ReactNode
  label: string
  description: string
}

function navForRole(rol: string, lineaNombre?: string): NavEntry[] {
  if (rol === 'JEFE_RUTA') {
    const rutaLabel = lineaNombre ? `Mi ruta · ${lineaNombre}` : 'Mi ruta'
    return [
      { view: 'inicio', icon: <DashboardIcon />, label: 'Inicio', description: rutaLabel },
      { view: 'solicitudes', icon: <AssignmentIndIcon />, label: 'Solicitudes', description: 'Choferes de tu ruta' },
      { view: 'mis-choferes', icon: <GroupsIcon />, label: 'Mis choferes', description: 'Choferes en tu ruta' },
      { view: 'combis', icon: <DirectionsBusIcon />, label: 'Combis', description: 'Unidades y asignación' },
      { view: 'mapa', icon: <MapIcon />, label: 'Mapa', description: 'Ruta y puntos de control' },
      { view: 'ajustes', icon: <SettingsIcon />, label: 'Ajustes', description: 'Línea y cambio de ruta' },
    ]
  }

  // ADMIN (y fallback)
  return [
    { view: 'inicio', icon: <DashboardIcon />, label: 'Inicio', description: 'Resumen y estado' },
    { view: 'solicitudes', icon: <AssignmentIndIcon />, label: 'Solicitudes', description: 'Altas (p. ej. jefes de ruta)' },
    { view: 'mapa', icon: <MapIcon />, label: 'Mapa', description: 'Rutas y puntos de control' },
    { view: 'cuentas', icon: <PeopleIcon />, label: 'Cuentas', description: 'Usuarios: ver, editar, eliminar' },
    { view: 'rutas', icon: <RouteIcon />, label: 'Rutas / Líneas', description: 'Crear, actualizar, eliminar' },
    { view: 'unidades', icon: <DirectionsBusIcon />, label: 'Unidades', description: 'Vehículos y asignación' },
  ]
}

function NavButton({
  entry,
  selected,
  onSelect,
}: {
  entry: NavEntry
  selected: boolean
  onSelect: (view: View) => void
}) {
  return (
    <ListItemButton
      selected={selected}
      onClick={() => onSelect(entry.view)}
      sx={{ borderRadius: 4, mb: 0.5 }}
    >
      <ListItemAvatar>
        <Avatar
          sx={{
            bgcolor: selected ? 'primary.main' : 'rgba(124,107,196,0.14)',
            color: selected ? '#fff' : 'primary.main',
          }}
        >
          {entry.icon}
        </Avatar>
      </ListItemAvatar>
      <ListItemText primary={entry.label} secondary={entry.description} />
    </ListItemButton>
  )
}

export default function AdminLayout({
  view,
  onNavigate,
  children,
}: {
  view: View
  onNavigate: (view: View) => void
  children: ReactNode
}) {
  const { sesion, cerrarSesion } = useSession()
  const { usuarios } = useDependencies()
  const usuario = sesion?.usuario
  const nombre = usuario?.nombre || usuario?.dni || 'Usuario'
  const rol = usuario?.rol || 'ADMIN'
  const navItems = navForRole(rol, usuario?.lineaNombre)

  async function handleEliminarCuenta() {
    if (!usuario?.id) return
    const ok = window.confirm(
      '¿Eliminar tu cuenta definitivamente? Esta acción no se puede deshacer.',
    )
    if (!ok) return
    try {
      await usuarios.eliminar(usuario.id)
      cerrarSesion()
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'No se pudo eliminar la cuenta'
      window.alert(message)
    }
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: 'linear-gradient(90deg, #6F5CC6 0%, #8B7BC8 55%, #A996E2 100%)',
        }}
      >
        <Toolbar>
          <AdminPanelSettingsIcon sx={{ mr: 1.2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            {rol === 'JEFE_RUTA' ? 'Wayki Nest — Jefe de ruta' : 'Wayki Nest — Administración'}
          </Typography>
          <Chip
            label={rol}
            sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: '#fff', mr: 1 }}
          />
          <Chip
            avatar={<Avatar>{String(nombre).slice(0, 1)}</Avatar>}
            label={nombre}
            sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: '#fff' }}
          />
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: DRAWER,
          [`& .MuiDrawer-paper`]: {
            width: DRAWER,
            boxSizing: 'border-box',
            bgcolor: '#F1ECFA',
            p: 1,
          },
        }}
      >
        <Toolbar />
        <List sx={{ px: 1 }}>
          {navItems.map((entry) => (
            <NavButton
              key={entry.view}
              entry={entry}
              selected={view === entry.view}
              onSelect={onNavigate}
            />
          ))}
        </List>

        <Box sx={{ mt: 'auto', p: 1.5 }}>
          <Button
            fullWidth
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={cerrarSesion}
            sx={{ justifyContent: 'flex-start', borderRadius: 3 }}
          >
            Cerrar sesión
          </Button>
          <Button
            fullWidth
            color="error"
            startIcon={<DeleteForeverIcon />}
            onClick={handleEliminarCuenta}
            sx={{ justifyContent: 'flex-start', borderRadius: 3, mt: 0.5 }}
          >
            Eliminar mi cuenta
          </Button>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 1, px: 1 }}
          >
            Datos: {config.apiUrl} · Mapa:{' '}
            {config.mapboxToken ? 'Mapbox' : 'OSM'}
          </Typography>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          background: 'linear-gradient(180deg, #F6F3FC 0%, #FBF9FF 100%)',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  )
}
