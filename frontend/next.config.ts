import type { NextConfig } from "next";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const backendOrigin = process.env.NEXT_PUBLIC_BACKEND_ORIGIN || "http://localhost:5000";
const projectRoot = dirname(fileURLToPath(import.meta.url));
type MiddlewareClientMaxBodySize = NonNullable<
  NonNullable<NextConfig["experimental"]>["proxyClientMaxBodySize"]
>;

const nextConfig: NextConfig = {
  experimental: {
    proxyClientMaxBodySize: (
      process.env.NEXT_UPLOAD_MAX_BODY_SIZE || "1024mb"
    ) as MiddlewareClientMaxBodySize,
  },
  turbopack: {
    root: projectRoot,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendOrigin}/api/:path*`,
      },
      {
        source: "/socket.io/:path*",
        destination: `${backendOrigin}/socket.io/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh4.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh5.googleusercontent.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "lh6.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
  allowedDevOrigins: ["192.168.179.1"],
};

export default nextConfig;
