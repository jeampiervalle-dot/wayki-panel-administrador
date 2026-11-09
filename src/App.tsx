import { useEffect, useMemo, useState } from 'react'
import {
  Alert, AppBar, Avatar, Box, Button, Card, CardContent, Chip, Dialog, DialogActions, DialogContent,
  DialogTitle, Divider, Drawer, IconButton, List, ListItemAvatar, ListItemButton, ListItemText,
  MenuItem, Stack, TextField, Toolbar, Typography, CircularProgress,
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/DashboardRounded'
import MapIcon from '@mui/icons-material/MapRounded'
import RouteIcon from '@mui/icons-material/AltRouteRounded'
import PeopleIcon from '@mui/icons-material/PeopleAltRounded'
import DirectionsBusIcon from '@mui/icons-material/DirectionsBusRounded'
import LogoutIcon from '@mui/icons-material/LogoutRounded'
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettingsRounded'
import PersonAddIcon from '@mui/icons-material/PersonAddAlt1Rounded'
import SaveIcon from '@mui/icons-material/SaveRounded'
import DeleteIcon from '@mui/icons-material/DeleteOutlineRounded'
import RefreshIcon from '@mui/icons-material/RefreshRounded'
import CheckCircleIcon from '@mui/icons-material/CheckCircleRounded'
import MapView from './views/MapView'
import { config } from './config'
import { backend } from './api/backend'
import type { Linea, Unidad, Usuario } from './types'

type View = 'inicio' | 'mapa' | 'rutas' | 'cuentas' | 'unidades' | 'portal'
const DRAWER = 290
const SESSION_KEY = 'wayki_admin_session'

function loadSession(): any | null { try { return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null') } catch { return null } }
function saveSession(s: any) { localStorage.setItem(SESSION_KEY, JSON.stringify(s)) }
function clearSession() { localStorage.removeItem(SESSION_KEY) }

export default function App() {
  const [session, setSession] = useState<any | null>(loadSession())
  const [view, setView] = useState<View>('inicio')

  if (!session) return <LoginView onLogin={(s) => { saveSession(s); setSession(s) }} />
  return <Shell session={session} view={view} setView={setView} onLogout={() => { clearSession(); setSession(null) }} />
}

function LoginView({ onLogin }: { onLogin: (s: any) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [dni, setDni] = useState('')
  const [pin, setPin] = useState('')
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [rol, setRol] = useState('ADMIN')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [ok, setOk] = useState<string | null>(null)
  async function submit() {
    setError(null); setOk(null); setBusy(true)
    try {
      const res = await backend.login(dni.trim(), pin.trim())
      if (res?.exito === false) throw new Error(res?.mensaje || 'No se pudo iniciar sesión')
      const user = res?.usuario ?? res?.user ?? res
      onLogin({ user, token: res?.token, raw: res })
    } catch (e: any) { setError(e?.message || 'Error de conexión') }
    finally { setBusy(false) }
  }
  async function register() {
    setError(null); setOk(null); setBusy(true)
    try {
      const res = await backend.registro({ nombre: nombre.trim(), dni: dni.trim(), telefono: telefono.trim(), email: email.trim() || undefined, pin: pin.trim(), rol })
      if (res?.exito === false) throw new Error(res?.mensaje || 'No se pudo crear la cuenta')
      setOk('Cuenta creada. Ya puedes iniciar sesión.')
      setMode('login')
    } catch (e: any) { setError(e?.message || 'No se pudo crear la cuenta') }
    finally { setBusy(false) }
  }
  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 2, background: 'radial-gradient(1200px 600px at 10% -10%, #D7EBDD 0%, transparent 60%), radial-gradient(900px 500px at 110% 10%, #CFE6D8 0%, transparent 55%), #F6FBF4' }}>
      <Card sx={{ width: '100%', maxWidth: 500, p: 1 }}>
        <CardContent>
          <Stack spacing={2.2}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar sx={{ bgcolor: 'primary.main', width: 52, height: 52 }}><AdminPanelSettingsIcon /></Avatar>
              <Box>
                <Typography variant="h5">Wayki Nest</Typography>
                <Typography color="text.secondary">{mode === 'login' ? 'Panel administrador (root)' : 'Crear cuenta'}</Typography>
              </Box>
            </Stack>
            {!config.apiUrl && <Alert severity="warning" sx={{ borderRadius: 3 }}>Configura <code>VITE_API_URL</code> en <code>.env</code> (ej. <code>http://IP_VPS:8080/api</code>).</Alert>}
            {mode === 'register' && (
              <>
                <TextField label="Nombre completo" value={nombre} onChange={(e) => setNombre(e.target.value)} fullWidth />
                <TextField label="Teléfono (9 dígitos)" value={telefono} onChange={(e) => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 9))} fullWidth />
                <TextField label="Email (opcional)" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth />
                <TextField select label="Rol" value={rol} onChange={(e) => setRol(e.target.value)} fullWidth>
                  <MenuItem value="ADMIN">ADMIN</MenuItem>
                  <MenuItem value="JEFE_RUTA">JEFE_RUTA</MenuItem>
                  <MenuItem value="CHOFER">CHOFER</MenuItem>
                </TextField>
              </>
            )}
            <TextField label="DNI (8 dígitos)" value={dni} onChange={(e) => setDni(e.target.value.replace(/\D/g, '').slice(0, 8))} fullWidth />
            <TextField label="PIN (4+ dígitos)" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))} type="password" fullWidth onKeyDown={(e) => e.key === 'Enter' && (mode==='login'?submit():register())} />
            {error && <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert>}
            {ok && <Alert severity="success" sx={{ borderRadius: 3 }}>{ok}</Alert>}
            {mode === 'login' ? (
              <Button variant="contained" size="large" onClick={submit} disabled={busy || dni.length < 8 || pin.length < 4}>
                {busy ? <CircularProgress size={22} color="inherit" /> : 'Iniciar sesión'}
              </Button>
            ) : (
              <Button variant="contained" size="large" onClick={register} disabled={busy || dni.length < 8 || pin.length < 4 || !nombre.trim() || telefono.length < 9}>
                {busy ? <CircularProgress size={22} color="inherit" /> : 'Crear cuenta'}
              </Button>
            )}
            <Button variant="text" onClick={() => { setMode(mode==='login'?'register':'login'); setError(null); setOk(null) }}>
              {mode === 'login' ? 'Crear cuenta' : 'Ya tengo cuenta, iniciar sesión'}
            </Button>
            <Typography variant="caption" color="text.secondary">Conectado al backend VPS. Los permisos dependen del rol.</Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  )
}

function Shell({ session, view, setView, onLogout }: { session: any; view: View; setView: (v: View) => void; onLogout: () => void }) {
  const name = session?.user?.nombre || session?.user?.name || session?.user?.dni || 'Administrador'
  const rol = session?.user?.rol || 'ADMIN'
  const nav = (v: View, icon: any, label: string, sub?: string) => (
    <ListItemButton selected={view===v} onClick={() => setView(v)} sx={{ borderRadius: 4, mb: 0.5 }}>
      <ListItemAvatar><Avatar sx={{ bgcolor: view===v ? 'primary.main' : 'rgba(47,107,79,0.12)', color: view===v ? '#fff' : 'primary.main' }}>{icon}</Avatar></ListItemAvatar>
      <ListItemText primary={label} secondary={sub} />
    </ListItemButton>
  )
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar position="fixed" elevation={0} sx={{ zIndex: (t) => t.zIndex.drawer + 1, background: 'linear-gradient(90deg, #2F6B4F 0%, #3E7F60 60%, #4B8E6D 100%)' }}>
        <Toolbar>
          <AdminPanelSettingsIcon sx={{ mr: 1.2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>Wayki Nest — Administración</Typography>
          <Chip label={rol} sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: '#fff', mr: 1 }} />
          <Chip avatar={<Avatar>{String(name).slice(0,1)}</Avatar>} label={name} sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: '#fff' }} />
        </Toolbar>
      </AppBar>
      <Drawer variant="permanent" sx={{ width: DRAWER, [`& .MuiDrawer-paper`]: { width: DRAWER, boxSizing: 'border-box', bgcolor: '#F1F8F2', p: 1 } }}>
        <Toolbar />
        <List sx={{ px: 1 }}>
          {nav('inicio', <DashboardIcon />, 'Inicio', 'Resumen y estado')}
          {nav('mapa', <MapIcon />, 'Mapa', 'Rutas y puntos de control')}
          {nav('cuentas', <PeopleIcon />, 'Cuentas', 'Usuarios: ver, editar, eliminar')}
          {nav('rutas', <RouteIcon />, 'Rutas / Líneas', 'Crear, actualizar, eliminar')}
          {nav('unidades', <DirectionsBusIcon />, 'Unidades', 'Vehículos y asignación')}
          <Divider sx={{ my: 1 }} />
          {nav('portal', <PersonAddIcon />, 'Portal conductor', 'Acceso y selección de ruta')}
        </List>
        <Box sx={{ mt: 'auto', p: 1.5 }}>
          <Button fullWidth color="inherit" startIcon={<LogoutIcon />} onClick={onLogout} sx={{ justifyContent: 'flex-start', borderRadius: 3 }}>Cerrar sesión</Button>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, px: 1 }}>API: {config.apiUrl || '(no configurada)'} · Mapa: {config.mapboxToken ? 'Mapbox' : 'OSM'}</Typography>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 }, background: 'linear-gradient(180deg, #F6FBF4 0%, #F8FCF8 100%)' }}>
        <Toolbar />
        {view === 'inicio' && <InicioView setView={setView} />}
        {view === 'mapa' && <MapView />}
        {view === 'cuentas' && <CuentasView />}
        {view === 'rutas' && <RutasView />}
        {view === 'unidades' && <UnidadesView />}
        {view === 'portal' && <PortalConductorView />}
      </Box>
    </Box>
  )
}

function useAsync<T>(fn: () => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const load = () => { setLoading(true); setError(null); fn().then(setData).catch((e) => setError(e.message)).finally(() => setLoading(false)) }
  useEffect(load, deps) // eslint-disable-line
  return { data, error, loading, reload: load, setData }
}

function InicioView({ setView }: { setView: (v: View) => void }) {
  const estado = useAsync(() => backend.estado(), [])
  return (
    <Stack spacing={2.5}>
      <Typography variant="h4">Panel de control</Typography>
      <Typography color="text.secondary">Administración central (root): cuentas, rutas, unidades y mapa conectados a tu VPS.</Typography>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        {[['Cuentas', 'Ver, actualizar o eliminar usuarios.', 'cuentas', <PeopleIcon />], ['Rutas / Líneas', 'Crear, actualizar y eliminar rutas.', 'rutas', <RouteIcon />], ['Mapa', 'Visualizar rutas y puntos de control.', 'mapa', <MapIcon />], ['Unidades', 'Gestionar vehículos de la flota.', 'unidades', <DirectionsBusIcon />]].map(([t,d,v,i]: any) => (
          <Card key={t} sx={{ flex: 1, cursor: 'pointer' }} onClick={() => setView(v)}>
            <CardContent><Stack spacing={1}><Avatar sx={{ bgcolor: 'primary.main' }}>{i}</Avatar><Typography variant="h6">{t}</Typography><Typography color="text.secondary" variant="body2">{d}</Typography></Stack></CardContent>
          </Card>
        ))}
      </Stack>
      <Card><CardContent>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}><CheckCircleIcon color={estado.error ? 'warning' : 'success'} /><Typography variant="h6">Estado del backend</Typography><Box sx={{ flex: 1 }} /><Button size="small" startIcon={<RefreshIcon />} onClick={estado.reload}>Actualizar</Button></Stack>
        {estado.loading ? <CircularProgress size={22} /> : estado.error ? <Alert severity="warning" sx={{ borderRadius: 3 }}>No se pudo conectar a <code>{config.apiUrl || '(sin URL)'}</code>: {estado.error}</Alert> : <Alert severity="success" sx={{ borderRadius: 3 }}>Conectado. Respuesta: <code>{JSON.stringify(estado.data)}</code></Alert>}
      </CardContent></Card>
    </Stack>
  )
}

function CuentasView() {
  const { data, error, loading, reload } = useAsync(() => backend.usuarios(), [])
  const [msg, setMsg] = useState<string | null>(null)
  const list: Usuario[] = Array.isArray(data) ? data : (data as any)?.content || []
  async function remove(u: Usuario) {
    if (!confirm(`¿Eliminar la cuenta de ${u.nombre} (${u.dni})?`)) return
    try { await backend.deleteUsuario(u.id); setMsg('Cuenta eliminada.'); reload() } catch (e: any) { setMsg(`No se pudo eliminar (¿endpoint no disponible?): ${e.message}`) }
  }
  async function toggleRole(u: Usuario) {
    const rol = u.rol === 'ADMIN' ? 'CHOFER' : 'ADMIN'
    try { await backend.updateUsuario(u.id, { rol }); setMsg(`Rol actualizado a ${rol}.`); reload() } catch (e: any) { setMsg(`No se pudo actualizar (¿endpoint no disponible?): ${e.message}`) }
  }
  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center"><Typography variant="h4" sx={{ flex: 1 }}>Cuentas</Typography><Button startIcon={<RefreshIcon />} onClick={reload}>Refrescar</Button></Stack>
      <Typography color="text.secondary">Usuarios registrados. Puedes actualizar o eliminar (si el backend expone los endpoints; si no, verás el aviso).</Typography>
      {msg && <Alert severity="info" onClose={() => setMsg(null)} sx={{ borderRadius: 3 }}>{msg}</Alert>}
      {loading ? <CircularProgress /> : error ? <Alert severity="warning" sx={{ borderRadius: 3 }}>{error}</Alert> : (
        <Stack spacing={1.5}>{list.map((u) => (
          <Card key={u.id} variant="outlined"><CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} justifyContent="space-between">
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar sx={{ bgcolor: 'primary.main' }}>{(u.nombre || '?').slice(0,1)}</Avatar>
                <Box><Typography variant="h6">{u.nombre}</Typography><Typography variant="body2" color="text.secondary">DNI {u.dni} · {u.telefono || 's/tel'} · {u.email || 's/email'}</Typography></Box>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Chip label={u.rol || 'CHOFER'} color={u.rol === 'ADMIN' ? 'primary' : 'default'} />
                <Chip label={u.isOnline ? 'En línea' : 'Offline'} variant="outlined" />
                <Button size="small" onClick={() => toggleRole(u)}>Cambiar rol</Button>
                <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => remove(u)}>Eliminar</Button>
              </Stack>
            </Stack>
          </CardContent></Card>
        ))}{list.length === 0 && <Alert severity="info" sx={{ borderRadius: 3 }}>No hay usuarios para mostrar.</Alert>}</Stack>
      )}
    </Stack>
  )
}

function RutasView() {
  const { data, error, loading, reload } = useAsync(() => backend.lineas(), [])
  const [msg, setMsg] = useState<string | null>(null)
  const [form, setForm] = useState<any>({ nombre: '', origen: '', destino: '', colorHex: '#2F6B4F' })
  const [edit, setEdit] = useState<Linea | null>(null)
  const list: Linea[] = Array.isArray(data) ? data : []
  async function saveNew() {
    try { await backend.createLinea(form); setMsg('Ruta creada.'); setForm({ nombre: '', origen: '', destino: '', colorHex: '#2F6B4F' }); reload() } catch (e: any) { setMsg(`No se pudo crear (¿endpoint no disponible?): ${e.message}`) }
  }
  async function saveEdit() {
    if (!edit) return
    try { await backend.updateLinea(edit.id, edit); setMsg('Ruta actualizada.'); setEdit(null); reload() } catch (e: any) { setMsg(`No se pudo actualizar (¿endpoint no disponible?): ${e.message}`) }
  }
  async function remove(l: Linea) {
    if (!confirm(`¿Eliminar la ruta ${l.nombre}?`)) return
    try { await backend.deleteLinea(l.id); setMsg('Ruta eliminada.'); reload() } catch (e: any) { setMsg(`No se pudo eliminar (¿endpoint no disponible?): ${e.message}`) }
  }
  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center"><Typography variant="h4" sx={{ flex: 1 }}>Rutas / Líneas</Typography><Button startIcon={<RefreshIcon />} onClick={reload}>Refrescar</Button></Stack>
      {msg && <Alert severity="info" onClose={() => setMsg(null)} sx={{ borderRadius: 3 }}>{msg}</Alert>}
      <Card><CardContent>
        <Typography variant="h6" sx={{ mb: 1.5 }}>Crear ruta</Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5}>
          <TextField label="Nombre" value={form.nombre} onChange={(e)=>setForm({...form, nombre:e.target.value})} size="small" />
          <TextField label="Origen" value={form.origen} onChange={(e)=>setForm({...form, origen:e.target.value})} size="small" />
          <TextField label="Destino" value={form.destino} onChange={(e)=>setForm({...form, destino:e.target.value})} size="small" />
          <TextField label="Color (#hex)" value={form.colorHex} onChange={(e)=>setForm({...form, colorHex:e.target.value})} size="small" sx={{ width: 140 }} />
          <Button variant="contained" startIcon={<SaveIcon />} onClick={saveNew} disabled={!form.nombre}>Crear</Button>
        </Stack>
      </CardContent></Card>
      {loading ? <CircularProgress /> : error ? <Alert severity="warning" sx={{ borderRadius: 3 }}>{error}</Alert> : (
        <Stack spacing={1.5}>{list.map((l) => (
          <Card key={l.id} variant="outlined"><CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} justifyContent="space-between">
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar sx={{ bgcolor: l.colorHex || 'primary.main' }}><RouteIcon /></Avatar>
                <Box><Typography variant="h6">{l.nombre}</Typography><Typography variant="body2" color="text.secondary">{l.origen || '?'} → {l.destino || '?'} {l.corredor ? `· ${l.corredor}` : ''}</Typography></Box>
              </Stack>
              <Stack direction="row" spacing={1}><Button size="small" onClick={() => setEdit({ ...l })}>Editar</Button><Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => remove(l)}>Eliminar</Button></Stack>
            </Stack>
          </CardContent></Card>
        ))}{list.length === 0 && <Alert severity="info" sx={{ borderRadius: 3 }}>No hay rutas para mostrar.</Alert>}</Stack>
      )}
      <Dialog open={!!edit} onClose={() => setEdit(null)} fullWidth maxWidth="sm">
        <DialogTitle>Editar ruta</DialogTitle>
        <DialogContent dividers><Stack spacing={1.5} sx={{ mt: 1 }}>
          <TextField label="Nombre" value={edit?.nombre||''} onChange={(e)=>setEdit(edit && {...edit, nombre:e.target.value})} />
          <TextField label="Origen" value={edit?.origen||''} onChange={(e)=>setEdit(edit && {...edit, origen:e.target.value})} />
          <TextField label="Destino" value={edit?.destino||''} onChange={(e)=>setEdit(edit && {...edit, destino:e.target.value})} />
          <TextField label="Color (#hex)" value={edit?.colorHex||''} onChange={(e)=>setEdit(edit && {...edit, colorHex:e.target.value})} />
        </Stack></DialogContent>
        <DialogActions sx={{ p: 2 }}><Button onClick={() => setEdit(null)}>Cancelar</Button><Button variant="contained" onClick={saveEdit} startIcon={<SaveIcon />}>Guardar</Button></DialogActions>
      </Dialog>
    </Stack>
  )
}

function UnidadesView() {
  const { data, error, loading, reload } = useAsync(() => backend.unidades(), [])
  const lineas = useAsync(() => backend.lineas(), [])
  const [msg, setMsg] = useState<string | null>(null)
  const [form, setForm] = useState<any>({ numeroPadron: '', placa: '', lineaId: '', estado: 'OPERATIVA' })
  const list: Unidad[] = Array.isArray(data) ? data : []
  const ls: Linea[] = Array.isArray(lineas.data) ? lineas.data : []
  async function saveNew() {
    try { await backend.createUnidad({ ...form, lineaId: Number(form.lineaId) }); setMsg('Unidad creada.'); setForm({ numeroPadron: '', placa: '', lineaId: '', estado: 'OPERATIVA' }); reload() } catch (e: any) { setMsg(`No se pudo crear (¿endpoint no disponible?): ${e.message}`) }
  }
  async function remove(u: Unidad) {
    if (!confirm(`¿Eliminar la unidad ${u.placa || u.numeroPadron}?`)) return
    try { await backend.deleteUnidad(u.id); setMsg('Unidad eliminada.'); reload() } catch (e: any) { setMsg(`No se pudo eliminar (¿endpoint no disponible?): ${e.message}`) }
  }
  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center"><Typography variant="h4" sx={{ flex: 1 }}>Unidades (vehículos)</Typography><Button startIcon={<RefreshIcon />} onClick={reload}>Refrescar</Button></Stack>
      {msg && <Alert severity="info" onClose={() => setMsg(null)} sx={{ borderRadius: 3 }}>{msg}</Alert>}
      <Card><CardContent>
        <Typography variant="h6" sx={{ mb: 1.5 }}>Registrar unidad</Typography>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} flexWrap="wrap" useFlexGap>
          <TextField label="Nº padrón" value={form.numeroPadron} onChange={(e)=>setForm({...form, numeroPadron:e.target.value})} size="small" />
          <TextField label="Placa" value={form.placa} onChange={(e)=>setForm({...form, placa:e.target.value})} size="small" />
          <TextField select label="Línea" value={form.lineaId} onChange={(e)=>setForm({...form, lineaId:e.target.value})} size="small" sx={{ minWidth: 180 }}>
            {ls.map((l)=> <MenuItem key={l.id} value={String(l.id)}>{l.nombre}</MenuItem>)}
          </TextField>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={saveNew} disabled={!form.placa || !form.lineaId}>Crear</Button>
        </Stack>
      </CardContent></Card>
      {loading ? <CircularProgress /> : error ? <Alert severity="warning" sx={{ borderRadius: 3 }}>{error}</Alert> : (
        <Stack spacing={1.5}>{list.map((u) => (
          <Card key={u.id} variant="outlined"><CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} justifyContent="space-between">
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Avatar sx={{ bgcolor: 'secondary.main' }}><DirectionsBusIcon /></Avatar>
                <Box><Typography variant="h6">Padrón {u.numeroPadron || '-'} · {u.placa}</Typography><Typography variant="body2" color="text.secondary">Línea ID {u.lineaId ?? '-'} · Estado {u.estado || 'OPERATIVA'}</Typography></Box>
              </Stack>
              <Stack direction="row" spacing={1} alignItems="center"><Chip label={u.estado || 'OPERATIVA'} color={u.estado === 'OPERATIVA' ? 'success' : 'default'} /><Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => remove(u)}>Eliminar</Button></Stack>
            </Stack>
          </CardContent></Card>
        ))}{list.length === 0 && <Alert severity="info" sx={{ borderRadius: 3 }}>No hay unidades para mostrar.</Alert>}</Stack>
      )}
    </Stack>
  )
}

function PortalConductorView() {
  const lineas = useAsync(() => backend.lineas(), [])
  const [dni, setDni] = useState('')
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [placa, setPlaca] = useState('')
  const [lineaId, setLineaId] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [authed, setAuthed] = useState<any | null>(null)
  const [pin, setPin] = useState('')
  const ls: Linea[] = Array.isArray(lineas.data) ? lineas.data : []

  async function loginConductor() {
    setMsg(null)
    try { const res = await backend.login(dni.trim(), pin.trim()); if (res?.exito === false) throw new Error(res?.mensaje); setAuthed(res?.usuario || res); setMsg({ ok: true, text: 'Acceso correcto. Puedes seleccionar tu ruta.' }) }
    catch (e: any) { setMsg({ ok: false, text: e.message }) }
  }
  function guardarRuta() {
    const l = ls.find(x => String(x.id) === lineaId)
    setMsg({ ok: true, text: `Ruta seleccionada: ${l?.nombre || lineaId}. Podrás cambiarla más adelante en Ajustes si decides cambiarte de ruta.` })
  }
  return (
    <Stack spacing={2}>
      <Typography variant="h4">Portal conductor</Typography>
      <Typography color="text.secondary">Acceso del conductor para seleccionar su ruta de trabajo. La ruta se puede cambiar más adelante si decides cambiarte de ruta.</Typography>
      {msg && <Alert severity={msg.ok ? 'success' : 'warning'} sx={{ borderRadius: 3 }} onClose={()=>setMsg(null)}>{msg.text}</Alert>}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <Card sx={{ flex: 1 }}><CardContent>
          <Typography variant="h6" sx={{ mb: 1.5 }}>Iniciar sesión</Typography>
          <Stack spacing={1.5}>
            <TextField label="DNI" value={dni} onChange={(e)=>setDni(e.target.value.replace(/\D/g,'').slice(0,8))} />
            <TextField label="PIN" type="password" value={pin} onChange={(e)=>setPin(e.target.value.replace(/\D/g,'').slice(0,8))} />
            <Button variant="contained" onClick={loginConductor} disabled={dni.length<8 || pin.length<4}>Ingresar</Button>
          </Stack>
        </CardContent></Card>
        <Card sx={{ flex: 1 }}><CardContent>
          <Typography variant="h6" sx={{ mb: 1.5 }}>Seleccionar ruta</Typography>
          <Stack spacing={1.5}>
            {authed && <Alert severity="info" sx={{ borderRadius: 3 }}>Sesión: {authed.nombre || authed.name || dni}</Alert>}
            <TextField select label="Ruta de trabajo" value={lineaId} onChange={(e)=>setLineaId(e.target.value)}>
              {ls.map((l)=> <MenuItem key={l.id} value={String(l.id)}>{l.nombre} {l.origen ? `(${l.origen}→${l.destino||''})` : ''}</MenuItem>)}
            </TextField>
            <Typography variant="caption" color="text.secondary">Podrás cambiarla más adelante en Ajustes si decides cambiarte de ruta.</Typography>
            <Button variant="contained" startIcon={<SaveIcon />} onClick={guardarRuta} disabled={!lineaId}>Guardar selección</Button>
          </Stack>
        </CardContent></Card>
      </Stack>
      <Card variant="outlined"><CardContent>
        <Typography variant="h6" sx={{ mb: 1 }}>Registro / solicitud (referencia)</Typography>
        <Typography color="text.secondary" variant="body2">El alta del conductor se gestiona como solicitud con verificación (DNI + nombre manual) y aprobación en horario laboral. La creación/persistencia real se conecta al backend (endpoint de registro/solicitudes) y al flujo de aprobación del administrador.</Typography>
      </CardContent></Card>
    </Stack>
  )
}
