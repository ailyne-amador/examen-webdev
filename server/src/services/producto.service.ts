import { prisma } from "../config/prisma";
import type { CrearProductoInput, ActualizarProductoInput } from "../schemas/producto.schema";

type EstadoStock = "bajo" | "normal" | "alto";

function calcularPrecioVenta(precioNeto: number): number {
  const conIva = precioNeto * 1.19; // IVA 19%
  return Math.round(conIva * 100) / 100;
}

function calcularEstadoStock(stockActual: number, stockBajo: number, stockAlto: number): EstadoStock {
  if (stockActual <= stockBajo) return "bajo";
  if (stockActual >= stockAlto) return "alto";
  return "normal";
}

function conEstadoStock<T extends { stockActual: number; stockBajo: number; stockAlto: number }>(producto: T) {
  return {
    ...producto,
    estadoStock: calcularEstadoStock(producto.stockActual, producto.stockBajo, producto.stockAlto),
  };
}

export async function listarProductos() {
  const productos = await prisma.producto.findMany();
  return productos.map(conEstadoStock);
}

export async function obtenerProducto(id: number) {
  const producto = await prisma.producto.findUnique({ where: { id } });
  if (!producto) return null;
  return conEstadoStock(producto);
}

export async function crearProducto(data: CrearProductoInput, nombreArchivo: string) {
  const producto = await prisma.producto.create({
    data: {
      ...data,
      precioVenta: calcularPrecioVenta(data.precioNeto),
      imagenUrl: `/uploads/${nombreArchivo}`,
    },
  });
  return conEstadoStock(producto);
}

export async function actualizarProducto(id: number, data: ActualizarProductoInput, nombreArchivo?: string) {
  const payload: any = { ...data };

  if (data.precioNeto !== undefined) {
    payload.precioVenta = calcularPrecioVenta(data.precioNeto);
  }
  if (nombreArchivo) {
    payload.imagenUrl = `/uploads/${nombreArchivo}`;
  }

  const producto = await prisma.producto.update({ where: { id }, data: payload });
  return conEstadoStock(producto);
}

export async function eliminarProducto(id: number) {
  return prisma.producto.delete({ where: { id } });
}