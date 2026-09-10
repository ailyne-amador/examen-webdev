import { Request, Response } from "express";
import { Prisma } from "../generated/prisma/client";
import { crearClienteSchema, actualizarClienteSchema } from "../schemas/cliente.schema";
import * as clienteService from "../services/cliente.service";

export async function listar(_req: Request, res: Response) {
  const clientes = await clienteService.listarClientes();
  res.json(clientes);
}

export async function obtener(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: "ID inválido" });

  const cliente = await clienteService.obtenerCliente(id);
  if (!cliente) return res.status(404).json({ message: "Cliente no encontrado" });

  res.json(cliente);
}

export async function crear(req: Request, res: Response) {
  const parsed = crearClienteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Datos inválidos", errors: parsed.error.flatten() });
  }

  const cliente = await clienteService.crearCliente(parsed.data);
  res.status(201).json(cliente);
}

export async function actualizar(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: "ID inválido" });

  const parsed = actualizarClienteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Datos inválidos", errors: parsed.error.flatten() });
  }

  try {
    const cliente = await clienteService.actualizarCliente(id, parsed.data);
    res.json(cliente);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }
    throw error;
  }
}

export async function eliminar(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: "ID inválido" });

  try {
    await clienteService.eliminarCliente(id);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }
    throw error;
  }
}
