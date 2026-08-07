import type { NextConfig } from "next";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  // Proxy API calls through this app's own origin instead of hitting the
  // API domain directly from the browser. This makes the API's session and
  // CSRF cookies first-party from the browser's point of view, which is
  // required for them to survive in browsers that block third-party
  // cookies outright (Safari does this unconditionally).
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
  // Vercel caches external-rewrite responses that carry cache headers by
  // default — never acceptable for an API that returns per-user/session
  // data, so this is disabled explicitly rather than relying on the API
  // to always remember to send no-store.
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [{ key: "x-vercel-enable-rewrite-caching", value: "0" }],
      },
    ];
  },
};

export default nextConfig;
