import { timingSafeEqual } from "node:crypto";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { verifyPassword } from "../utils/hash";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const serviceTokenSchema = z.object({
  client_id: z.string().min(1),
  client_secret: z.string().min(1),
});

function secretMatches(received: string, expected: string | undefined) {
  if (!expected) return false;
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return receivedBuffer.length === expectedBuffer.length
    && timingSafeEqual(receivedBuffer, expectedBuffer);
}

export async function login(req: Request, res: Response) {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Datos inválidos" });
  }

  const { email, password } = parsed.data;

  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario) {
    return res.status(401).json({ message: "Credenciales inválidas" });
  }

  const passwordValida = await verifyPassword(usuario.password, password);
  if (!passwordValida) {
    return res.status(401).json({ message: "Credenciales inválidas" });
  }

  const token = jwt.sign(
    { id: usuario.id, email: usuario.email },
    process.env.JWT_SECRET!,
    { expiresIn: "8h" }
  );

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
  });

  return res.json({
    message: "Login exitoso",
    usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email },
  });
}

export function serviceToken(req: Request, res: Response) {
  const parsed = serviceTokenSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: "Datos inválidos" });
  }

  const { client_id, client_secret } = parsed.data;
  if (client_id !== process.env.SOFTLAND_CLIENT_ID
    || !secretMatches(client_secret, process.env.SOFTLAND_CLIENT_SECRET)) {
    return res.status(401).json({ message: "Credenciales inválidas" });
  }

  const accessToken = jwt.sign(
    { client_id },
    process.env.JWT_SECRET!,
    { expiresIn: "8h" }
  );

  return res.json({ access_token: accessToken, token_type: "Bearer", expires_in: 28800 });
}