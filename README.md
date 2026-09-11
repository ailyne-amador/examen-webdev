# VentasFix

Backoffice web y API REST para la gestión operativa de una empresa comercial. El sistema administra **usuarios**, **productos**, **clientes** y un **dashboard** de resumen. La misma lógica de negocio se consume desde la aplicación React y desde Softland mediante dos mecanismos de autenticación distintos.

## Contenido

- [Descripción general](#descripción-general)
- [Funcionalidades](#funcionalidades)
- [Capturas de la aplicación web](#capturas-de-la-aplicación-web)
- [Arquitectura](#arquitectura)
- [Modelo de datos](#modelo-de-datos)
- [Autenticación y seguridad](#autenticación-y-seguridad)
- [API REST](#api-rest)
- [Instalación y puesta en marcha](#instalación-y-puesta-en-marcha)
- [Variables de entorno](#variables-de-entorno)
- [Postman y verificación de la API](#postman-y-verificación-de-la-api)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Decisiones técnicas](#decisiones-técnicas)

## Descripción general

VentasFix está compuesto por:

- **Frontend:** aplicación React con Vite, React Router, Tailwind CSS v4 y Axios.
- **Backend:** API Express escrita en TypeScript.
- **Persistencia:** PostgreSQL 16 ejecutado con Docker.
- **ORM:** Prisma con `@prisma/adapter-pg` y un pool de conexiones `pg`.
- **Validación:** Zod en los límites de la API.
- **Seguridad:** JWT, cookies `httpOnly`, tokens Bearer, Argon2 y comparación segura de credenciales de servicio.
- **Archivos:** Multer para imágenes de productos, almacenadas en `server/uploads/` y servidas desde `/uploads`.

El backend expone dos superficies HTTP:

| Consumidor | Base | Autenticación | Uso |
|---|---|---|---|
| Backoffice React | `http://localhost:4000` | Cookie `token` después de `POST /login` | Operación diaria de usuarios, productos, clientes y dashboard |
| Softland / API externa | `http://localhost:4000/api/v1` | `Authorization: Bearer <access_token>` | Integración externa con las mismas operaciones de negocio |

No existen dos implementaciones separadas de cada CRUD: ambas superficies reutilizan los mismos controllers y services. Solo cambia la forma de obtener y transportar el JWT.

## Funcionalidades

### Acceso y sesión

- Login con correo y contraseña corporativos.
- Cookie JWT `httpOnly` con expiración de 8 horas.
- Protección de todas las rutas de operación mediante `ProtectedRoute` en el frontend y `authMiddleware` en el backend.
- Persistencia del usuario visible por pestaña mediante `sessionStorage`.
- Cierre de sesión que elimina la cookie del backoffice y limpia la sesión local, incluso si la API no está disponible.
- Redirección automática a `/login` cuando no existe una sesión local.

### Dashboard

- Conteo actual de usuarios, productos y clientes.
- Tarjetas navegables hacia cada listado.
- Accesos rápidos para crear un usuario, producto o cliente.
- Carga y mensajes de error visibles para el usuario.
- El backend calcula los tres conteos en paralelo con `Promise.all`.

### CRUD de usuarios

La pantalla `/usuarios` muestra tarjetas clickeables con nombre, correo y RUT.

- **Crear:** `/usuarios/nuevo`; registra RUT, nombre, apellido, correo `@ventasfix.cl` y contraseña.
- **Leer:** listado y ficha individual en `/usuarios/:id`.
- **Actualizar identidad:** desde la ficha se puede editar el nombre completo o el RUT en `/usuarios/:id/identidad`.
- **Actualizar credenciales propias:** el perfil permite cambiar únicamente el correo corporativo o la contraseña.
- **Eliminar:** confirmación explícita antes de borrar.
- Las respuestas públicas nunca incluyen la contraseña.
- Las contraseñas se almacenan con Argon2, nunca en texto plano.

La autorización actual es administrativa: cualquier token válido puede operar sobre los registros. No hay una restricción de propiedad que limite a un usuario a editarse a sí mismo.

### CRUD de productos e inventario

La pantalla `/productos` presenta el catálogo en tarjetas responsive.

- **Crear:** `/productos/nuevo`.
- **Leer:** listado y formulario de edición en `/productos/:id`.
- **Actualizar:** datos comerciales, descripción, precio, stock y reemplazo opcional de imagen.
- **Eliminar:** confirmación antes de borrar.
- Campos gestionados: SKU, nombre, descripción corta, descripción larga, precio neto, stock actual, stock mínimo, umbral de stock bajo y umbral de stock alto.
- La imagen es obligatoria al crear y opcional al editar.
- Solo se aceptan archivos cuyo MIME sea de imagen y el límite es 5 MB.
- El archivo se guarda con nombre UUID para evitar colisiones.
- `precioVenta` se calcula en el backend como `precioNeto × 1.19`, redondeado a dos decimales. El cliente nunca puede imponer ese valor.
- `estadoStock` es derivado, no se almacena en PostgreSQL:
  - `bajo` si `stockActual <= stockBajo`.
  - `alto` si `stockActual >= stockAlto`.
  - `normal` en cualquier otro caso.

### CRUD de clientes

La pantalla `/clientes` muestra la cartera comercial en tarjetas con los datos principales.

- **Crear:** `/clientes/nuevo`.
- **Leer:** listado y ficha editable en `/clientes/:id`.
- **Actualizar:** RUT de empresa, rubro, razón social, teléfono, dirección, contacto y correo de contacto.
- **Eliminar:** confirmación explícita antes de borrar.
- El correo de contacto se valida como correo electrónico.
- RUT de empresa es único en la base de datos.

### Perfil

La pantalla `/perfil` permite:

- Consultar nombre completo, RUT y correo corporativo.
- Cambiar el correo usado para iniciar sesión.
- Cambiar la contraseña, con mínimo de 6 caracteres.
- Cancelar una edición sin guardar.
- Ver mensajes de éxito y error.

El nombre, apellido y RUT no se editan desde el perfil; su edición administrativa está disponible en la ficha de usuario.

## Capturas de la aplicación web

Las imágenes siguientes fueron capturadas desde la aplicación ejecutándose con el backend local y datos del seed. Se conservan en [`docs/screenshots/`](docs/screenshots/).

### Login

Pantalla de acceso al backoffice. Solicita correo corporativo y contraseña, muestra errores de autenticación y evita el acceso a las rutas protegidas sin sesión.

![Pantalla de login de VentasFix](docs/screenshots/login.png)

### Dashboard

Resumen operativo con conteos y accesos rápidos a los tres CRUD.

![Dashboard de VentasFix](docs/screenshots/dashboard.png)

### Usuarios

Listado de usuarios con navegación a la ficha individual y alta de nuevos accesos.

![Listado de usuarios](docs/screenshots/usuarios.png)

### Productos

Catálogo de productos con precio de venta, imagen, SKU y estado derivado del stock.

![Listado de productos](docs/screenshots/productos.png)

### Clientes

Cartera comercial con datos de empresa y acceso directo a la edición.

![Listado de clientes](docs/screenshots/clientes.png)

### Perfil

Consulta y edición separada de correo y contraseña de la cuenta autenticada.

![Perfil de usuario](docs/screenshots/perfil.png)

## Arquitectura

### Flujo de una operación desde la web

```text
React + Axios
    │
    │ cookie JWT (withCredentials)
    ▼
web.routes.ts
    │
    ▼
authMiddleware
    │
    ▼
controller
    │  valida req.body con Zod
    ▼
service
    │  reglas de negocio y Prisma
    ▼
PostgreSQL
```

### Flujo de Softland

```text
Softland
    │
    │ POST /api/v1/auth/token con client_id/client_secret
    ▼
JWT de servicio
    │
    │ Authorization: Bearer <access_token>
    ▼
external.routes.ts
    │
    ▼
authMiddleware
    │
    ▼
los mismos controllers y services del backoffice
```

### Capas del backend

1. **Routes:** separan la superficie web (`web.routes.ts`) de la API externa (`external.routes.ts`).
2. **Middleware:** autentica JWT y procesa la carga de imágenes.
3. **Schemas:** validan cuerpos de entrada con Zod.
4. **Controllers:** traducen HTTP a llamadas de servicio y normalizan errores de validación, ID y recurso inexistente.
5. **Services:** concentran las reglas de negocio y son la única capa que habla con Prisma.
6. **Prisma:** persiste los modelos en PostgreSQL.

Esta separación permite que React y Softland reciban el mismo comportamiento para usuarios, productos, clientes y dashboard.

## Modelo de datos

### `Usuario`

| Campo | Tipo | Regla |
|---|---|---|
| `id` | `Int` | Clave primaria autoincremental |
| `rut` | `String` | Obligatorio y único |
| `nombre` | `String` | Obligatorio |
| `apellido` | `String` | Obligatorio |
| `email` | `String` | Obligatorio, único y con dominio `@ventasfix.cl` |
| `password` | `String` | Hash Argon2 |
| `createdAt`, `updatedAt` | `DateTime` | Auditoría de creación y actualización |

### `Producto`

| Campo | Tipo | Regla |
|---|---|---|
| `id` | `Int` | Clave primaria autoincremental |
| `sku` | `String` | Obligatorio y único |
| `nombre` | `String` | Obligatorio |
| `descripcionCorta`, `descripcionLarga` | `String` | Obligatorios |
| `imagenUrl` | `String` | Ruta `/uploads/...` o URL existente |
| `precioNeto` | `Decimal(10,2)` | Positivo |
| `precioVenta` | `Decimal(10,2)` | Calculado con IVA 19% |
| `stockActual`, `stockMinimo`, `stockBajo`, `stockAlto` | `Int` | Enteros no negativos |
| `createdAt`, `updatedAt` | `DateTime` | Auditoría de creación y actualización |

Además, la API agrega `estadoStock` en las respuestas como campo calculado.

### `Cliente`

| Campo | Tipo | Regla |
|---|---|---|
| `id` | `Int` | Clave primaria autoincremental |
| `rutEmpresa` | `String` | Obligatorio y único |
| `rubro`, `razonSocial`, `telefono`, `direccion`, `nombreContacto` | `String` | Obligatorios |
| `emailContacto` | `String` | Obligatorio y válido como email |
| `createdAt`, `updatedAt` | `DateTime` | Auditoría de creación y actualización |

## Autenticación y seguridad

### Backoffice

`POST /login` recibe JSON:

```json
{
  "email": "admin@ventasfix.cl",
  "password": "Admin123!"
}
```

Con credenciales válidas responde con el usuario público y establece una cookie `token`:

```json
{
  "message": "Login exitoso",
  "usuario": {
    "id": 1,
    "nombre": "Admin",
    "email": "admin@ventasfix.cl"
  }
}
```

La cookie es `httpOnly` y `sameSite=lax`. Axios está configurado con `withCredentials: true` para enviarla en las solicitudes del frontend.

Cerrar sesión:

```http
POST /logout
```

Responde `204` y limpia la cookie.

### Softland

1. Configurar `SOFTLAND_CLIENT_ID` y `SOFTLAND_CLIENT_SECRET` en `server/.env`.
2. Solicitar un token:

```http
POST http://localhost:4000/api/v1/auth/token
Content-Type: application/json
```

```json
{
  "client_id": "softland-client",
  "client_secret": "<secreto-configurado>"
}
```

3. Enviar el JWT recibido a las operaciones protegidas:

```http
Authorization: Bearer <access_token>
```

La respuesta del token incluye:

```json
{
  "access_token": "<jwt>",
  "token_type": "Bearer",
  "expires_in": 28800
}
```

Los secretos se comparan con `timingSafeEqual` y el token de servicio también expira en 8 horas.

### Respuestas de seguridad y errores comunes

- `401` si falta el token.
- `401` si el token es inválido o expiró.
- `400` si el cuerpo no cumple el schema o el ID no es numérico.
- `404` si el recurso solicitado no existe.
- `204` en eliminaciones exitosas.
- `400` si una imagen no es válida, supera 5 MB o usa un nombre de campo distinto de `imagen`.

## API REST

Todos los endpoints de negocio están protegidos. En la tabla, `{base}` significa:

- Backoffice: `http://localhost:4000`
- Softland: `http://localhost:4000/api/v1`

### Endpoints compartidos

| Método | Ruta | Descripción | Respuesta exitosa |
|---|---|---|---|
| `GET` | `{base}/dashboard` | Conteos de usuarios, productos y clientes | `200` |
| `GET` | `{base}/usuarios` | Lista usuarios sin contraseñas | `200` |
| `GET` | `{base}/usuarios/:id` | Obtiene un usuario | `200` |
| `POST` | `{base}/usuarios` | Crea un usuario | `201` |
| `PUT` | `{base}/usuarios/:id` | Actualiza campos enviados | `200` |
| `DELETE` | `{base}/usuarios/:id` | Elimina un usuario | `204` |
| `GET` | `{base}/productos` | Lista productos con `estadoStock` | `200` |
| `GET` | `{base}/productos/:id` | Obtiene un producto con `estadoStock` | `200` |
| `POST` | `{base}/productos` | Crea producto con imagen multipart | `201` |
| `PUT` | `{base}/productos/:id` | Actualiza producto; imagen opcional | `200` |
| `DELETE` | `{base}/productos/:id` | Elimina un producto | `204` |
| `GET` | `{base}/clientes` | Lista clientes | `200` |
| `GET` | `{base}/clientes/:id` | Obtiene un cliente | `200` |
| `POST` | `{base}/clientes` | Crea un cliente | `201` |
| `PUT` | `{base}/clientes/:id` | Actualiza campos enviados | `200` |
| `DELETE` | `{base}/clientes/:id` | Elimina un cliente | `204` |

### Cuerpo de usuario

Crear usuario requiere todos los campos:

```json
{
  "rut": "12345678-9",
  "nombre": "Ana",
  "apellido": "Ventas",
  "email": "ana@ventasfix.cl",
  "password": "UnaClaveSegura"
}
```

En `PUT`, todos los campos son opcionales. Si se envía `password`, se vuelve a hashear antes de persistir.

### Cuerpo de cliente

```json
{
  "rutEmpresa": "76543210-1",
  "rubro": "Tecnología",
  "razonSocial": "Cliente Ejemplo SpA",
  "telefono": "+56912345678",
  "direccion": "Av. Siempre Viva 123, Santiago",
  "nombreContacto": "Juan Pérez",
  "emailContacto": "juan.perez@ejemplo.cl"
}
```

En `PUT`, los campos son opcionales y se actualiza solo lo enviado.

### Cuerpo de producto

Los endpoints de producto usan `multipart/form-data` porque la imagen viaja en la misma solicitud.

| Campo | Tipo | Obligatorio al crear | Descripción |
|---|---|---:|---|
| `sku` | texto | Sí | Identificador único |
| `nombre` | texto | Sí | Nombre comercial |
| `descripcionCorta` | texto | Sí | Resumen |
| `descripcionLarga` | texto | Sí | Descripción completa |
| `precioNeto` | número | Sí | Positivo; puede llegar como string multipart |
| `stockActual` | entero | Sí | Stock disponible |
| `stockMinimo` | entero | Sí | Stock mínimo operativo |
| `stockBajo` | entero | Sí | Límite superior del estado bajo |
| `stockAlto` | entero | Sí | Límite inferior del estado alto |
| `imagen` | archivo | Sí al crear, no al editar | Imagen de máximo 5 MB |

`stockBajo` debe ser menor que `stockAlto`. `precioVenta` no se acepta desde el cliente: siempre lo calcula el service.

Ejemplo con `curl` para crear un producto en la API externa:

```bash
curl -X POST http://localhost:4000/api/v1/productos \
  -H "Authorization: Bearer <access_token>" \
  -F "sku=PROD-002" \
  -F "nombre=Teclado" \
  -F "descripcionCorta=Teclado USB" \
  -F "descripcionLarga=Teclado USB para oficina" \
  -F "precioNeto=15000" \
  -F "stockActual=25" \
  -F "stockMinimo=5" \
  -F "stockBajo=10" \
  -F "stockAlto=50" \
  -F "imagen=@./imagen.jpg"
```

## Instalación y puesta en marcha

### Requisitos

- Node.js compatible con las versiones instaladas en los `package-lock.json`.
- Docker Desktop con Docker Compose.
- Puertos libres `4000`, `5173` y `5432`.

### 1. Iniciar PostgreSQL

Desde la raíz:

```bash
docker compose up -d
```

El compose crea el contenedor `ventasfix_db` con PostgreSQL 16 y la base `ventasfix_db`.

### 2. Configurar y levantar el backend

```bash
cd server
copy .env.example .env
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev
```

En macOS/Linux, el equivalente de `copy` es:

```bash
cp .env.example .env
```

La API queda disponible en `http://localhost:4000`. Comprobarla con:

```bash
curl http://localhost:4000/health
```

Respuesta actual:

```json
{"status":"ok"}
```

El seed crea o verifica:

- Usuario: `admin@ventasfix.cl` / `Admin123!`
- Cliente de ejemplo con RUT `76543210-1`.
- Producto de ejemplo con SKU `PROD-001`.

### 3. Levantar el frontend

En otra terminal:

```bash
cd client
npm install
npm run dev
```

La aplicación queda disponible normalmente en `http://localhost:5173`.

Si la API no corre en `http://localhost:4000`, definir `VITE_API_URL` en `client/.env`:

```env
VITE_API_URL="http://localhost:4000"
```

### Comandos de verificación

Backend:

```bash
cd server
npm run build
```

Frontend:

```bash
cd client
npm run build
npm run lint
```

## Variables de entorno

### `server/.env`

Usar `server/.env.example` como base:

```env
DATABASE_URL="postgresql://ventasfix:ventasfix_pass@localhost:5432/ventasfix_db"
JWT_SECRET="replace-with-a-long-random-secret"
PORT=4000
CORS_ORIGIN="http://localhost:5173"
SOFTLAND_CLIENT_ID="softland-client"
SOFTLAND_CLIENT_SECRET="replace-with-a-random-secret"
```

No versionar secretos reales. El archivo `server/.env` es local.

### `client/.env`

```env
VITE_API_URL="http://localhost:4000"
```

Si no se define, el cliente Axios usa `http://localhost:4000` como fallback.

## Postman y verificación de la API

La carpeta [`postman/`](postman/) contiene:

- `VentasFix-API.postman_collection.json`: colección de la API externa.
- `VentasFix-Local.postman_environment.example.json`: environment versionable sin secretos.
- `VentasFix-Local.postman_environment.json`: environment local, ignorado por Git.

La colección cubre:

1. Obtener token de servicio.
2. Rechazar una solicitud sin token (`401`).
3. CRUD completo de usuarios.
4. CRUD completo de productos, incluyendo carga de imagen.
5. CRUD completo de clientes.
6. Variables dinámicas para guardar los IDs creados y el `access_token`.

Para usarla:

1. Levantar la API.
2. Importar la colección y el environment de ejemplo en Postman.
3. Crear un environment local con el `client_id`, `client_secret` y la ruta de una imagen de prueba.
4. Ejecutar primero **Obtener token de servicio**.
5. Ejecutar las carpetas de Usuarios, Productos y Clientes.

## Estructura del proyecto

```text
.
├── client/
│   ├── src/
│   │   ├── components/ProtectedRoute.jsx
│   │   ├── context/AuthContext.jsx
│   │   ├── lib/api.js
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── UsuariosPage.jsx
│   │   │   ├── ProductosPage.jsx
│   │   │   ├── ClientesPage.jsx
│   │   │   └── ProfilePage.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── src/
│   │   ├── config/prisma.ts
│   │   ├── controllers/
│   │   ├── middlewares/
│   │   ├── routes/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── utils/hash.ts
│   │   ├── app.ts
│   │   └── server.ts
│   ├── uploads/
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
├── docs/screenshots/
├── postman/
├── docker-compose.yml
├── frontend-design.md
└── README.md
```

## Decisiones técnicas

- **Drivers de Prisma:** se usa `@prisma/adapter-pg` con `pg.Pool` y un cliente generado en `server/src/generated/prisma`; el código nuevo debe respetar esa ruta de importación.
- **Reglas en services:** el controller no calcula IVA, no hashea contraseñas y no deriva el estado del stock. Esas reglas viven en los services.
- **Validación multipart:** los números de productos usan `z.coerce.number()` porque `multipart/form-data` los entrega inicialmente como strings.
- **Stock derivado:** `estadoStock` se calcula al responder para evitar que una columna almacenada quede desincronizada del stock real.
- **Imágenes:** se almacenan localmente en `server/uploads/`, con nombre UUID y límite de 5 MB.
- **Una sola lógica de negocio:** la API web y la API externa comparten controllers y services para evitar divergencias entre el backoffice y Softland.
