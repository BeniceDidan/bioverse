/**
 * File URLs from the API are either a full absolute URL (Cloudflare R2 in
 * production) or a legacy relative `/uploads/...` path (local dev fallback,
 * served by the API itself) — resolve either form to something browsers can load.
 */
export function resolveFileUrl(url: string): string {
  if (/^https?:\/\//.test(url)) return url;
  return `${process.env.NEXT_PUBLIC_API_URL}${url}`;
}
