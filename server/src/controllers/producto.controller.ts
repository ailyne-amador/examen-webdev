import { Request, Response } from "express";
import { Prisma } from "../generated/prisma/client";
import { crearProductoSchema, actualizarProductoSchema } from "../schemas/producto.schema";
import * as productoService from "../services/producto.service";

export async function listar(req: Request, res: Response) {
  const productos = await productoService.listarProductos();
  res.json(productos);
}

export async function obtener(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: "ID inválido" });

  const producto = await productoService.obtenerProducto(id);
  if (!producto) return res.status(404).json({ message: "Producto no encontrado" });

  res.json(producto);
}

export async function crear(req: Request, res: Response) {
  if (!req.file) {
    return res.status(400).json({ message: "La imagen del producto es obligatoria" });
  }

  const parsed = crearProductoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Datos inválidos", errors: parsed.error.flatten() });
  }

  const producto = await productoService.crearProducto(parsed.data, req.file.filename);
  res.status(201).json(producto);
}

export async function actualizar(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: "ID inválido" });

  const parsed = actualizarProductoSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Datos inválidos", errors: parsed.error.flatten() });
  }

  try {
    const producto = await productoService.actualizarProducto(id, parsed.data, req.file?.filename);
    res.json(producto);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return res.status(404).json({ message: "Producto no encontrado" });
    }
    throw error;
  }
}

export async function eliminar(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: "ID inválido" });

  try {
    await productoService.eliminarProducto(id);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return res.status(404).json({ message: "Producto no encontrado" });
    }
    throw error;
  }
}