import { z } from "zod";

const productoBase = z.object({
  sku: z.string().min(1),
  nombre: z.string().min(1),
  descripcionCorta: z.string().min(1),
  descripcionLarga: z.string().min(1),
  precioNeto: z.coerce.number().positive(),
  stockActual: z.coerce.number().int().min(0),
  stockMinimo: z.coerce.number().int().min(0),
  stockBajo: z.coerce.number().int().min(0),
  stockAlto: z.coerce.number().int().min(0),
});

export const crearProductoSchema = productoBase.refine(
  (data) => data.stockBajo < data.stockAlto,
  { message: "stockBajo debe ser menor que stockAlto", path: ["stockBajo"] }
);

export const actualizarProductoSchema = productoBase.partial().refine(
  (data) =>
    data.stockBajo === undefined ||
    data.stockAlto === undefined ||
    data.stockBajo < data.stockAlto,
  { message: "stockBajo debe ser menor que stockAlto", path: ["stockBajo"] }
);

export type CrearProductoInput = z.infer<typeof crearProductoSchema>;
export type ActualizarProductoInput = z.infer<typeof actualizarProductoSchema>;