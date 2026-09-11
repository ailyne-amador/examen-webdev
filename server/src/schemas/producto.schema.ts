// Schemas Zod del módulo de productos: validan el body de crear/actualizar.
// Ojo: estos endpoints llegan como multipart/form-data, donde todo es texto,
// por eso los números usan z.coerce (convierte el string recibido a número).
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

// Regla de negocio: el umbral de stock bajo debe ser menor que el de stock alto
export const crearProductoSchema = productoBase.refine(
  (data) => data.stockBajo < data.stockAlto,
  { message: "stockBajo debe ser menor que stockAlto", path: ["stockBajo"] }
);

// Actualización parcial: campos opcionales, y la regla de umbrales solo se
// verifica cuando llegan ambos valores (si llega uno solo no se puede comparar)
export const actualizarProductoSchema = productoBase.partial().refine(
  (data) =>
    data.stockBajo === undefined ||
    data.stockAlto === undefined ||
    data.stockBajo < data.stockAlto,
  { message: "stockBajo debe ser menor que stockAlto", path: ["stockBajo"] }
);

export type CrearProductoInput = z.infer<typeof crearProductoSchema>;
export type ActualizarProductoInput = z.infer<typeof actualizarProductoSchema>;
