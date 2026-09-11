// Controlador del módulo de clientes: recibe HTTP, valida ID y body (Zod),
// y delega la lógica de negocio al service.
import { Request, Response } from "express";
import { Prisma } from "../generated/prisma/client";
import { crearClienteSchema, actualizarClienteSchema } from "../schemas/cliente.schema";
import * as clienteService from "../services/cliente.service";

// GET /clientes → lista completa
export async function listar(_req: Request, res: Response) {
  const clientes = await clienteService.listarClientes();
  res.json(clientes);
}

// GET /clientes/:id → un cliente o 404
export async function obtener(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: "ID inválido" });

  const cliente = await clienteService.obtenerCliente(id);
  if (!cliente) return res.status(404).json({ message: "Cliente no encontrado" });

  res.json(cliente);
}

// POST /clientes → crea y devuelve el cliente (201)
export async function crear(req: Request, res: Response) {
  const parsed = crearClienteSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Datos inválidos", errors: parsed.error.flatten() });
  }

  const cliente = await clienteService.crearCliente(parsed.data);
  res.status(201).json(cliente);
}

// PUT /clientes/:id → actualización parcial (todos los campos opcionales)
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
    // P2025 = Prisma no encontró el registro a actualizar → 404
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }
    throw error;
  }
}

// DELETE /clientes/:id → 204 sin contenido
export async function eliminar(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: "ID inválido" });

  try {
    await clienteService.eliminarCliente(id);
    res.status(204).send();
  } catch (error) {
    // P2025 = Prisma no encontró el registro a eliminar → 404
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }
    throw error;
  }
}
