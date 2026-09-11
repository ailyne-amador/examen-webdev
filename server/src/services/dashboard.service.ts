// Service del dashboard: arma el resumen de conteos para la pantalla principal.
import { prisma } from "../config/prisma";

// Los tres conteos se lanzan en paralelo (Promise.all) para no esperar uno por uno
export async function obtenerResumen() {
  const [usuarios, productos, clientes] = await Promise.all([
    prisma.usuario.count(),
    prisma.producto.count(),
    prisma.cliente.count(),
  ]);

  return { usuarios, productos, clientes };
}
