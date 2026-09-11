// Service de productos: acceso a datos (Prisma) más los campos calculados
// precioVenta (neto + IVA) y estadoStock (según umbrales), que no se guardan
// en la base: se calculan cada vez que se devuelve un producto.
import { prisma } from "../config/prisma";
import type { CrearProductoInput, ActualizarProductoInput } from "../schemas/producto.schema";

type EstadoStock = "bajo" | "normal" | "alto";

// Precio de venta = neto + IVA 19%, redondeado a 2 decimales
function calcularPrecioVenta(precioNeto: number): number {
  const conIva = precioNeto * 1.19; // IVA 19%
  return Math.round(conIva * 100) / 100;
}

// Estado del stock comparando el actual con los umbrales configurados
function calcularEstadoStock(stockActual: number, stockBajo: number, stockAlto: number): EstadoStock {
  if (stockActual <= stockBajo) return "bajo";
  if (stockActual >= stockAlto) return "alto";
  return "normal";
}

// Agrega el campo calculado estadoStock a un producto de la base
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

// nombreArchivo es el nombre UUID que multer dio a la imagen subida
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

// Actualización parcial: recalcula precioVenta solo si cambió el precioNeto
// y reemplaza la imagen solo si se subió una nueva
export async function actualizarProducto(id: number, data: ActualizarProductoInput, nombreArchivo?: string) {
  const payload: ActualizarProductoInput & { precioVenta?: number; imagenUrl?: string } = { ...data };

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
