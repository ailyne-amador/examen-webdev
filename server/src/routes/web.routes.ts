// Rutas del backoffice web (frontend React).
// La sesión se maneja con cookie httpOnly (ver auth.controller) y todas las rutas,
// excepto login/logout, pasan por authMiddleware que exige sesión activa.
import { Router } from "express";
import { login, logout } from "../controllers/auth.controller";
import * as usuarioController from "../controllers/usuario.controller";
import * as productoController from "../controllers/producto.controller";
import * as clienteController from "../controllers/cliente.controller";
import * as dashboardController from "../controllers/dashboard.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { upload } from "../middlewares/upload.middleware";

const router = Router();

// Autenticación: login y logout son públicos
router.post("/login", login);
router.post("/logout", logout);

// Resumen con conteos de usuarios, productos y clientes
router.get("/dashboard", authMiddleware, dashboardController.obtener);

// CRUD de usuarios del backoffice
router.get("/usuarios", authMiddleware, usuarioController.listar);
router.get("/usuarios/:id", authMiddleware, usuarioController.obtener);
router.post("/usuarios", authMiddleware, usuarioController.crear);
router.put("/usuarios/:id", authMiddleware, usuarioController.actualizar);
router.delete("/usuarios/:id", authMiddleware, usuarioController.eliminar);

// CRUD de productos: crear y actualizar aceptan una imagen (multipart/form-data)
router.get("/productos", authMiddleware, productoController.listar);
router.get("/productos/:id", authMiddleware, productoController.obtener);
router.post("/productos", authMiddleware, upload.single("imagen"), productoController.crear);
router.put("/productos/:id", authMiddleware, upload.single("imagen"), productoController.actualizar);
router.delete("/productos/:id", authMiddleware, productoController.eliminar);

// CRUD de clientes (cartera comercial)
router.get("/clientes", authMiddleware, clienteController.listar);
router.get("/clientes/:id", authMiddleware, clienteController.obtener);
router.post("/clientes", authMiddleware, clienteController.crear);
router.put("/clientes/:id", authMiddleware, clienteController.actualizar);
router.delete("/clientes/:id", authMiddleware, clienteController.eliminar);

export default router;
