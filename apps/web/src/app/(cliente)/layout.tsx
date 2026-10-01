import type { Metadata } from 'next';
import Link from 'next/link';

/** App do CLIENTE (marketplace): buscar salões, agendar, ver/remarcar/cancelar. */
export const metadata: Metadata = {
  manifest: '/manifests/cliente.webmanifest',
};

export default function ClienteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-borda px-4 py-3">
        <Link href="/" className="text-lg font-bold text-primaria">
          SalonFlow
        </Link>
        <nav className="flex gap-4 text-sm">
          <Link href="/meus-agendamentos">Meus agendamentos</Link>
          <Link href="/entrar">Entrar</Link>
        </nav>
      </header>
      <main className="flex-1 px-4 py-6">{children}</main>
    </div>
  );
}
