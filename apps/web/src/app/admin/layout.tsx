import type { Metadata } from 'next';
import Link from 'next/link';

/** PAINEL DO SALÃO (dono e recepção) — pensado para desktop/tablet. */
export const metadata: Metadata = {
  title: { default: 'Painel', template: '%s · Painel SalonFlow' },
  manifest: '/manifests/admin.webmanifest',
};

const menu = [
  { rotulo: 'Início', href: '/admin' },
  { rotulo: 'Agenda' },
  { rotulo: 'Comandas' },
  { rotulo: 'Clientes' },
  { rotulo: 'Profissionais' },
  { rotulo: 'Serviços' },
  { rotulo: 'Estoque' },
  { rotulo: 'Comissões' },
  { rotulo: 'Financeiro' },
  { rotulo: 'Configurações' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1">
      <aside className="hidden w-56 shrink-0 border-r border-borda p-4 md:block">
        <p className="mb-6 text-lg font-bold text-primaria">SalonFlow</p>
        <nav className="flex flex-col gap-1 text-sm">
          {menu.map((item) =>
            item.href ? (
              <Link key={item.rotulo} href={item.href} className="rounded-md px-3 py-2 font-medium">
                {item.rotulo}
              </Link>
            ) : (
              <span key={item.rotulo} className="px-3 py-2 text-suave" title="Em breve">
                {item.rotulo}
              </span>
            ),
          )}
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
