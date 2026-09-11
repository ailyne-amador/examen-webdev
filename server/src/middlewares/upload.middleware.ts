// Middleware de subida de archivos (multer) para la imagen de los productos.
// Guarda en disco con nombre UUID, acepta solo imágenes y limita el tamaño a 5 MB.
import multer from "multer";
import path from "node:path";
import { mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";

// Carpeta destino dentro del proyecto; se crea al arrancar si no existe
const uploadDir = path.join(process.cwd(), "uploads");
mkdirSync(uploadDir, { recursive: true });

export const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    // Nombre aleatorio para evitar colisiones entre archivos con el mismo nombre original
    filename: (_req, file, callback) => {
      callback(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`);
    },
  }),
  // Rechaza cualquier archivo que no sea una imagen
  fileFilter: (_req, file, callback) => {
    if (!file.mimetype.startsWith("image/")) {
      return callback(new Error("Solo se permiten imágenes"));
    }
    callback(null, true);
  },
  // Límite de 5 MB por archivo
  limits: { fileSize: 5 * 1024 * 1024 },
});
