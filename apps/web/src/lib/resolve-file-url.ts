/**
 * Resolves a file URL as stored by the API into something a browser can load.
 *
 * Current uploads are stored as `/api/files/<key>` and deliberately left
 * relative: the browser then fetches them from this app's own origin, which
 * rewrites `/api/*` to the API (see next.config.ts). That matters beyond
 * tidiness — Indonesian ISPs DNS-block Cloudflare's `r2.dev` hostname, so a
 * link pointing straight at the bucket is dead for the students this app is
 * built for.
 *
 * The other two shapes are legacy rows: an absolute R2 URL from before files
 * were routed through the app, and a `/uploads/...` path served by the API
 * itself during local-disk fallback.
 */
export function resolveFileUrl(url: string): string {
  if (/^https?:\/\//.test(url)) return url;
  if (url.startsWith("/api/")) return url;
  return `${process.env.NEXT_PUBLIC_API_URL ?? ""}${url}`;
}
