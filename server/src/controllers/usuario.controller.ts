// Controlador del módulo de usuarios: recibe HTTP, valida ID y body (Zod),
// y delega la lógica de negocio al service. Misma estructura en los demás controllers.
import { Request, Response } from "express";
import { Prisma } from "../generated/prisma/client";
import { crearUsuarioSchema, actualizarUsuarioSchema } from "../schemas/usuario.schema";
import * as usuarioService from "../services/usuario.service";

// GET /usuarios → lista completa (sin passwords, ver service)
export async function listar(req: Request, res: Response) {
  const usuarios = await usuarioService.listarUsuarios();
  res.json(usuarios);
}

// GET /usuarios/:id → un usuario o 404
export async function obtener(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: "ID inválido" });

  const usuario = await usuarioService.obtenerUsuario(id);
  if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });

  res.json(usuario);
}

// POST /usuarios → crea y devuelve el usuario (201)
export async function crear(req: Request, res: Response) {
  const parsed = crearUsuarioSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Datos inválidos", errors: parsed.error.flatten() });
  }

  const usuario = await usuarioService.crearUsuario(parsed.data);
  res.status(201).json(usuario);
}

// PUT /usuarios/:id → actualización parcial (todos los campos opcionales)
export async function actualizar(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: "ID inválido" });

  const parsed = actualizarUsuarioSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Datos inválidos", errors: parsed.error.flatten() });
  }

  try {
    const usuario = await usuarioService.actualizarUsuario(id, parsed.data);
    res.json(usuario);
  } catch (error) {
    // P2025 = Prisma no encontró el registro a actualizar → 404
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    throw error;
  }
}

// DELETE /usuarios/:id → 204 sin contenido
export async function eliminar(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: "ID inválido" });

  try {
    await usuarioService.eliminarUsuario(id);
    res.status(204).send();
  } catch (error) {
    // P2025 = Prisma no encontró el registro a eliminar → 404
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    throw error;
  }
}
