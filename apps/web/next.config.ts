import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Desenvolvimento: permite abrir o app pelo celular na rede local (ex.: http://192.168.x.x:3000).
  allowedDevOrigins: ['192.168.*.*', '10.*.*.*'],
};

export default nextConfig;
