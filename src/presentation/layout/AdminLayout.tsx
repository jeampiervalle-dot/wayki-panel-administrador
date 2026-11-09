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
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettingsRounded'
import PersonAddIcon from '@mui/icons-material/PersonAddAlt1Rounded'
import { config } from '../../config'
import { useSession } from '../../app/providers'
import type { View } from '../../app/navigation'

const DRAWER = 290

interface NavEntry {
  view: View
  icon: ReactNode
  label: string
  description: string
}

const MAIN_NAV: NavEntry[] = [
  { view: 'inicio', icon: <DashboardIcon />, label: 'Inicio', description: 'Resumen y estado' },
  { view: 'mapa', icon: <MapIcon />, label: 'Mapa', description: 'Rutas y puntos de control' },
  { view: 'cuentas', icon: <PeopleIcon />, label: 'Cuentas', description: 'Usuarios: ver, editar, eliminar' },
  { view: 'rutas', icon: <RouteIcon />, label: 'Rutas / Líneas', description: 'Crear, actualizar, eliminar' },
  { view: 'unidades', icon: <DirectionsBusIcon />, label: 'Unidades', description: 'Vehículos y asignación' },
]

const PORTAL_NAV: NavEntry[] = [
  { view: 'portal', icon: <PersonAddIcon />, label: 'Portal conductor', description: 'Acceso y selección de ruta' },
]

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
            bgcolor: selected ? 'primary.main' : 'rgba(47,107,79,0.12)',
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
  const usuario = sesion?.usuario
  const nombre = usuario?.nombre || usuario?.dni || 'Administrador'
  const rol = usuario?.rol || 'ADMIN'

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: 'linear-gradient(90deg, #2F6B4F 0%, #3E7F60 60%, #4B8E6D 100%)',
        }}
      >
        <Toolbar>
          <AdminPanelSettingsIcon sx={{ mr: 1.2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            Wayki Nest — Administración
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
            bgcolor: '#F1F8F2',
            p: 1,
          },
        }}
      >
        <Toolbar />
        <List sx={{ px: 1 }}>
          {MAIN_NAV.map((entry) => (
            <NavButton
              key={entry.view}
              entry={entry}
              selected={view === entry.view}
              onSelect={onNavigate}
            />
          ))}
          <Divider sx={{ my: 1 }} />
          {PORTAL_NAV.map((entry) => (
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
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 1, px: 1 }}
          >
            API: {config.apiUrl || '(no configurada)'} · Mapa:{' '}
            {config.mapboxToken ? 'Mapbox' : 'OSM'}
          </Typography>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          background: 'linear-gradient(180deg, #F6FBF4 0%, #F8FCF8 100%)',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  )
}
