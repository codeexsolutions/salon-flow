import type { Metadata } from 'next';

/**
 * PAINEL DO SALÃO (dono e recepção).
 * - (painel)/    telas com menu lateral; exigem um salão ativo
 * - novo-salao/  cadastro do primeiro salão
 */
export const metadata: Metadata = {
  title: { default: 'Painel', template: '%s · Painel SalonFlow' },
  manifest: '/manifests/admin.webmanifest',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 flex-col">{children}</div>;
}
