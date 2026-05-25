import multer from "multer";
import path from "path";
import fs from "fs";
import { AuthRequest } from "./auth.js";

const uploadsDir = path.join(process.cwd(), "uploads", "avatars");
fs.mkdirSync(uploadsDir, { recursive: true });

export function createAvatarUpload(role: "broker" | "user") {
  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
      const authReq = req as AuthRequest;
      const id =
        role === "broker"
          ? authReq.user?.brokerId ?? "unknown"
          : authReq.user?.loginId ?? "unknown";
      const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
      const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext) ? ext : ".jpg";
      cb(null, `${role}-${id}-${Date.now()}${safeExt}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: 3 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
      if (!file.mimetype.startsWith("image/")) {
        cb(new Error("Only image files are allowed"));
        return;
      }
      cb(null, true);
    },
  }).single("photo");
}

export function photoPublicPath(filename: string): string {
  return `/uploads/avatars/${filename}`;
}
