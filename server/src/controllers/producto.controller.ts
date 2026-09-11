// Controlador del módulo de productos: recibe HTTP, valida ID y body (Zod),
// y delega la lógica de negocio al service. A diferencia de los demás módulos,
// crear/actualizar llegan como multipart/form-data por la imagen (upload.middleware),
// por eso el archivo llega en req.file y los campos de texto en req.body.
import { Request, Response } from "express";
import { Prisma } from "../generated/prisma/client";
import { crearProductoSchema, actualizarProductoSchema } from "../schemas/producto.schema";
import * as productoService from "../services/producto.service";

// GET /productos → lista completa (con estadoStock calculado, ver service)
export async function listar(req: Request, res: Response) {
  const productos = await productoService.listarProductos();
  res.json(productos);
}

// GET /productos/:id → un producto o 404
export async function obtener(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: "ID inválido" });

  const producto = await productoService.obtenerProducto(id);
  if (!producto) return res.status(404).json({ message: "Producto no encontrado" });

  res.json(producto);
}

// POST /productos → crea el producto; la imagen es obligatoria
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

// PUT /productos/:id → actualización parcial; la imagen es opcional (solo se reemplaza si llega una nueva)
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
    // P2025 = Prisma no encontró el registro a actualizar → 404
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return res.status(404).json({ message: "Producto no encontrado" });
    }
    throw error;
  }
}

// DELETE /productos/:id → 204 sin contenido
export async function eliminar(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (isNaN(id)) return res.status(400).json({ message: "ID inválido" });

  try {
    await productoService.eliminarProducto(id);
    res.status(204).send();
  } catch (error) {
    // P2025 = Prisma no encontró el registro a eliminar → 404
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return res.status(404).json({ message: "Producto no encontrado" });
    }
    throw error;
  }
}
