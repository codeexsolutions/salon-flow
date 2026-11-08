import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Identifica o deploy: o navegador compara com /versao e avisa quando sai versão nova.
  env: {
    NEXT_PUBLIC_VERSAO:
      process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.VERCEL_DEPLOYMENT_ID ?? 'dev',
  },

  // Desenvolvimento: permite abrir o app pelo celular na rede local (ex.: http://192.168.x.x:3000).
  allowedDevOrigins: ['192.168.*.*', '10.*.*.*'],

  async headers() {
    return [
      {
        // Service worker sempre atualizado (sem cache) e restrito à mesma origem.
        source: '/sw.js',
        headers: [
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
