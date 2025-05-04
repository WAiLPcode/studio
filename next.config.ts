// Performance optimization plugins
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

// TypeScript configuration
/** @type {import('next').NextConfig} */

// const { Configuration: WebpackConfiguration } = require('webpack');
import type { Configuration } from 'webpack';
// Optional: Import the { TypeScriptBuilderPlugin } type if used as a plugin or for specific configurations.
// const { isServer } = require('next/dist/lib/is-server');


// Next.js configuration with performance optimizations
const nextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Optimize image loading
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
    // Improve image optimization
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  // Improved caching for faster page loads
  onDemandEntries: {
    // Keep pages in memory for faster development experience
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 5,
  },
  // Turbopack and experimental configuration
  experimental: {
      turbo: {
      // Match the path aliases from tsconfig
      resolveAlias: {
        '@': './src',
      },
    },
    // Additional experimental features for Next.js 15
    optimizePackageImports: ['@radix-ui/react-*', 'lucide-react', 'recharts', '@tanstack/react-query', 'date-fns', 'zod'],
    // Enable server actions for better performance
    serverActions: true,
     serverExternalPackages: [],
     // Enable partial prerendering for faster initial loads - requires canary
  },
  // Configure page performance
  poweredByHeader: false,
  reactStrictMode: true,
   // Use SWC minifier for better performance,
  compiler: {
    reactRemoveProperties: process.env.NODE_ENV === 'production',
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  webpack: (config: Configuration, { isServer }: { isServer: boolean }) => {
    // Ensure config.resolve and config.resolve.fallback exist
    config.resolve = config.resolve || {};
    config.resolve.fallback = config.resolve.fallback || {};
    
    // Fixes npm packages that depend on `fs` module
    if (!isServer) {
      // Assert fallback is an indexable type
      (config.resolve.fallback as { [key: string]: any })['fs'] = false;
    }
    
    // Ensure config.optimization exists
    config.optimization = config.optimization || {};
    
    // Advanced code splitting and bundle optimization
    config.optimization.splitChunks = {
      chunks: 'all',
      maxInitialRequests: 25,
      minSize: 20000,
      cacheGroups: {
        default: false,
        vendors: false,
        // Common chunks
        commons: {
          name: 'commons',
          chunks: 'all',
          minChunks: 2,
          priority: 10,
          reuseExistingChunk: true,
        },
        // Separate React and related libraries
        react: {
          test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
          name: 'react',
          chunks: 'all',
          priority: 20,
          reuseExistingChunk: true,
        },
        // UI components library chunks
        radix: {
          test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
          name: 'radix-ui',
          chunks: 'all',
          priority: 15,
          reuseExistingChunk: true,
        },
        // Data handling libraries
        data: {
          test: /[\\/]node_modules[\\/](@tanstack|recharts|date-fns|zod)[\\/]/,
          name: 'data-libs',
          chunks: 'all',
          priority: 15,
          reuseExistingChunk: true,
        },
        // Dynamic imports for heavy components
        heavyComponents: {
          test: /[\\/]components[\\/](ui|layout|job-card|post-job-form)[\\/]/,
          name: 'heavy-components',
          chunks: 'all',
          priority: 25,
          reuseExistingChunk: true,
        },
      },
    };
    
    // Enable module concatenation for better tree-shaking
    config.optimization.concatenateModules = true;
    
    // Add terser for better minification
    if (!isServer && config.mode === 'production') {
      config.optimization.minimize = true;
    }
    
    return config;
  },
};

// Apply optimizations
module.exports = withBundleAnalyzer(nextConfig);
