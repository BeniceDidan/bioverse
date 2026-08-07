import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";
import { ApiError } from "../../utils/ApiError";
import { UPLOADS_DIR } from "../materials/upload.storage";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const unique = crypto.randomBytes(16).toString("hex");
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

export const uploadSlideImage = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(ApiError.badRequest("Hanya file gambar (JPG, PNG, WEBP) yang diperbolehkan"));
      return;
    }
    cb(null, true);
  },
}).single("file");
