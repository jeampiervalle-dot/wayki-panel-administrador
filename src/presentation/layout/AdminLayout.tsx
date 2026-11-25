import { useState, type ReactNode } from 'react'
import {
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import MenuIcon from '@mui/icons-material/MenuRounded'
import LightModeIcon from '@mui/icons-material/LightModeRounded'
import DarkModeIcon from '@mui/icons-material/DarkModeRounded'
import DashboardIcon from '@mui/icons-material/SpaceDashboardRounded'
import MapIcon from '@mui/icons-material/MapRounded'
import RouteIcon from '@mui/icons-material/AltRouteRounded'
import PeopleIcon from '@mui/icons-material/PeopleAltRounded'
import DirectionsBusIcon from '@mui/icons-material/DirectionsBusRounded'
import LogoutIcon from '@mui/icons-material/LogoutRounded'
import DeleteForeverIcon from '@mui/icons-material/DeleteForeverRounded'
import AssignmentIndIcon from '@mui/icons-material/AssignmentIndRounded'
import GroupsIcon from '@mui/icons-material/GroupsRounded'
import SettingsIcon from '@mui/icons-material/SettingsRounded'
import { useDependencies, useSession } from '../../app/providers'
import { useThemeMode } from '../../app/themeContext'
import GlobalSearch from '../components/GlobalSearch'
import type { View } from '../../app/navigation'

const ANCHO = 252

interface NavEntry {
  view: View
  icon: ReactNode
  label: string
  description: string
}

function navForRole(rol: string): NavEntry[] {
  if (rol === 'JEFE_RUTA') {
    return [
      { view: 'inicio', icon: <DashboardIcon />, label: 'Inicio', description: 'Resumen de mi ruta' },
      { view: 'solicitudes', icon: <AssignmentIndIcon />, label: 'Solicitudes', description: 'Altas de choferes' },
      { view: 'mis-choferes', icon: <GroupsIcon />, label: 'Mis choferes', description: 'Choferes de mi ruta' },
      { view: 'combis', icon: <DirectionsBusIcon />, label: 'Combis', description: 'Unidades y asignación' },
      { view: 'mapa', icon: <MapIcon />, label: 'Mapa', description: 'Trazado y paraderos' },
      { view: 'ajustes', icon: <SettingsIcon />, label: 'Ajustes', description: 'Cuenta y ruta' },
    ]
  }
  return [
    { view: 'inicio', icon: <DashboardIcon />, label: 'Inicio', description: 'Resumen general' },
    { view: 'solicitudes', icon: <AssignmentIndIcon />, label: 'Solicitudes', description: 'Altas y aprobaciones' },
    { view: 'mapa', icon: <MapIcon />, label: 'Mapa', description: 'Rutas y paraderos' },
    { view: 'cuentas', icon: <PeopleIcon />, label: 'Cuentas', description: 'Usuarios del panel' },
    { view: 'rutas', icon: <RouteIcon />, label: 'Rutas / Líneas', description: 'Empresas y corredores' },
    { view: 'unidades', icon: <DirectionsBusIcon />, label: 'Unidades', description: 'Flota y asignación' },
    { view: 'ajustes', icon: <SettingsIcon />, label: 'Ajustes', description: 'Cuenta y ruta' },
  ]
}

function initials(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('')
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
  const { modo, alternar } = useThemeMode()
  const tema = useTheme()
  const escritorio = useMediaQuery(tema.breakpoints.up('md'))
  const [drawerAbierto, setDrawerAbierto] = useState(false)
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null)

  const usuario = sesion?.usuario
  const nombre = usuario?.nombre || usuario?.dni || 'Usuario'
  const rol = usuario?.rol || 'ADMIN'
  const navItems = navForRole(rol)
  const activo = navItems.find((entry) => entry.view === view)

  function navegar(next: View) {
    onNavigate(next)
    setDrawerAbierto(false)
  }

  async function handleEliminarCuenta() {
    setMenuAnchor(null)
    if (!usuario?.id) return
    if (!window.confirm('¿Eliminar tu cuenta definitivamente? Esta acción no se puede deshacer.')) return
    try {
      await usuarios.eliminar(usuario.id)
      cerrarSesion()
    } catch (cause) {
      window.alert(cause instanceof Error ? cause.message : 'No se pudo eliminar la cuenta')
    }
  }

  const contenidoDrawer = (
    <Stack sx={{ height: '100%', position: 'relative' }}>
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: 'linear-gradient(180deg, primary.main 0%, primary.main 62%, secondary.main 100%)',
        }}
      />
      <Box sx={{ height: 78, display: 'flex', alignItems: 'center', gap: 1.4, px: 2.25, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box
          component="img"
          src="/wayki-logo.png"
          alt="Wayki Nest"
          sx={{ width: 38, height: 38, objectFit: 'contain', p: 0.4, bgcolor: 'common.white', borderRadius: 1, flexShrink: 0 }}
        />
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontFamily: '"Unbounded", sans-serif', fontSize: 18, fontWeight: 700, lineHeight: 1.1, letterSpacing: '-0.01em' }}>
            WAYKI <Box component="span" sx={{ color: 'primary.main' }}>NEST</Box>
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: '0.05em' }}>
            PANEL DE OPERACIONES
          </Typography>
        </Box>
      </Box>

      <Box component="nav" sx={{ flex: 1, overflowY: 'auto', px: 1.25, py: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={{ px: 1.25, mb: 1, display: 'block' }}>
          Módulos
        </Typography>
        <Stack spacing={0.5}>
          {navItems.map((item) => {
            const active = view === item.view
            return (
              <Button
                key={item.view}
                fullWidth
                onClick={() => navegar(item.view)}
                aria-current={active ? 'page' : undefined}
                sx={{
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  py: 1.1,
                  px: 1.25,
                  minHeight: 52,
                  borderRadius: 1.5,
                  color: active ? 'primary.main' : 'text.primary',
                  bgcolor: active ? 'action.selected' : 'transparent',
                  '&:hover': { bgcolor: active ? 'action.selected' : 'action.hover' },
                }}
              >
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1,
                    display: 'grid',
                    placeItems: 'center',
                    bgcolor: active ? 'primary.main' : 'action.hover',
                    color: active ? 'primary.contrastText' : 'text.secondary',
                    fontSize: 20,
                    mr: 1.25,
                    flexShrink: 0,
                  }}
                >
                  {item.icon}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                    {item.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.2 }} noWrap>
                    {item.description}
                  </Typography>
                </Box>
              </Button>
            )
          })}
        </Stack>
      </Box>

      <Divider />
      <Box sx={{ p: 1.5 }}>
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
          <Avatar sx={{ width: 38, height: 38, bgcolor: 'secondary.main', color: 'secondary.contrastText', fontSize: 14, fontWeight: 700 }}>
            {initials(nombre)}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
              {nombre}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {rol === 'JEFE_RUTA' ? 'Jefe de ruta' : 'Administrador'}
            </Typography>
          </Box>
          <Tooltip title="Cerrar sesión">
            <IconButton size="small" onClick={cerrarSesion} aria-label="Cerrar sesión">
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>
    </Stack>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {escritorio ? (
        <Box component="aside" sx={{ width: ANCHO, flexShrink: 0, position: 'sticky', top: 0, height: '100vh', bgcolor: 'background.paper', borderRight: '1px solid', borderColor: 'divider' }}>
          {contenidoDrawer}
        </Box>
      ) : (
        <Drawer
          variant="temporary"
          open={drawerAbierto}
          onClose={() => setDrawerAbierto(false)}
          ModalProps={{ keepMounted: true }}
          slotProps={{ paper: { sx: { width: ANCHO, bgcolor: 'background.paper' } } }}
        >
          {contenidoDrawer}
        </Drawer>
      )}

      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <Box
          component="header"
          sx={{
            height: 64,
            flexShrink: 0,
            position: 'sticky',
            top: 0,
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 1.25,
            px: { xs: 2, sm: 3 },
            bgcolor: 'background.paper',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          {!escritorio && (
            <IconButton size="small" onClick={() => setDrawerAbierto(true)} aria-label="Abrir menú">
              <MenuIcon />
            </IconButton>
          )}
          <Box sx={{ minWidth: 0, display: { xs: 'none', sm: 'block' } }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1 }}>
              Wayki Nest
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.3 }} noWrap>
              {activo?.label ?? 'Inicio'}
            </Typography>
          </Box>
          <Box sx={{ flex: 1 }} />
          <GlobalSearch navItems={navItems} rol={rol} onNavigate={navegar} />
          <Tooltip title={modo === 'light' ? 'Tema oscuro' : 'Tema claro'}>
            <IconButton size="small" onClick={alternar} aria-label="Cambiar tema">
              {modo === 'light' ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
          <IconButton size="small" onClick={(event) => setMenuAnchor(event.currentTarget)} aria-label="Cuenta">
            <Avatar sx={{ width: 30, height: 30, bgcolor: 'primary.main', color: 'primary.contrastText', fontSize: 12, fontWeight: 700 }}>
              {initials(nombre)}
            </Avatar>
          </IconButton>
        </Box>

        <Box component="main" sx={{ flex: 1, minWidth: 0, width: '100%', maxWidth: 1560, mx: 'auto', p: { xs: 2, sm: 3 } }}>
          {children}
        </Box>
      </Box>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>{nombre}</Typography>
          <Typography variant="caption" color="text.secondary">{rol}</Typography>
        </Box>
        <Divider />
        <MenuItem onClick={() => { setMenuAnchor(null); alternar() }}>
          {modo === 'light' ? <DarkModeIcon fontSize="small" sx={{ mr: 1 }} /> : <LightModeIcon fontSize="small" sx={{ mr: 1 }} />}
          {modo === 'light' ? 'Tema oscuro' : 'Tema claro'}
        </MenuItem>
        <MenuItem onClick={() => { setMenuAnchor(null); cerrarSesion() }}>
          <LogoutIcon fontSize="small" sx={{ mr: 1 }} /> Cerrar sesión
        </MenuItem>
        <MenuItem onClick={handleEliminarCuenta} sx={{ color: 'error.main' }}>
          <DeleteForeverIcon fontSize="small" sx={{ mr: 1 }} /> Eliminar mi cuenta
        </MenuItem>
      </Menu>
    </Box>
  )
}
