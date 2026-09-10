import { prisma } from "../config/prisma";
import { hashPassword } from "../utils/hash";
import type { CrearUsuarioInput, ActualizarUsuarioInput } from "../schemas/usuario.schema";

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

export async function crearUsuario(data: CrearUsuarioInput) {
  const passwordHasheada = await hashPassword(data.password);
  return prisma.usuario.create({
    data: { ...data, password: passwordHasheada },
    select: camposPublicos,
  });
}

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