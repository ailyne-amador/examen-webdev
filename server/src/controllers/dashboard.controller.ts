import { Request, Response } from "express";
import * as dashboardService from "../services/dashboard.service";

export async function obtener(_req: Request, res: Response) {
  const resumen = await dashboardService.obtenerResumen();
  res.json(resumen);
}
