import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static HTML export -> `out/` (deployed as a Render Static Site).
  output: "export",
  images: {
    // The default image optimizer needs a running server, which a static
    // export doesn't have. Remote images are already sized/webp from their CDN.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "lemansclassic.richardmille.com",
      },
    ],
  },
};

export default nextConfig;