import multer from "multer";
import { ApiError } from "../../utils/ApiError";

export const uploadPdf = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      cb(ApiError.badRequest("Hanya file PDF yang diperbolehkan"));
      return;
    }
    cb(null, true);
  },
}).single("file");
