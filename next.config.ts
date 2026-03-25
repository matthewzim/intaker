import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Allow larger payloads for file uploads (App Router handles this natively)
  experimental: {},
}

export default nextConfig
