// prisma/seed.ts
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import argon2 from "argon2";

// Configuración del pool de conexiones con tu DATABASE_URL
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Instanciación pasando el adapter obligatorio
const prisma = new PrismaClient({ adapter });

async function main() {
  // --- Usuario admin ---
  const passwordHasheada = await argon2.hash('Admin123!');

  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@ventasfix.cl' },
    update: {},
    create: {
      rut: '11111111-1',
      nombre: 'Admin',
      apellido: 'VentasFix',
      email: 'admin@ventasfix.cl',
      password: passwordHasheada,
    },
  });

  console.log('Usuario admin creado/verificado:', admin.email);

  // --- Cliente de ejemplo ---
  const cliente = await prisma.cliente.upsert({
    where: { rutEmpresa: '76543210-1' },
    update: {},
    create: {
      rutEmpresa: '76543210-1',
      rubro: 'Retail',
      razonSocial: 'Comercial Ejemplo SpA',
      telefono: '+56912345678',
      direccion: 'Av. Siempre Viva 123, Santiago',
      nombreContacto: 'Juan Pérez',
      emailContacto: 'juan.perez@ejemplo.cl',
    },
  });

  console.log('Cliente creado/verificado:', cliente.razonSocial);

  // --- Producto de ejemplo ---
  const precioNeto = 10000;
  const IVA = 0.19;

  const producto = await prisma.producto.upsert({
    where: { sku: 'PROD-001' },
    update: {},
    create: {
      sku: 'PROD-001',
      nombre: 'Producto de prueba',
      descripcionCorta: 'Descripción corta de prueba',
      descripcionLarga: 'Descripción larga de prueba para el producto inicial del seed.',
      imagenUrl: 'https://ejemplo.cl/imagen.jpg',
      precioNeto: precioNeto,
      precioVenta: precioNeto * (1 + IVA),
      stockActual: 50,
      stockMinimo: 10,
      stockBajo: 5,
      stockAlto: 100,
    },
  });

  console.log('Producto creado/verificado:', producto.sku);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });