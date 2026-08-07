import multer from "multer";
import { ApiError } from "../../utils/ApiError";

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

export const uploadSlideImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      cb(ApiError.badRequest("Hanya file gambar (JPG, PNG, WEBP) yang diperbolehkan"));
      return;
    }
    cb(null, true);
  },
}).single("file");
