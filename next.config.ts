import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // output: 'export', // Commented out to support API routes
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Environment variables are automatically available for NEXT_PUBLIC_ prefixed vars
  // No need to explicitly define them in Next.js 13+
};

export default nextConfig;