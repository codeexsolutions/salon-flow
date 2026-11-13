import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { MenuUsuario } from '@/components/auth/menu-usuario';
import { AbasCliente, MenuTopoCliente } from '@/components/cliente/abas-cliente';
import { Marca } from '@/components/ui/marca';

/** App do CLIENTE (marketplace): buscar salões, agendar, ver/remarcar/cancelar. */
export const metadata: Metadata = {
  manifest: '/manifests/cliente.webmanifest',
};

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col overflow-x-clip pb-20 sm:pb-0">
      <header className="sticky top-0 z-30 border-b border-borda bg-background/90 backdrop-blur print:hidden">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Marca href="/saloes" />
          <div className="flex items-center gap-5">
            <MenuTopoCliente />
            <Suspense>
              <MenuUsuario />
            </Suspense>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:py-8">{children}</main>
      <footer className="border-t border-borda print:hidden">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-xs text-suave">
          <span>© SalonFlow — agendamento e gestão para salões, barbearias e estética</span>
          <Link href="/cadastro-salao" className="hover:text-primaria">
            Cadastre seu negócio
          </Link>
        </div>
      </footer>
      <AbasCliente />
    </div>
  );
}
