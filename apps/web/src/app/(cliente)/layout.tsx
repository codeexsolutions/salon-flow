import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { MenuUsuario } from '@/components/auth/menu-usuario';
import { Marca } from '@/components/ui/marca';

/** App do CLIENTE (marketplace): buscar salões, agendar, ver/remarcar/cancelar. */
export const metadata: Metadata = {
  manifest: '/manifests/cliente.webmanifest',
};

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-30 border-b border-borda bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Marca />
          <nav className="flex items-center gap-4 text-sm">
            <Suspense>
              <MenuUsuario />
            </Suspense>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
      <footer className="border-t border-borda">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-xs text-suave">
          <span>© SalonFlow — agendamento e gestão para salões</span>
          <Link href="/cadastro-salao" className="hover:text-primaria">
            Cadastre seu salão
          </Link>
        </div>
      </footer>
    </div>
  );
}
