import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const isDev = process.env.NODE_ENV === 'development'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep dev and production artifacts isolated so `next build` cannot break an active `next dev` session.
  distDir: isDev ? '.next-dev' : '.next',
  outputFileTracingRoot: __dirname,
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // Fix for libraries that use fs in the browser
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        stream: false,
        crypto: false,
      };
    }
    
    return config;
  },
}

export default nextConfig
