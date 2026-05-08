import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Vercel Blob (legacy/fallback)
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      // Cloudflare R2 — public bucket via r2.dev
      { protocol: "https", hostname: "*.r2.dev" },
      // Cloudflare R2 — custom domain via files.chatufo.space (or similar).
      { protocol: "https", hostname: "files.chatufo.space" },
      { protocol: "https", hostname: "*.chatufo.space" },
    ],
  },
  serverExternalPackages: ["unpdf", "sharp"],
};

export default nextConfig;
