# VentasFix

## Backend

```bash
cd server
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev
```

La API escucha en `http://localhost:4000`.

## Autenticación

### Backoffice

`POST /login` recibe:

```json
{"email":"admin@ventasfix.cl","password":"Admin123!"}
```

Devuelve una cookie `httpOnly` llamada `token`.

### Softland / API externa

Configurar `SOFTLAND_CLIENT_ID` y `SOFTLAND_CLIENT_SECRET` en `server/.env`. Solicitar el JWT:

```http
POST /api/v1/auth/token
Content-Type: application/json
```

```json
{"client_id":"softland-client","client_secret":"..."}
```

La respuesta contiene `access_token`. En las siguientes solicitudes usar:

```http
Authorization: Bearer <access_token>
```

Los endpoints protegidos están disponibles con los mismos controllers y services en ambas rutas:

- Backoffice: `/dashboard`, `/usuarios`, `/productos`, `/clientes`
- API externa: `/api/v1/dashboard`, `/api/v1/usuarios`, `/api/v1/productos`, `/api/v1/clientes`

Cada entidad conserva sus operaciones `GET`, `POST`, `PUT` y `DELETE` existentes. `POST` y `PUT` de productos usan el campo multipart `imagen` cuando corresponde.
