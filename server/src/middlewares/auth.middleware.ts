// Middleware de autenticación: protege todas las rutas privadas verificando el JWT.
// Acepta dos orígenes del token: header "Authorization: Bearer" (API externa Softland)
// o cookie httpOnly "token" (sesión del backoffice web).
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  // Prioriza el Bearer token; si no viene, busca la cookie de sesión
  const token = header?.startsWith("Bearer ") ? header.split(" ")[1] : req.cookies?.token;

  if (!token) return res.status(401).json({ message: "No autenticado" });

  try {
    // Adjunta el payload del token (id/email o client_id) a res.locals
    res.locals.user = jwt.verify(token, process.env.JWT_SECRET!);
    next();
  } catch {
    return res.status(401).json({ message: "Token inválido o expirado" });
  }
}
