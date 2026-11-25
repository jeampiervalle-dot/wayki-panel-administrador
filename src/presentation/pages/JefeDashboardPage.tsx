import { useMemo, useState } from 'react'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import GroupsIcon from '@mui/icons-material/GroupsRounded'
import DirectionsBusIcon from '@mui/icons-material/DirectionsBusRounded'
import RouteIcon from '@mui/icons-material/AltRouteRounded'
import { useUsuarios } from '../../application/useUsuarios'
import { useUnidades } from '../../application/useUnidades'
import { etiquetaSubruta, useSubrutas } from '../../application/useSubrutas'
import { useLineas } from '../../application/useLineas'
import { useDependencies, useSession } from '../../app/providers'
import { subrutaStore } from '../../data/subrutaStore'
import type { View } from '../../app/navigation'
import { PageHeader } from '../components/PageHeader'
import { StatTile } from '../components/StatTile'
import { RouteBadge } from '../components/RouteBadge'

export default function JefeDashboardPage({ onNavigate }: { onNavigate: (view: View) => void }) {
  const { sesion, actualizarUsuario } = useSession()
  const { usuarios: usuariosRepo, unidades: unidadesRepo, lineas: lineasRepo } = useDependencies()
  const usuarios = useUsuarios(usuariosRepo)
  const unidades = useUnidades(unidadesRepo)
  const lineasQuery = useLineas(lineasRepo)
  const { lineas } = lineasQuery
  const { subrutasDe } = useSubrutas()
  const [errorSubruta, setErrorSubruta] = useState<string | null>(null)
  const [elegiendo, setElegiendo] = useState(false)

  const usuario = sesion?.usuario
  const lineaId = usuario?.lineaId

  const linea = useMemo(
    () => lineas.find((item) => item.id === lineaId) ?? null,
    [lineas, lineaId],
  )
  const subrutas = useMemo(() => subrutasDe(linea), [subrutasDe, linea])

  const guardada = usuario?.dni ? subrutaStore.leerUsuario(usuario.dni) : null
  // Spring devuelve un subrutaId numérico; ese es el que se cruza con /unidades.
  const subrutaActualId =
    usuario?.subrutaDbId ?? guardada?.subrutaDbId ?? guardada?.subrutaId ?? usuario?.subrutaId

  const rutaSeleccionada = useMemo(
    () =>
      subrutas.find(
        (ruta) =>
          (ruta.subrutaDbId != null && String(ruta.subrutaDbId) === subrutaActualId) ||
          ruta.id === subrutaActualId,
      ) ?? null,
    [subrutas, subrutaActualId],
  )
  const subrutaIdEfectiva =
    (rutaSeleccionada?.subrutaDbId ? String(rutaSeleccionada.subrutaDbId) : null) ?? subrutaActualId

  async function elegirSubruta(valor: string) {
    if (!usuario) return
    setErrorSubruta(null)
    const ruta = subrutas.find((item) => String(item.subrutaDbId ?? item.id) === valor)
    if (!ruta) return
    const nombre = etiquetaSubruta(ruta)
    const dbId = ruta.subrutaDbId ? String(ruta.subrutaDbId) : ruta.id
    const dbIdNumero = Number(dbId)
    if (!Number.isFinite(dbIdNumero) || dbIdNumero <= 0) {
      setErrorSubruta('La subruta elegida no tiene un identificador numérico válido.')
      return
    }

    try {
      await usuariosRepo.actualizarSubruta(usuario.id, dbIdNumero)
      subrutaStore.guardarUsuario(usuario.dni, {
        lineaId: lineaId ?? 0,
        nombreLinea: usuario.lineaNombre ?? linea?.nombre ?? '',
        codigoLinea: linea?.corredor,
        subrutaId: ruta.id,
        subrutaDbId: dbId,
        nombreSubruta: nombre,
      })
      actualizarUsuario({
        ...usuario,
        subrutaId: ruta.id,
        subrutaDbId: dbId,
        nombreSubruta: nombre,
      })
      setElegiendo(false)
    } catch {
      // No se actualiza la sesión: la BD no conservaría el dato mostrado.
      setErrorSubruta('No se pudo guardar la subruta en el servidor. Inténtalo de nuevo.')
    }
  }

  const choferes = usuarios.usuarios.filter((u) => u.rol === 'CHOFER')
  let choferesEnRuta = lineaId != null ? choferes.filter((u) => u.lineaId === lineaId) : choferes
  const haySubrutaEnChoferes = choferesEnRuta.some((u) => u.subrutaDbId || u.subrutaId)
  if (subrutaIdEfectiva && haySubrutaEnChoferes) {
    choferesEnRuta = choferesEnRuta.filter((u) => {
      const subrutaChofer = u.subrutaDbId ?? u.subrutaId
      // El backend no siempre informa la subruta: esos choferes se conservan.
      return !subrutaChofer || String(subrutaChofer) === String(subrutaIdEfectiva)
    })
  }

  let unidadesRuta = lineaId != null ? unidades.unidades.filter((u) => u.lineaId === lineaId) : unidades.unidades
  if (subrutaIdEfectiva) {
    unidadesRuta = unidadesRuta.filter(
      (u) =>
        u.subrutaId === subrutaIdEfectiva ||
        subrutaStore.leerUnidad(u.id)?.subrutaDbId === subrutaIdEfectiva ||
        subrutaStore.leerUnidad(u.id)?.subrutaId === subrutaIdEfectiva,
    )
  }
  const sinAlcance = lineaId == null
  const loading = usuarios.loading || unidades.loading

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title="Mi ruta"
        description="Elige tu subruta, consulta tus choferes y combis, y revisa el trazado en el mapa."
        onRefresh={() => { usuarios.reload(); unidades.reload() }}
      />

      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
        <RouteBadge code={linea?.nombre.match(/\bC\d{1,2}\b/i)?.[0]?.toUpperCase() ?? '—'} size="md" />
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {usuario?.lineaNombre ?? 'Línea no asignada'}
        </Typography>
        {(rutaSeleccionada || usuario?.nombreSubruta) && (
          <Typography variant="body2" color="text.secondary">
            · {rutaSeleccionada ? etiquetaSubruta(rutaSeleccionada) : usuario?.nombreSubruta}
          </Typography>
        )}
      </Stack>

      <Box sx={{ bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2.5 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'center' }, justifyContent: 'space-between' }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6">Mi subruta</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {rutaSeleccionada
                ? 'Solo se muestran choferes y combis de esta subruta.'
                : 'Selecciona tu recorrido para ver los datos que te corresponden.'}
            </Typography>
          </Box>
          {rutaSeleccionada && !elegiendo ? (
            <Button variant="outlined" onClick={() => setElegiendo(true)}>Cambiar subruta</Button>
          ) : null}
        </Stack>

        {(!rutaSeleccionada || elegiendo) && (
          <Box sx={{ mt: 2 }}>
            <TextField
              select
              label="Subruta de mi línea"
              value={subrutas.some((ruta) => String(ruta.subrutaDbId ?? ruta.id) === subrutaActualId) ? subrutaActualId ?? '' : ''}
              onChange={(event) => elegirSubruta(event.target.value)}
              size="small"
              sx={{ minWidth: { xs: '100%', sm: 360 } }}
              disabled={!linea}
              helperText={
                lineasQuery.loading
                  ? 'Cargando líneas desde la base de datos…'
                  : lineasQuery.error
                    ? 'No se pudieron cargar las líneas. Reintenta con Refrescar.'
                    : !linea
                      ? 'Tu cuenta aún no tiene una línea asignada.'
                      : `${subrutas.length} subrutas disponibles`
              }
            >
              {subrutas.map((ruta) => (
                <MenuItem key={ruta.id} value={String(ruta.subrutaDbId ?? ruta.id)}>
                  {etiquetaSubruta(ruta)}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        )}
        {errorSubruta && <Alert severity="error" sx={{ mt: 2 }}>{errorSubruta}</Alert>}
      </Box>

      {sinAlcance && (
        <Alert severity="info">
          Tu cuenta aún no tiene una línea asociada. Cuando el administrador te la asigne, los datos se filtrarán automáticamente.
        </Alert>
      )}
      {(usuarios.error || unidades.error) && (
        <Alert severity="warning">{usuarios.error || unidades.error}</Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
        {loading ? (
          <Box sx={{ p: 4, display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>
        ) : (
          <>
            <StatTile
              value={choferesEnRuta.length}
              label="Choferes en mi ruta"
              detalle={subrutaIdEfectiva && !haySubrutaEnChoferes ? 'Filtrados por línea' : 'De tu subruta asignada'}
              color="primary.main"
              icono={<GroupsIcon />}
            />
            <StatTile
              value={unidadesRuta.length}
              label="Combis en mi ruta"
              detalle={subrutaIdEfectiva ? 'De tu subruta asignada' : 'De tu línea'}
              color="secondary.main"
              icono={<DirectionsBusIcon />}
            />
          </>
        )}
      </Box>

      <Button
        variant="text"
        startIcon={<RouteIcon />}
        sx={{ alignSelf: 'flex-start' }}
        onClick={() => onNavigate('mapa')}
      >
        Ver el trazado en el mapa
      </Button>
    </Stack>
  )
}
