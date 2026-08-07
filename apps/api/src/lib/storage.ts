import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import { env } from "../config/env";

// Cloudflare R2 (S3-compatible) is the primary storage backend so uploaded
// files survive redeploys — Render's free-tier filesystem is ephemeral and
// wipes local files on every restart. When R2 isn't configured (e.g. local
// dev, where nobody should need R2 credentials just to run the app), this
// falls back to local disk + the existing /uploads static route.
const r2Configured = !!(
  env.r2AccountId &&
  env.r2AccessKeyId &&
  env.r2SecretAccessKey &&
  env.r2Bucket &&
  env.r2PublicUrl
);

const r2Client = r2Configured
  ? new S3Client({
      region: "auto",
      endpoint: `https://${env.r2AccountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId: env.r2AccessKeyId, secretAccessKey: env.r2SecretAccessKey },
    })
  : null;

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

if (!r2Client) {
  if (env.isProduction) {
    // eslint-disable-next-line no-console
    console.warn(
      "[storage] R2_* env vars are not fully set — falling back to local disk. " +
        "Uploaded files WILL be lost on the next deploy/restart until R2 is configured."
    );
  }
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export function isCloudStorageConfigured(): boolean {
  return r2Client !== null;
}

export async function uploadBuffer(
  buffer: Buffer,
  originalName: string,
  contentType: string,
  folder: string
): Promise<string> {
  const key = `${folder}/${crypto.randomBytes(16).toString("hex")}${path.extname(originalName)}`;

  if (r2Client) {
    await r2Client.send(
      new PutObjectCommand({ Bucket: env.r2Bucket, Key: key, Body: buffer, ContentType: contentType })
    );
    return `${env.r2PublicUrl}/${key}`;
  }

  const fileName = key.replace(/\//g, "-");
  await fs.promises.writeFile(path.join(UPLOADS_DIR, fileName), buffer);
  return `/uploads/${fileName}`;
}

export async function deleteByUrl(url: string): Promise<void> {
  if (r2Client && url.startsWith(`${env.r2PublicUrl}/`)) {
    const key = url.slice(env.r2PublicUrl.length + 1);
    await r2Client.send(new DeleteObjectCommand({ Bucket: env.r2Bucket, Key: key }));
    return;
  }
  if (!r2Client && url.startsWith("/uploads/")) {
    await fs.promises.unlink(path.join(UPLOADS_DIR, path.basename(url))).catch(() => {});
  }
}
