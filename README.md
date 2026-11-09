# Wayki Nest — Panel de Administración

Panel web para revisar solicitudes de registro enviadas desde la app móvil, aprobar/rechazar cuentas y asignar el identificador de acceso con el que el conductor creará su PIN único.

- **UI:** Material Design 3 (tema MUI, esquinas expresivas, tipografía Roboto Flex).
- **Estado actual:** prototipo con datos en `localStorage` (ver `src/api.ts`). Listo para conectar a tu backend (REST/Supabase).
- **Verificación:** DNI + nombre ingresados manualmente (sin autocompletado RENIEC). La cuenta se activa solo tras aprobación del admin, revisada en horario laboral (no 24/7).

## Ejecutar

```bash
cd "~/panel adminnistrador"
npm install
npm run dev
```

## Integración (siguiente paso)

1. Backend: tabla `registration_requests` (`dni`, `full_name`, `phone`, `plate_number`, `work_route`, `status` `PENDIENTE|APROBADA|RECHAZADA`, `assigned_username`, timestamps, evidencia opcional) y usuarios aprobados; endpoints protegidos por rol.
2. Reemplaza las funciones de `src/api.ts` por llamadas reales.
3. App móvil (KMP): el registro crea una solicitud `PENDIENTE` (DNI + nombre manual, placa, ruta con aviso de cambio en Ajustes). Login: “¿Eres &lt;nombre&gt;?” → “Cambiar de usuario” → DNI → confirmar nombre → PIN. Validar cuenta `APROBADA` antes de crear/ingresar PIN.
