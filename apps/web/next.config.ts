import path from 'node:path';
import type { NextConfig } from 'next';

const apiUrl = process.env.API_URL ?? 'http://localhost:4000';

const nextConfig: NextConfig = {
  output: 'standalone',
  // Trace dependencies from the monorepo root so the standalone build includes workspace packages.
  outputFileTracingRoot: path.resolve(process.cwd(), '../..'),
  poweredByHeader: false,
  // The browser only talks to this origin; /api/* (including Better Auth) is proxied to the
  // NestJS API so session cookies stay first-party.
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${apiUrl}/api/:path*` }];
  },
};

export default nextConfig;
