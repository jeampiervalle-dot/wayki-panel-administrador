# Panel de Administración Wayki Nest — Cómo funciona

Documento funcional y técnico del panel web: qué hace cada pantalla, cómo se
conecta al backend y dónde tocar para extenderlo.

- **Qué es:** panel de administración (root) para gestionar cuentas, rutas,
  unidades y visualizar el mapa de paraderos de Wayki Nest.
- **Stack:** React 19 + TypeScript 5.9 (strict) + Vite 7, MUI 7 (Material 3),
  Leaflet + react-leaflet 5.
- **Backend:** API REST de `gowayki-nest-back` (Spring Boot + PostgreSQL/PostGIS).
  La URL se configura en `.env` (`VITE_API_URL`).

---

## 1. Ejecutar

```bash
cd "panel adminnistrador"
npm install
cp .env.example .env      # ajusta VITE_API_URL
npm run dev               # http://localhost:5173
```

```bash
npm run build             # tsc -b + vite build -> dist/
npm run preview           # sirve dist/ localmente
```

> `VITE_API_URL` y `VITE_MAPBOX_TOKEN` se **inyectan en el build**. Si cambias la
> URL del backend hay que volver a compilar (`npm run build`); no se leen en
> tiempo de ejecución.
>
> El backend debe permitir **CORS** desde el origen del panel.

| Variable | Obligatoria | Uso |
|---|---|---|
| `VITE_API_URL` | sí | Base de la API, ej. `http://localhost:8080/api` |
| `VITE_MAPBOX_TOKEN` | no | Si está, el mapa usa Mapbox; si no, OpenStreetMap |

---

## 2. Arquitectura por capas

Dependencias en una sola dirección: **presentación → aplicación → dominio** y
**datos → dominio**. La UI nunca importa `fetch` ni conoce el backend.

```
src/
├── domain/            Núcleo puro (sin React, sin fetch)
│   ├── models.ts      Linea, PuntoControl, Unidad, Usuario, Sesion, ...
│   ├── ports.ts       Contratos: AuthRepository, LineasRepository, ...
│   └── errors.ts      AppError + toErrorMessage()
├── data/              Infraestructura (implementa los ports)
│   ├── httpClient.ts  Único fetch (base URL, JSON, errores)
│   ├── mappers.ts     DTO del backend → modelo de dominio
│   ├── sessionStore.ts localStorage de la sesión
│   └── repositories/  Un adaptador HTTP por recurso
├── application/       Casos de uso (hooks)
│   ├── useAsync.ts    loading / error / data / reload
│   ├── auth/useAuth.ts
│   ├── useLineas.ts, useUnidades.ts, useUsuarios.ts
│   ├── useEstado.ts, useMapa.ts, usePortalConductor.ts
├── app/               Composition root
│   ├── App.tsx        Providers + router de vistas
│   ├── dependencies.ts  Único lugar que instancia repositorios
│   ├── providers.tsx  Contextos de dependencias y sesión
│   └── navigation.ts  tipo View
├── presentation/      React + MUI (solo UI)
│   ├── layout/AdminLayout.tsx
│   ├── pages/         una página por vista
│   └── components/    PageHeader, FeedbackAlert
├── config.ts          lectura de variables de entorno
├── theme.ts           tema MUI
└── main.tsx           punto de entrada
```

### Recorrido de una petición

```
Página (MUI)
  └─ hook de application/  (useLineas, useUsuarios, ...)
       └─ port de domain/ports.ts
            └─ repositorio de data/repositories/
                 └─ httpClient  →  backend REST
```

`app/dependencies.ts` arma una sola vez `createDependencies()` con el
`httpClient` ya configurado y el `sessionStore` de `localStorage`.

---

## 3. Sesión y navegación

- `SessionProvider` ejecuta `useAuth`, que **lee la sesión guardada** al cargar.
- Al iniciar sesión: `POST /auth/login` con `{ dni, pin }`; la respuesta se
  normaliza a `Sesion` y se guarda en `localStorage` bajo `wayki_admin_session`.
- Sin sesión, `App` muestra `LoginPage`. Con sesión, muestra `AdminLayout` con
  el menú lateral y el contenido.
- La vista actual es **estado en memoria** (`useState<View>`), no hay router ni
  URLs: recargar la página vuelve a **Inicio**. Las vistas posibles son
  `inicio | mapa | cuentas | rutas | unidades | portal`.
- "Cerrar sesión" borra el `localStorage` y vuelve al login.

### Roles

`ROLES = ['ADMIN', 'JEFE_RUTA', 'CHOFER']`. El rol se muestra en la barra
superior y en cada cuenta. **Hoy el frontend no oculta opciones por rol**: los
permisos reales deben aplicarse en el backend.

---

## 4. Pantallas

### 4.1 Login / Crear cuenta

- **Iniciar sesión:** DNI (8 dígitos) + PIN (4+). Botón deshabilitado hasta
  cumplir el mínimo. Enter envía el formulario.
- **Crear cuenta:** nombre, teléfono (9 dígitos), email opcional, rol
  (ADMIN/JEFE_RUTA/CHOFER), DNI y PIN → `POST /auth/registro`. Por defecto el
  rol seleccionado es **ADMIN**.
- Avisa si falta `VITE_API_URL`. Los errores del backend se muestran en un
  `Alert`.

### 4.2 Inicio (Dashboard)

- Cuatro tarjetas de acceso rápido: Cuentas, Rutas/Líneas, Mapa, Unidades.
- **Estado del backend:** `GET /estado`, con botón "Actualizar". Si falla,
  muestra advertencia con la URL configurada; si responde, imprime el JSON crudo
  de la respuesta.

### 4.3 Cuentas

- Lista `GET /usuarios`: nombre, DNI, teléfono, email, rol y estado en línea.
- **Cambiar rol:** alterna `ADMIN ↔ CHOFER` con `PATCH /usuarios/{id}` `{ rol }`.
- **Eliminar:** confirmación y `DELETE /usuarios/{id}`.
- Si el endpoint no existe, muestra el aviso "¿endpoint no disponible?".

### 4.4 Rutas / Líneas

- **Crear:** nombre, origen, destino, color `#hex` → `POST /lineas`.
- **Editar:** diálogo con los mismos campos → `PATCH /lineas/{id}`.
- **Eliminar:** confirmación → `DELETE /lineas/{id}`.
- Lista con color de la línea, origen → destino y corredor.

### 4.5 Unidades

- **Registrar:** nº de padrón, placa, línea (select alimentado por `/lineas`).
  El estado se crea como `OPERATIVA` → `POST /unidades`.
- **Listar / eliminar:** `GET /unidades`, `DELETE /unidades/{id}`.
- No hay edición en la UI (el repositorio sí expone `actualizar`, pero ningún
  hook/pantalla lo usa).

### 4.6 Mapa

- Selector de línea con búsqueda por nombre, corredor o texto (ej. "C2", "SIT").
  Las líneas `Línea C*` se ordenan primero.
- Al elegir una línea: `GET /lineas/{id}/puntos-control`.
- Dibuja el **trazado completo** (polyline con los paraderos en orden) y por
  defecto **6 puntos de control** tomados de forma equidistante en el cliente
  (igual que la app móvil). El switch **"Mostrar todos"** dibuja todos.
- Centra/ajusta el mapa a los puntos (`fitBounds`). Centro por defecto:
  Arequipa `[-16.409, -71.537]`.
- Mosaicos: OpenStreetMap, o Mapbox si hay `VITE_MAPBOX_TOKEN`.

### 4.7 Portal conductor

- Login propio (`POST /auth/login`) que **no reemplaza** la sesión del
  administrador.
- Permite elegir "ruta de trabajo" de la lista de líneas. **Hoy la selección no
  se persiste**: solo muestra un mensaje de confirmación.
- La tarjeta de referencia recuerda que el alta real del conductor debe pasar
  por solicitud + verificación + aprobación del administrador.

---

## 5. Contrato con el backend

Base: `VITE_API_URL` (sin barra final). Todo pasa por `src/data/httpClient.ts`,
que envía/espera JSON y convierte errores en `AppError`.

### Endpoints usados

| Método | Ruta | Cuerpo | Respuesta esperada |
|---|---|---|---|
| POST | `/auth/login` | `{ dni, pin }` | `{ usuario, token }` o el usuario directo |
| POST | `/auth/registro` | `{ nombre, dni, telefono, email?, pin, rol }` | cualquiera; `{ exito: false, mensaje }` = error |
| GET | `/estado` | — | cualquiera (se muestra crudo) |
| GET | `/usuarios` | — | lista o `{ content }` / `{ data }` |
| PATCH | `/usuarios/{id}` | `{ rol }` | — |
| DELETE | `/usuarios/{id}` | — | — |
| GET | `/lineas` | — | lista o `{ content }` / `{ data }` |
| GET | `/lineas/{id}` | — | línea |
| POST | `/lineas` | `{ nombre, origen?, destino?, corredor?, colorHex? }` | línea |
| PATCH | `/lineas/{id}` | igual que POST | línea |
| DELETE | `/lineas/{id}` | — | — |
| GET | `/lineas/{id}/puntos-control` | — | lista de puntos |
| GET | `/unidades` | — | lista |
| GET | `/lineas/{id}/unidades` | — | lista |
| POST | `/unidades` | `{ numeroPadron?, placa, lineaId, estado }` | unidad |
| PATCH | `/unidades/{id}` | igual que POST | unidad |
| DELETE | `/unidades/{id}` | — | — |

### Tolerancia a nombres de campos

`src/data/mappers.ts` acepta alias del backend:

| Modelo | Acepta |
|---|---|
| Línea | `nombre`/`name`, `colorHex`/`color` |
| Punto | `lat`/`latitude`/`latitud`, `lng`/`longitude`/`longitud`, `orden`/`order`, `radioMetros`/`radioToleranciaMetros` |
| Unidad | `numeroPadron`/`padron`, `lineaId` o `linea.id` |
| Usuario | `nombre`/`name`, `telefono`/`phone`, `rol`/`role` (por defecto `CHOFER`) |

Las listas pueden venir como array plano o envueltas en `{ content: [...] }` o
`{ data: [...] }`. Una respuesta con `{ exito: false }` se trata como error.

### Errores

`httpClient` toma el mensaje de `message`, `mensaje` o `error`; si no hay,
`Error <status>`. Si la red falla: "No se pudo conectar con <URL>". Si no hay
`VITE_API_URL`: "Configura VITE_API_URL en .env".

---

## 6. Estado actual y limitaciones conocidas

1. **El token no se envía.** Se guarda en `localStorage`, pero `httpClient` no
   agrega `Authorization`. Si el backend protege los endpoints, hay que añadir
   el header (punto único: `src/data/httpClient.ts` + pasar el token).
2. **No hay pantalla de "solicitudes de registro".** El README habla de
   aprobar/rechazar solicitudes, pero el código actual crea cuentas directo con
   `/auth/registro` y gestiona usuarios en **Cuentas**. El flujo solicitud →
   aprobación todavía no existe en el panel.
3. **"Crear cuenta" permite elegir ADMIN** y no hay invitación ni aprobación en
   el frontend. El control debe estar en el backend.
4. **Portal conductor:** la ruta elegida no se guarda ni se envía al backend.
5. **Unidades:** no se puede editar; el estado siempre se crea `OPERATIVA`.
6. **Mapa:** los "6 puntos de control" son una muestra calculada en el cliente,
   no un dato del backend.
7. **Sin router:** no hay URLs por pantalla; recargar vuelve a Inicio.
8. **Sin tests ni lint** en `package.json`; la única verificación automática es
   `npm run build` (TypeScript strict + Vite).

---

## 7. Cómo extender

### Cambiar/agregar un endpoint

1. Si es un método nuevo en un recurso existente: agrégalo al port en
   `domain/ports.ts`.
2. Impleméntalo en `data/repositories/http*Repository.ts` (usa
   `http.get/post/patch/delete`).
3. Si el DTO trae nombres nuevos, normalízalo en `data/mappers.ts`.
4. Expón el caso de uso en el hook de `application/` (o crea uno con
   `useAsync`).

### Agregar una pantalla

1. Crea `presentation/pages/MiPage.tsx` usando MUI + hooks (nunca `fetch`).
2. Agrega la vista a `app/navigation.ts`.
3. Añádela al router de `app/App.tsx` y al menú de
   `presentation/layout/AdminLayout.tsx`.

### Reemplazar REST por otro backend

Solo se reescriben los repositorios de `data/repositories/` (y se ajusta
`dependencies.ts` si cambia la firma). El dominio y la UI no se tocan.

---

## 8. Archivos clave

| Archivo | Para qué |
|---|---|
| `src/config.ts` | Variables de entorno |
| `src/data/httpClient.ts` | URL base, headers, errores (aquí iría el token) |
| `src/data/mappers.ts` | Normalización de respuestas |
| `src/app/dependencies.ts` | Qué implementación usa cada port |
| `src/app/App.tsx` | Login vs panel + router de vistas |
| `src/application/useAsync.ts` | loading/error/reload reutilizable |
| `src/presentation/pages/MapPage.tsx` | Mapa, puntos y "Mostrar todos" |
