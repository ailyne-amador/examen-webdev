// Controlador del dashboard: expone el resumen de conteos para la pantalla principal.
import { Request, Response } from "express";
import * as dashboardService from "../services/dashboard.service";

// GET /dashboard → { usuarios, productos, clientes }
export async function obtener(_req: Request, res: Response) {
  const resumen = await dashboardService.obtenerResumen();
  res.json(resumen);
}
