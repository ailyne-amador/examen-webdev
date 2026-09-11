// Controlador de autenticación: login web (cookie httpOnly), logout,
// y emisión de tokens de servicio para la API externa de Softland.
import { timingSafeEqual } from "node:crypto";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../config/prisma";
import { verifyPassword } from "../utils/hash";

// Validación del body del login web
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Validación del body del token de servicio (API externa)
const serviceTokenSchema = z.object({
  client_id: z.string().min(1),
  client_secret: z.string().min(1),
});

// Compara secretos en tiempo constante para evitar ataques de timing.
// timingSafeEqual exige buffers del mismo largo, por eso se compara el largo antes.
function secretMatches(received: string, expected: string | undefined) {
  if (!expected) return false;
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return receivedBuffer.length === expectedBuffer.length
    && timingSafeEqual(receivedBuffer, expectedBuffer);
}

// Login web: valida credenciales y deja el JWT en una cookie httpOnly
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
    // Mismo mensaje que para email inexistente: no revelar si el correo está registrado
    return res.status(401).json({ message: "Credenciales inválidas" });
  }

  // JWT con la identidad mínima del usuario, válido por 8 horas
  const token = jwt.sign(
    { id: usuario.id, email: usuario.email },
    process.env.JWT_SECRET!,
    { expiresIn: "8h" }
  );

  // Cookie httpOnly: el JavaScript del navegador no puede leerla (mitiga XSS)
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
  });

  return res.json({
    message: "Login exitoso",
    usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email },
  });
}

// Cierra la sesión borrando la cookie
export function logout(_req: Request, res: Response) {
  res.clearCookie('token', { httpOnly: true, sameSite: 'lax' });
  return res.status(204).send();
}

// Token de servicio para la API externa (OAuth2 client credentials simplificado):
// valida client_id/secret contra las variables de entorno y devuelve un Bearer token
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

  // expires_in en segundos (28800 = 8 horas), siguiendo la convención OAuth2
  return res.json({ access_token: accessToken, token_type: "Bearer", expires_in: 28800 });
}
