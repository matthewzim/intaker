import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/intaker",
  images: { unoptimized: true },
};

export default nextConfig;
