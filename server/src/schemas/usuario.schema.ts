// Schemas Zod del módulo de usuarios: validan el body de crear/actualizar.
// Los tipos *Input se infieren del schema, así validación y tipos nunca se desincronizan.
import { z } from "zod";

export const crearUsuarioSchema = z.object({
  rut: z.string().min(1),
  nombre: z.string().min(1),
  apellido: z.string().min(1),
  // Solo correos del dominio corporativo pueden tener acceso al backoffice
  email: z.string().email().endsWith("@ventasfix.cl", {
    message: "El email debe ser del dominio @ventasfix.cl",
  }),
  password: z.string().min(6),
});

// Actualización parcial: mismo schema pero con todos los campos opcionales
export const actualizarUsuarioSchema = crearUsuarioSchema.partial();

export type CrearUsuarioInput = z.infer<typeof crearUsuarioSchema>;
export type ActualizarUsuarioInput = z.infer<typeof actualizarUsuarioSchema>;
