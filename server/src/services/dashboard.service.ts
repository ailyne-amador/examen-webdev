import { prisma } from "../config/prisma";

export async function obtenerResumen() {
  const [usuarios, productos, clientes] = await Promise.all([
    prisma.usuario.count(),
    prisma.producto.count(),
    prisma.cliente.count(),
  ]);

  return { usuarios, productos, clientes };
}
