import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import type { Readable } from "node:stream";
import { env } from "../config/env";

// Cloudflare R2 (S3-compatible) is the primary storage backend so uploaded
// files survive redeploys — Render's free-tier filesystem is ephemeral and
// wipes local files on every restart. When R2 isn't configured (e.g. local
// dev, where nobody should need R2 credentials just to run the app), this
// falls back to local disk + the existing /uploads static route.
//
// Stored URLs are always the app-relative `/api/files/<key>` — never R2's
// own public hostname. Two reasons, both learned the hard way:
//   1. Indonesian ISPs DNS-block `*.r2.dev` outright, so links pointing
//      there are dead for exactly the students this app serves, even though
//      the upload itself succeeds server-side.
//   2. An absolute URL baked into the database is a migration hazard — it
//      pins every stored row to one bucket hostname forever.
// Serving through the app's own origin sidesteps both: if a student can
// load the site, they can load its files.
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

/** Prefix of every stored file URL. Kept in one place — it is persisted into
 * the database, so it must stay stable. */
export const FILES_ROUTE = "/api/files";

if (!r2Client) {
  if (env.isProduction) {
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
    return `${FILES_ROUTE}/${key}`;
  }

  await fs.promises.writeFile(path.join(UPLOADS_DIR, keyToFileName(key)), buffer);
  return `${FILES_ROUTE}/${key}`;
}

export interface StoredObject {
  stream: Readable;
  contentType?: string;
  contentLength?: number;
}

/** Reads an object back for `/api/files/:key` to stream to the client. */
export async function getObjectByKey(key: string): Promise<StoredObject | null> {
  if (r2Client) {
    try {
      const out = await r2Client.send(new GetObjectCommand({ Bucket: env.r2Bucket, Key: key }));
      if (!out.Body) return null;
      return {
        stream: out.Body as Readable,
        contentType: out.ContentType,
        contentLength: out.ContentLength,
      };
    } catch {
      return null;
    }
  }

  const filePath = path.join(UPLOADS_DIR, keyToFileName(key));
  const stat = await fs.promises.stat(filePath).catch(() => null);
  if (!stat?.isFile()) return null;
  return { stream: fs.createReadStream(filePath), contentLength: stat.size };
}

export async function deleteByUrl(url: string): Promise<void> {
  const key = keyFromUrl(url);
  if (!key) return;

  if (r2Client) {
    await r2Client.send(new DeleteObjectCommand({ Bucket: env.r2Bucket, Key: key }));
    return;
  }
  await fs.promises.unlink(path.join(UPLOADS_DIR, keyToFileName(key))).catch(() => {});
}

/**
 * Recovers the storage key from a stored URL. Handles the current
 * `/api/files/<key>` form plus the two legacy shapes still sitting in older
 * rows: R2's absolute public URL, and the `/uploads/<flattened-name>` path
 * from before uploads were routed through the app.
 */
function keyFromUrl(url: string): string | null {
  if (url.startsWith(`${FILES_ROUTE}/`)) return url.slice(FILES_ROUTE.length + 1);
  if (env.r2PublicUrl && url.startsWith(`${env.r2PublicUrl}/`)) return url.slice(env.r2PublicUrl.length + 1);
  if (url.startsWith("/uploads/")) return path.basename(url);
  return null;
}

/** Local disk is flat, so `folder/name.ext` is stored as `folder-name.ext`. */
function keyToFileName(key: string): string {
  return key.replace(/\//g, "-");
}
