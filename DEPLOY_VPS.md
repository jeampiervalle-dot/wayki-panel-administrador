# Despliegue en VPS (Wayki Nest Panel + Backend)

Guía para desplegar el **panel administrador** y el **backend Spring (activo)** en un VPS usando la **base de datos del VPS** (`gowayki_db`, PostgreSQL/PostGIS).

> El panel consume el backend **Spring Boot** (`/api`, puerto `8080` por defecto). El backend Django (`gowayki-nest-admin-back`) no es el que usa el panel actualmente; esta guía se centra en panel + Spring.

## 1. Requisitos previos

- VPS con acceso a la BD PostgreSQL/PostGIS `gowayki_db` (host, puerto, nombre, usuario y contraseña).
- Docker + Docker Compose (recomendado para el backend Spring) o Java 17+ / Gradle para ejecución directa.
- Node.js 18+ y npm (para compilar el panel) y un servidor web (Nginx/Caddy) para servir el build.
- Puertos abiertos según corresponda: `8080` (API) y `80/443` (panel), o exponer la API detrás de un reverse proxy.

## 2. Base de datos (usar la del VPS)

No levantar una base de datos local: apuntar los servicios a la BD del VPS.

- **Datos de conexión (ejemplo, ajustar a los reales del VPS):**
  - `DB_HOST=<host_o_ip_bd_vps>`
  - `DB_PORT=5432` (o el puerto real)
  - `DB_NAME=gowayki_db`
  - `DB_USER=<usuario>`
  - `DB_PASSWORD=<password>`
- **Esquema requerido:** el backend Spring usa `spring.jpa.hibernate.ddl-auto=validate`, por lo que el esquema de la BD del VPS debe ser compatible (tablas `usuario`, `unidad`, `linea`, `punto_control`, `unidad_posicion`, etc.).
- **Columnas/campos usados por el panel:**
  - `usuario.linea_id` (FK a `linea`) para asociar jefes/choferes a una ruta.
  - `unidad.linea_id` para asociar combis a una línea/subruta.
- **Datos de rutas/subrutas y trazados (importante):** el mapa y los selectores usan las subrutas C2–C11 alineadas a la app (116 subrutas). La BD debe tener las líneas y sus puntos de control/trazado (`punto_control` con `latitud/longitud/orden`, etc.). En el entorno local se insertaron las subrutas faltantes: **39 líneas** y **9719 puntos** en `punto_control` a partir de `route_geometry.json` de la app KMP. Asegúrate de que la BD del VPS cuente con estas líneas/trazados (migración, seed o importación) o el mapa mostrará “sin trazado registrado”.

> Verifica conectividad desde el VPS de la app hacia la BD (firewall/pg_hba.conf, SSL si aplica).

## 3. Backend Spring (`/home/jean/backed`)

Repositorio: backend principal (Spring Boot). Expone la API REST en `:8080` bajo `/api` (usuarios, líneas, unidades, puntos de control, etc.).

### 3.1 Variables de entorno

Configurar contra la BD del VPS:

```env
DB_HOST=<host_bd_vps>
DB_PORT=5432
DB_NAME=gowayki_db
DB_USER=<usuario_bd>
DB_PASSWORD=<password_bd>
PORT=8080
UPLOAD_DIR=/app/uploads/audios
```

(Equivalen a `spring.datasource.url=jdbc:postgresql://${DB_HOST}:${DB_PORT}/${DB_NAME}` y credenciales en `application.properties`).

### 3.2 Ejecución con Docker Compose (recomendado)

El `docker-compose.yml` actual define un servicio `db` local (PostGIS). **Para usar la BD del VPS no debes levantar ese `db`**. Opciones:

- **Opción A (simple):** ejecutar solo el servicio `api` apuntando a la BD externa y sin depender de `db`:
  1. Edita `docker-compose.yml` en el VPS para quitar `depends_on: db` del servicio `api` (y opcionalmente eliminar/comentar el servicio `db` y el volumen `gowayki_pgdata`), o usa un override.
  2. Exporta las variables `DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD` apuntando a la BD del VPS.
  3. Construye y levanta solo la API:
     ```bash
     docker compose build api
     docker compose up -d api
     ```
- **Opción B:** establecer `DB_HOST` al host real del VPS y no mapear/usar el contenedor `db` (asegurando que `api` no dependa de él).

Comprobar:
```bash
curl -i http://localhost:8080/api/lineas
```

### 3.3 CORS y red

- Los controladores permiten origen `*` (`@CrossOrigin(origins = "*")`), por lo que el panel puede consumir la API desde otro dominio/host. Si se restringe, ajustar a los orígenes del panel.
- Si la API queda detrás de Nginx (recomendado, HTTPS), hacer proxy de `/api` hacia `http://localhost:8080/api`.

## 4. Panel administrador (`/home/jean/panel adminnistrador`)

Repositorio: `https://github.com/jeampiervalle-dot/wayki-panel-administrador` (React + Vite).

### 4.1 Configuración (`.env` de build)

Crear `.env` (o `.env.production`) con la URL pública de la API del VPS:

```env
# URL pública del backend Spring en el VPS
VITE_API_URL=http://<IP_O_DOMINIO_VPS>:8080/api

# Opcional: token de Mapbox (si no, usa OpenStreetMap)
VITE_MAPBOX_TOKEN=<tu_token>
```

> `VITE_API_URL=/api` solo funciona con el proxy de desarrollo de Vite. En producción (build estático) debe ser la URL absoluta alcanzable por el navegador, p. ej. `https://tu-dominio.com/api` si Nginx hace proxy al backend.

### 4.2 Compilar y publicar

```bash
npm ci
npm run build
```

El resultado queda en `dist/`. Servir `dist/` como sitio estático (Nginx/Caddy). Ejemplo Nginx (SPA + proxy API opcional):

```nginx
server {
    listen 80;
    server_name <dominio_o_ip>;

    root /var/www/wayki-panel/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Opcional: proxy a la API para usar VITE_API_URL=/api en el mismo dominio
    location /api/ {
        proxy_pass http://127.0.0.1:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Si usas el bloque `/api` con proxy inverso en el mismo dominio, puedes compilar con `VITE_API_URL=/api` y evitar CORS/URLs absolutas.

## 5. Credenciales y acceso inicial

- **Admin (ejemplo en BD de desarrollo):** DNI `99999999` / `admin@gowayki.local` / contraseña `WaykiAdmin#2026` (rol `ADMIN`). Verifica/crea el usuario admin correspondiente en la BD del VPS.
- Los jefes de ruta inician sesión/registran y quedan asociados a una línea/empresa (`usuario.linea_id`).

## 6. Checklist de verificación

- [ ] La API responde en `http(s)://<vps>:8080/api/lineas` usando la BD del VPS.
- [ ] `GET/POST/PATCH/DELETE /api/unidades` operativos (CRUD de combis).
- [ ] `usuario.linea_id` y `unidad.linea_id` presentes y con datos coherentes.
- [ ] Líneas y `punto_control` de las subrutas C2–C11 cargados (trazados visibles en el mapa).
- [ ] Panel compilado con `VITE_API_URL` correcto y accesible desde el navegador.
- [ ] Login ADMIN y JEFE_RUTA funcionando; mapa muestra subrutas/trazados y combis se crean/editan/eliminan.

## 7. Notas

- **Datos locales → VPS:** los inserts de líneas/puntos de control realizados en la BD local deben replicarse en la BD del VPS para que coincidan con la app (fuente de geometrías: `route_geometry.json` de la app KMP).
- **Puertos:** por defecto API `8080`. Ajusta firewall/security groups del VPS.
- **Logs:** `docker compose logs -f api` para diagnosticar errores de conexión a BD o arranque.
