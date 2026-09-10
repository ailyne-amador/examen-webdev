import { Request, Response } from "express";
import { Prisma } from "../generated/prisma/client";
import { crearUsuarioSchema, actualizarUsuarioSchema } from "../schemas/usuario.schema";
import * as usuarioService from "../services/usuario.service";

export async function listar(req: Request, res: Response) {
  const usuarios = await usuarioService.listarUsuarios();
  res.json(usuarios);
}

export async function obtener(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: "ID inválido" });

  const usuario = await usuarioService.obtenerUsuario(id);
  if (!usuario) return res.status(404).json({ message: "Usuario no encontrado" });

  res.json(usuario);
}

export async function crear(req: Request, res: Response) {
  const parsed = crearUsuarioSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Datos inválidos", errors: parsed.error.flatten() });
  }

  const usuario = await usuarioService.crearUsuario(parsed.data);
  res.status(201).json(usuario);
}

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
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    throw error;
  }
}

export async function eliminar(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: "ID inválido" });

  try {
    await usuarioService.eliminarUsuario(id);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    throw error;
  }
}