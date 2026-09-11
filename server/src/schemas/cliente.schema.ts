// Schemas Zod del módulo de clientes: validan el body de crear/actualizar.
import { z } from "zod";

// Campos base del cliente; todos obligatorios al crear
const clienteBase = z.object({
  rutEmpresa: z.string().min(1),
  rubro: z.string().min(1),
  razonSocial: z.string().min(1),
  telefono: z.string().min(1),
  direccion: z.string().min(1),
  nombreContacto: z.string().min(1),
  emailContacto: z.string().email(),
});

export const crearClienteSchema = clienteBase;
// Actualización parcial: mismo schema pero con todos los campos opcionales
export const actualizarClienteSchema = clienteBase.partial();

export type CrearClienteInput = z.infer<typeof crearClienteSchema>;
export type ActualizarClienteInput = z.infer<typeof actualizarClienteSchema>;
