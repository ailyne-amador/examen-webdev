// Service de usuarios: acceso a datos (Prisma) más dos reglas de negocio:
// nunca exponer el hash de la password y hashearla antes de guardarla.
import { prisma } from "../config/prisma";
import { hashPassword } from "../utils/hash";
import type { CrearUsuarioInput, ActualizarUsuarioInput } from "../schemas/usuario.schema";

// Campos que se devuelven al cliente: la password jamás sale de la API
const camposPublicos = {
  id: true,
  rut: true,
  nombre: true,
  apellido: true,
  email: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function listarUsuarios() {
  return prisma.usuario.findMany({ select: camposPublicos });
}

export async function obtenerUsuario(id: number) {
  return prisma.usuario.findUnique({ where: { id }, select: camposPublicos });
}

// La password se hashea antes de persistir; nunca se guarda en texto plano
export async function crearUsuario(data: CrearUsuarioInput) {
  const passwordHasheada = await hashPassword(data.password);
  return prisma.usuario.create({
    data: { ...data, password: passwordHasheada },
    select: camposPublicos,
  });
}

// Actualización parcial: solo se re-hashea si llegó una password nueva
export async function actualizarUsuario(id: number, data: ActualizarUsuarioInput) {
  const payload = { ...data };
  if (payload.password) {
    payload.password = await hashPassword(payload.password);
  }
  return prisma.usuario.update({
    where: { id },
    data: payload,
    select: camposPublicos,
  });
}

export async function eliminarUsuario(id: number) {
  return prisma.usuario.delete({ where: { id } });
}
