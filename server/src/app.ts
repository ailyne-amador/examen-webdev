import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
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

// Ruta de prueba
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/', webRoutes);

export default app;