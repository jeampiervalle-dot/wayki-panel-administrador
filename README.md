# Wayki Nest — Panel de Administración

Panel web para revisar solicitudes de registro enviadas desde la app móvil, aprobar/rechazar cuentas y asignar el identificador de acceso con el que el conductor creará su PIN único.

- **UI:** Material Design 3 (tema MUI, esquinas expresivas, tipografía Roboto Flex).
- **Estado actual:** conectado a un backend REST (ver `.env`). La sesión se guarda en `localStorage`.
- **Verificación:** DNI + nombre ingresados manualmente (sin autocompletado RENIEC). La cuenta se activa solo tras aprobación del admin, revisada en horario laboral (no 24/7).

## Ejecutar

```bash
cd "~/panel adminnistrador"
npm install
npm run dev
```

Compilar para producción:

```bash
npm run build
npm run preview
```

## Arquitectura

El código está separado en capas con dependencias en una sola dirección:
**presentación → aplicación → dominio**, y **datos → dominio**. La UI nunca
importa `fetch`, `localStorage` ni conoce un backend concreto.

```
src/
├── domain/                 # Núcleo puro: no depende de React ni de fetch
│   ├── models.ts           # Entidades (Linea, Unidad, Usuario, Sesion...)
│   ├── ports.ts            # Contratos de repositorios (interfaces)
│   └── errors.ts           # AppError y normalización de mensajes
│
├── data/                   # Infraestructura: implementa los puertos
│   ├── httpClient.ts       # Único cliente HTTP (URL base, JSON, errores)
│   ├── mappers.ts          # DTO del backend → modelo de dominio
│   ├── sessionStore.ts     # Persistencia de sesión (localStorage)
│   └── repositories/       # Adaptadores HTTP por recurso
│
├── application/            # Casos de uso (hooks) que orquestan los puertos
│   ├── useAsync.ts         # loading/error/data/reload reutilizable
│   ├── auth/useAuth.ts     # Login, registro y cierre de sesión
│   ├── useLineas.ts        # Listar/crear/actualizar/eliminar rutas
│   ├── useUnidades.ts      # Listar/crear/eliminar unidades
│   ├── useUsuarios.ts      # Listar/cambiar rol/eliminar cuentas
│   ├── useEstado.ts        # Estado del backend
│   ├── useMapa.ts          # Líneas + puntos de control + selección
│   └── usePortalConductor.ts
│
├── app/                    # Composition root
│   ├── App.tsx             # Providers + router de vistas
│   ├── dependencies.ts     # Elige implementaciones concretas (DI)
│   ├── providers.tsx       # Contextos de dependencias y sesión
│   └── navigation.ts       # Tipo View
│
├── presentation/           # React + MUI (solo UI)
│   ├── layout/             # AppBar, Drawer, navegación
│   ├── pages/              # Una página por vista
│   └── components/         # Piezas reutilizables (PageHeader, FeedbackAlert)
│
├── config.ts               # Variables de entorno (VITE_API_URL, VITE_MAPBOX_TOKEN)
├── theme.ts                # Tema MUI
└── main.tsx                # Punto de entrada
```

### Reglas para que no vuelva a ser espagueti

1. **La UI no llama a la API.** Las páginas usan hooks de `application/`, nunca `fetch` ni `backend`.
2. **Los endpoints viven en `data/repositories/`.** Para cambiar una ruta del backend se toca un solo archivo.
3. **Los contratos viven en `domain/ports.ts`.** Si mañana cambias REST por Supabase, solo reescribes los repositorios.
4. **Los modelos no usan `any`.** Los DTO variables se normalizan en `data/mappers.ts`.
5. **Una página = una responsabilidad.** Si una vista crece, se extraen componentes a `presentation/components/`.
6. **La composición se hace en `app/dependencies.ts`.** Nada más instancia repositorios.

## Integración con el backend

1. Backend: tabla `registration_requests` (`dni`, `full_name`, `phone`, `plate_number`, `work_route`, `status` `PENDIENTE|APROBADA|RECHAZADA`, `assigned_username`, timestamps, evidencia opcional) y usuarios aprobados; endpoints protegidos por rol.
2. Configura la URL real en `.env` (`VITE_API_URL`) y ajusta las rutas en `src/data/repositories/`.
3. App móvil (KMP): el registro crea una solicitud `PENDIENTE` (DNI + nombre manual, placa, ruta con aviso de cambio en Ajustes). Login: “¿Eres &lt;nombre&gt;?” → “Cambiar de usuario” → DNI → confirmar nombre → PIN. Validar cuenta `APROBADA` antes de crear/ingresar PIN.
