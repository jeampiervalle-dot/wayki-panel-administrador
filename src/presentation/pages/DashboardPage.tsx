import type { ReactNode } from 'react'
import { Alert, Avatar, Box, CircularProgress, Stack, Typography } from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForwardRounded'
import PeopleIcon from '@mui/icons-material/PeopleAltRounded'
import RouteIcon from '@mui/icons-material/AltRouteRounded'
import DirectionsBusIcon from '@mui/icons-material/DirectionsBusRounded'
import AssignmentIndIcon from '@mui/icons-material/AssignmentIndRounded'
import MapIcon from '@mui/icons-material/MapRounded'
import SettingsIcon from '@mui/icons-material/SettingsRounded'
import type { View } from '../../app/navigation'
import { useSession, useDependencies } from '../../app/providers'
import { useAsync } from '../../application/useAsync'
import { PageHeader } from '../components/PageHeader'
import { StatTile } from '../components/StatTile'
import { EmptyState } from '../components/EmptyState'
import { ListPanel, ListRow } from '../components/ListRow'
import { StatusChip } from '../components/StatusChip'

interface Modulo {
  titulo: string
  descripcion: string
  view: View
  icon: ReactNode
}

const FUENTES = [
  { clave: 'solicitudes', etiqueta: 'Solicitudes' },
  { clave: 'usuarios', etiqueta: 'Usuarios' },
  { clave: 'unidades', etiqueta: 'Unidades' },
  { clave: 'lineas', etiqueta: 'Líneas' },
] as const

const MODULOS: Modulo[] = [
  { titulo: 'Solicitudes', descripcion: 'Altas y aprobaciones', view: 'solicitudes', icon: <AssignmentIndIcon /> },
  { titulo: 'Mapa de rutas', descripcion: 'Trazados y paraderos', view: 'mapa', icon: <MapIcon /> },
  { titulo: 'Cuentas', descripcion: 'Usuarios del panel', view: 'cuentas', icon: <PeopleIcon /> },
  { titulo: 'Rutas / Líneas', descripcion: 'Líneas y corredores', view: 'rutas', icon: <RouteIcon /> },
  { titulo: 'Unidades', descripcion: 'Flota y asignación', view: 'unidades', icon: <DirectionsBusIcon /> },
  { titulo: 'Ajustes', descripcion: 'Cuenta y ruta de trabajo', view: 'ajustes', icon: <SettingsIcon /> },
]

export default function DashboardPage({ onNavigate }: { onNavigate: (view: View) => void }) {
  const { sesion } = useSession()
  const { solicitudes, usuarios, unidades, lineas } = useDependencies()
  const nombre = sesion?.usuario.nombre || sesion?.usuario.dni || 'administrador'

  const consulta = useAsync(async () => {
    const [rSol, rUsu, rUni, rLin] = await Promise.allSettled([
      // 'ADMIN' no es un TipoSolicitud: el listado de admin va sin filtro.
      solicitudes.listar(),
      usuarios.listar(),
      unidades.listar(),
      lineas.listar(),
    ])
    // Un módulo caído no debe mostrarse como "0": se marca como no disponible.
    const resultados = [rSol, rUsu, rUni, rLin]
    const fallos = resultados.flatMap((resultado, indice) =>
      resultado.status === 'rejected' ? [FUENTES[indice].clave] : [],
    )
    const listaSolicitudes = rSol.status === 'fulfilled' ? rSol.value : []
    const listaUsuarios = rUsu.status === 'fulfilled' ? rUsu.value : []
    const listaUnidades = rUni.status === 'fulfilled' ? rUni.value : []
    const listaLineas = rLin.status === 'fulfilled' ? rLin.value : []
    return {
      pendientes: listaSolicitudes.filter((s) => s.estado === 'PENDIENTE'),
      choferes: listaUsuarios.filter((u) => u.rol === 'CHOFER').length,
      operativas: listaUnidades.filter((u) => u.estado === 'OPERATIVA').length,
      totalUnidades: listaUnidades.length,
      lineas: listaLineas.length,
      recientes: [...listaSolicitudes]
        .sort((a, b) => (b.creadoEn ?? '').localeCompare(a.creadoEn ?? ''))
        .slice(0, 4),
      fallos,
    }
  }, [solicitudes, usuarios, unidades, lineas])

  const datos = consulta.data
  const hoy = new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <Stack spacing={3}>
      <PageHeader
        title="Panel de control"
        description={`Hola, ${nombre}. Resumen de la operación al ${hoy}.`}
      />

      <Box>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'baseline', mb: 1.5 }}>
          <Typography variant="h6">Estado de la operación</Typography>
          {consulta.loading && <CircularProgress size={14} />}
        </Stack>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', xl: 'repeat(4, 1fr)' }, gap: 2 }}>
          <StatTile
            value={datos && !datos.fallos.includes('solicitudes') ? datos.pendientes.length : '—'}
            label="Solicitudes pendientes"
            detalle="Requieren tu revisión"
            color="secondary.main"
            icono={<AssignmentIndIcon />}
            onClick={() => onNavigate('solicitudes')}
          />
          <StatTile
            value={datos && !datos.fallos.includes('lineas') ? datos.lineas : '—'}
            label="Líneas registradas"
            detalle="Empresas y corredores"
            color="primary.main"
            icono={<RouteIcon />}
            onClick={() => onNavigate('rutas')}
          />
          <StatTile
            value={datos && !datos.fallos.includes('unidades') ? datos.operativas : '—'}
            label="Unidades operativas"
            detalle={
              datos && !datos.fallos.includes('unidades')
                ? `de ${datos.totalUnidades} registradas`
                : undefined
            }
            color="info.main"
            icono={<DirectionsBusIcon />}
            onClick={() => onNavigate('unidades')}
          />
          <StatTile
            value={datos && !datos.fallos.includes('usuarios') ? datos.choferes : '—'}
            label="Choferes dados de alta"
            detalle="Cuentas en el sistema"
            color="success.main"
            icono={<PeopleIcon />}
            onClick={() => onNavigate('cuentas')}
          />
        </Box>
        {(consulta.error || (datos?.fallos.length ?? 0) > 0) && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            {datos && datos.fallos.length > 0
              ? `No se pudieron cargar ${FUENTES.filter((fuente) => datos.fallos.includes(fuente.clave))
                  .map((fuente) => fuente.etiqueta)
                  .join(', ')}. Esos módulos se muestran como “—”: sus cifras no son fiables.`
              : `No se pudieron cargar los datos: ${consulta.error}`}
          </Alert>
        )}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'minmax(0, 1.4fr) minmax(300px, 1fr)' }, gap: 3, alignItems: 'start' }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="h6" sx={{ mb: 1.5 }}>Accesos rápidos</Typography>
            <ListPanel>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' } }}>
                {MODULOS.map((modulo, index) => (
                  <Box
                    key={modulo.view}
                    onClick={() => onNavigate(modulo.view)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 2,
                      cursor: 'pointer',
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      ...(index % 2 === 0 ? { borderRight: '1px solid' } : {}),
                      ...(index >= MODULOS.length - 2 ? { borderBottom: 'none' } : {}),
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                  >
                    <Box sx={{ width: 36, height: 36, borderRadius: 1, bgcolor: 'action.hover', color: 'primary.main', display: 'grid', placeItems: 'center', fontSize: 21, flexShrink: 0 }}>
                      {modulo.icon}
                    </Box>
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{modulo.titulo}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{modulo.descripcion}</Typography>
                    </Box>
                    <ArrowForwardIcon sx={{ fontSize: 17, color: 'text.secondary' }} />
                  </Box>
                ))}
              </Box>
            </ListPanel>
          </Box>
        </Stack>

        <Box>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline', mb: 1.5 }}>
            <Typography variant="h6">Solicitudes recientes</Typography>
            <Typography
              variant="body2"
              color="primary.main"
              component="button"
              onClick={() => onNavigate('solicitudes')}
              sx={{ border: 0, background: 'none', cursor: 'pointer', font: 'inherit', p: 0 }}
            >
              Ver todas
            </Typography>
          </Stack>
          {consulta.loading && !datos ? (
            <Box sx={{ p: 4, display: 'grid', placeItems: 'center' }}><CircularProgress size={22} /></Box>
          ) : datos && datos.fallos.includes('solicitudes') ? (
            <Alert severity="warning">No se pudieron cargar las solicitudes recientes.</Alert>
          ) : datos && datos.recientes.length > 0 ? (
            <ListPanel>
              {datos.recientes.map((solicitud) => (
                <ListRow
                  key={solicitud.id}
                  leading={
                    <Avatar sx={{ bgcolor: 'action.hover', color: 'primary.main', width: 36, height: 36, fontSize: 16 }}>
                      {(solicitud.nombreCompleto || '?').slice(0, 1)}
                    </Avatar>
                  }
                  title={
                    <Typography variant="body2" sx={{ fontWeight: 700 }} noWrap>
                      {solicitud.nombreCompleto || solicitud.dni}
                    </Typography>
                  }
                  subtitle={
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      {solicitud.tipo ?? 'Solicitud'} · DNI {solicitud.dni || '-'}
                    </Typography>
                  }
                  meta={<StatusChip estado={solicitud.estado} />}
                />
              ))}
            </ListPanel>
          ) : (
            <EmptyState
              titulo="Todo al día"
              detalle="No hay solicitudes pendientes ni recientes en este momento."
            />
          )}
        </Box>
      </Box>
    </Stack>
  )
}
