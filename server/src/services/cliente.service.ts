import { prisma } from "../config/prisma";
import type { CrearClienteInput, ActualizarClienteInput } from "../schemas/cliente.schema";

export async function listarClientes() {
  return prisma.cliente.findMany();
}

export async function obtenerCliente(id: number) {
  return prisma.cliente.findUnique({ where: { id } });
}

export async function crearCliente(data: CrearClienteInput) {
  return prisma.cliente.create({ data });
}

export async function actualizarCliente(id: number, data: ActualizarClienteInput) {
  return prisma.cliente.update({ where: { id }, data });
}

export async function eliminarCliente(id: number) {
  return prisma.cliente.delete({ where: { id } });
}
