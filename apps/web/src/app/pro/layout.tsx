import type { Metadata } from 'next';
import Link from 'next/link';

/** App do PROFISSIONAL comissionado — pensado para celular. */
export const metadata: Metadata = {
  title: { default: 'Minha agenda', template: '%s · SalonFlow Pro' },
  manifest: '/manifests/pro.webmanifest',
};

const abas = [
  { rotulo: 'Agenda', href: '/pro' },
  { rotulo: 'Comissões', href: '/pro/comissoes' },
  { rotulo: 'Perfil' },
];

export default function ProLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
      <main className="flex-1 p-4 pb-20">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 mx-auto flex max-w-md justify-around border-t border-borda bg-background py-3 text-sm">
        {abas.map((aba) =>
          aba.href ? (
            <Link key={aba.rotulo} href={aba.href} className="font-medium text-primaria">
              {aba.rotulo}
            </Link>
          ) : (
            <span key={aba.rotulo} className="text-suave" title="Em breve">
              {aba.rotulo}
            </span>
          ),
        )}
      </nav>
    </div>
  );
}
