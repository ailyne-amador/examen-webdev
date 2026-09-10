# AGENTS.md — Proyecto VentasFix

Este documento describe el estado actual del proyecto para que cualquier agente (o persona) que retome el código entienda qué existe, cómo está organizado y qué falta, sin tener que releer todo el historial de decisiones.

## Qué es este proyecto

VentasFix es un proyecto universitario: un **backoffice** (React) + **API** (Express/TypeScript) para gestionar Usuarios, Productos y Clientes de una empresa. La API también debe poder ser consumida externamente por un sistema llamado **Softland**, autenticándose de forma distinta al login humano (token de servicio vía `client_id`/`client_secret`, aún no implementado — ver "Qué falta").

Idea central de la arquitectura: **backoffice y Softland comparten los mismos controllers/services**. Lo único que cambia entre ambos es cómo se autentica cada uno — el middleware de auth acepta el token tanto por cookie (backoffice) como por header `Authorization: Bearer` (Softland/API externa).

## Stack

**Backend** (`server/`):
- TypeScript + Node.js + Express
- PostgreSQL en Docker
- Prisma (ORM), con **driver adapters** (`@prisma/adapter-pg` + `pg.Pool`) en vez del motor de queries por defecto — ver nota en "Decisiones y desviaciones"
- Zod (validación de requests)
- Argon2 (hash de contraseñas)
- jsonwebtoken (JWT)
- cookie-parser, cors, multer, dotenv
- Ejecución en desarrollo: `tsx watch`

**Frontend** (`client/`): aún no iniciado (Fase 11 en adelante). Cuando se construya: React + Vite + Tailwind + axios + react-router-dom + react-hook-form.

## Estructura de carpetas (backend)

```
server/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── generated/prisma/client/   # cliente de Prisma generado en ruta custom (no node_modules/@prisma/client)
├── src/
│   ├── config/
│   │   └── prisma.ts          # instancia única de PrismaClient con adapter pg
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── usuario.controller.ts
│   │   ├── producto.controller.ts
│   │   ├── cliente.controller.ts
│   │   └── dashboard.controller.ts
│   ├── middlewares/
│   │   ├── auth.middleware.ts
│   │   └── upload.middleware.ts
│   ├── routes/
│   │   └── web.routes.ts      # aún no separado de external.routes.ts (ver Fase 10 pendiente)
│   ├── schemas/                # validaciones Zod
│   │   ├── usuario.schema.ts
│   │   ├── producto.schema.ts
│   │   └── cliente.schema.ts
│   ├── services/
│   │   ├── usuario.service.ts
│   │   ├── producto.service.ts
│   │   ├── cliente.service.ts
│   │   └── dashboard.service.ts
│   ├── utils/
│   │   └── hash.ts
│   ├── app.ts
│   └── server.ts
├── uploads/                    # imágenes de productos, servidas como estáticas en /uploads
└── .env
```


## Patrón de arquitectura (aplicar igual para cualquier entidad nueva)

Cada entidad sigue 4 capas, cada una con una sola responsabilidad:

1. **`schemas/<entidad>.schema.ts`** — Zod valida la forma del `req.body`. Exporta `crear<Entidad>Schema`, `actualizar<Entidad>Schema` (derivado con `.partial()`) y los tipos inferidos (`z.infer<...>`). Si hay validación cruzada entre campos, usar `.refine()` **después** de `.partial()`, nunca antes (una vez envuelto en `.refine()` el schema pierde `.partial()`).
2. **`services/<entidad>.service.ts`** — única capa que le habla a Prisma. Aquí van las reglas de negocio: hashear passwords, calcular `precioVenta` (IVA 19%, nunca confiar en el valor que mande el cliente), calcular campos derivados (ej. `estadoStock`), y el `select` que excluye campos sensibles de la respuesta.
3. **`controllers/<entidad>.controller.ts`** — traduce HTTP ↔ service: valida con el schema (`safeParse`), llama al service, responde. Sin lógica de negocio acá. Maneja `Prisma.PrismaClientKnownRequestError` código `P2025` → `404` en vez de dejar que explote como `500`.
4. **`routes/web.routes.ts`** — conecta todo, con `authMiddleware` en cada ruta protegida.

Convenciones HTTP ya establecidas: `201` en creación, `204` sin body en eliminación, `400` en ID inválido (`isNaN`) o validación fallida, `401` sin token / token inválido, `403` reservado para "autenticado pero sin permiso" (no usado aún), `404` en recurso no encontrado.

## Variables de entorno (`server/.env`)

```
DATABASE_URL="postgresql://ventasfix:ventasfix_pass@localhost:5432/ventasfix_db"
JWT_SECRET="..."
PORT=4000
```
Pendiente agregar en Fase 10: credenciales de servicio para Softland (`client_id`/`client_secret`).

## Estado actual por fase

- ✅ **Fase 0-1** — Docker con Postgres 16 corriendo, contenedor `ventasfix_db`.
- ✅ **Fase 2** — Esqueleto Express + TS. `app.ts` configura cors (`origin: http://localhost:5173`, `credentials: true`), `express.json()`, `cookieParser()`, y sirve `/uploads` como estático. `GET /health` responde `{ ok: true }`.
- ✅ **Fase 3** — Modelado en Prisma: modelos `Usuario`, `Producto`, `Cliente` (el modelo `Cliente` está definido en el schema pero su CRUD — Fase 8 — no se ha construido todavía). Migraciones aplicadas.
+ ✅ **Fase 3** — Modelado en Prisma: modelos `Usuario`, `Producto`, `Cliente`. Migraciones aplicadas.
- ✅ **Fase 4** — Seed con un usuario inicial (`@ventasfix.cl`), password hasheada con Argon2.
- ✅ **Fase 5** — Autenticación completa: `hashPassword`/`verifyPassword` (Argon2), `POST /login` (Zod → verifica → firma JWT → cookie httpOnly), `authMiddleware` (acepta Bearer o cookie).
- ✅ **Fase 6** — CRUD de Usuarios completo y probado en Postman (las 5 operaciones). Incluye:
  - Validación de email con dominio `@ventasfix.cl` obligatorio.
  - `camposPublicos` (select reutilizable) que excluye `password` de toda respuesta excepto `delete`.
  - Decisión de diseño: **no hay restricción de "solo puedes editar tus propios datos"** — es un CRUD administrativo de backoffice, y la API la consumirá también Softland (cuyo token de servicio no corresponde a una fila real de `usuarios`). La única protección es `authMiddleware` (token válido, sin importar de quién).
- ✅ **Fase 7 — completada.** Construido: `producto.schema.ts` (con `z.coerce.number()` porque los campos llegan como string vía `multipart/form-data`, y `.refine()` validando `stockBajo < stockAlto`), `producto.service.ts` (calcula `precioVenta` con IVA 19% y redondeo a 2 decimales, y `estadoStock` — ver más abajo), `producto.controller.ts`, `upload.middleware.ts` (diskStorage con nombre único, solo imágenes, límite 5 MB) y las rutas protegidas de Producto en `web.routes.ts` con `upload.single("imagen")` en `POST`/`PUT`. `app.ts` sirve `/uploads` y devuelve `400` para errores de carga Multer. `npm run build` pasa correctamente. Flujo CRUD end-to-end verificado con `multipart/form-data`, autenticación e `imagen-prueba.jpg`.

- ✅ **Fase 8** — CRUD de Clientes completado con schema Zod, service Prisma, controller y rutas protegidas (`GET`, `POST`, `PUT`, `DELETE`). Validación de email, respuestas `404` para recursos inexistentes y smoke test end-to-end verificados.

  Decisión de diseño relevante para Productos: `stockBajo`/`stockAlto`/`stockMinimo` son umbrales **configurables por producto** (ya existen como columnas en el modelo, no requirió migración). `estadoStock` ("bajo"/"normal"/"alto") es un **campo derivado calculado en el service** (`calcularEstadoStock`), nunca almacenado en la BD, para evitar que quede desincronizado del `stockActual` real.

## Qué falta (fases pendientes, en orden)

- ✅ **Fase 9** — Endpoint protegido `GET /dashboard` con los conteos de usuarios, productos y clientes, calculados en paralelo.
- **Fase 10** — Separar rutas de backoffice (`/usuarios`, `/productos`, ...) de rutas para Softland (`/api/v1/...`), reutilizando los mismos controllers/services. Crear `POST /api/v1/auth/token` para que Softland obtenga su JWT vía `client_id`/`client_secret`. Documentar en README.
- **Fase 11** — Setup de `client/` con Vite + Tailwind + axios + react-router-dom.
- **Fase 12** — Auth en frontend: `AuthContext`, página de login, `ProtectedRoute`, router con las rutas del sistema.
- **Fase 13** — Pantallas CRUD (Usuarios como referencia, luego Productos con input de imagen, luego Clientes) + Dashboard.
- **Fase 14** — Colección de Postman completa contra `/api/v1/...` (token + 5 operaciones × 3 entidades), verificando 401 sin token.
- **Fase 15** — Checklist final de la pauta (login, validaciones backend, password hasheada, rechazo sin token, 3 CRUD funcionando desde ambos lados, dashboard, `precioVenta` con IVA).
- **Fase 16** — Grabación de los 2 videos y entrega del zip.

## Decisiones y desviaciones respecto a la guía original

Estas son diferencias entre lo que sugiere la guía base del proyecto y lo que realmente se implementó — importante para no "corregir" algo que en realidad fue una decisión consciente:

1. **Prisma con driver adapters, no el motor por defecto.** La guía original asumía `provider = "prisma-client-js"` simple. El proyecto real usa un generator con `output` custom (cliente generado en `generated/prisma/client`, no en `node_modules/@prisma/client`) más `@prisma/adapter-pg` y un `pg.Pool` explícito en `config/prisma.ts`. Al importar `PrismaClient` en código nuevo, usar la ruta relativa correcta hacia `generated/prisma/client` (verificar cuántos niveles según desde dónde se importe).
3. **Sin autorización por propiedad de recurso en Usuarios** (ver Fase 6 arriba) — es intencional, no un descuido de seguridad.

## Cómo levantar el proyecto (backend)

```
docker compose up -d
cd server
npm install
npx prisma generate
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Probar `GET http://localhost:4000/health` antes de probar cualquier endpoint. Login vía `POST /login` con las credenciales del seed antes de probar cualquier ruta protegida (todas excepto `/login` requieren `authMiddleware`).
