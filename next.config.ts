import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Настройки для Socket.IO
  serverExternalPackages: ['socket.io'],
  // Отключаем статическую оптимизацию для API routes с Socket.IO
  output: 'standalone',
  // Настройки для WebSocket
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default nextConfig;
