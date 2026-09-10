import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'node:path';
import multer from 'multer';
import { NextFunction, Request, Response } from 'express';
import externalRoutes from './routes/external.routes';
import webRoutes from './routes/web.routes';
const app = express();

// CORS: ajustá el origin a tu frontend real
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true, // necesario si vas a mandar cookies entre dominios
  })
);

app.use(express.json());
app.use(cookieParser());

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Ruta de prueba
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/v1', externalRoutes);
app.use('/', webRoutes);

app.use((error: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (error instanceof multer.MulterError) {
    const message = error.code === 'LIMIT_FILE_SIZE'
      ? 'La imagen no puede superar 5 MB'
      : error.code === 'LIMIT_UNEXPECTED_FILE'
        ? 'El campo del archivo debe llamarse "imagen"'
        : 'Error al cargar la imagen';
    return res.status(400).json({ message });
  }

  if (error instanceof Error && error.message === 'Solo se permiten imágenes') {
    return res.status(400).json({ message: error.message });
  }

  next(error);
});

export default app;