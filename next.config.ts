import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Public Vercel Blob URLs — page images live here.
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  // unpdf relies on a wasm runtime; serverside only.
  serverExternalPackages: ["unpdf", "sharp"],
};

export default nextConfig;
