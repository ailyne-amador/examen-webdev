import { z } from "zod";

export const crearUsuarioSchema = z.object({
  rut: z.string().min(1),
  nombre: z.string().min(1),
  apellido: z.string().min(1),
  email: z.string().email().endsWith("@ventasfix.cl", {
    message: "El email debe ser del dominio @ventasfix.cl",
  }),
  password: z.string().min(6),
});

export const actualizarUsuarioSchema = crearUsuarioSchema.partial();

export type CrearUsuarioInput = z.infer<typeof crearUsuarioSchema>;
export type ActualizarUsuarioInput = z.infer<typeof actualizarUsuarioSchema>;