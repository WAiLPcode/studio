import type { NextConfig } from 'next';

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

// Next.js configuration with Turbopack support
const nextConfig: NextConfig = {
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
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Turbopack configuration
  experimental: {
    // Enable and configure Turbopack
    turbo: {
      // Match the path aliases from tsconfig
      resolveAlias: {
        '@': './src',
      },
    },
    // Additional experimental features for Next.js 15
    optimizePackageImports: ['@radix-ui/react-*', 'lucide-react', 'recharts'],
    // Ensure proper module resolution
    serverComponentsExternalPackages: [],
  },
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `fs` module
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    
    // Improve chunk loading
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        default: false,
        vendors: false,
        commons: {
          name: 'commons',
          chunks: 'all',
          minChunks: 2,
        },
        // Separate React and related libraries into their own chunk
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
          name: 'react',
          chunks: 'all',
          priority: 20,
        },
      },
    };
    
    return config;
  },
};

export default withBundleAnalyzer(nextConfig);
