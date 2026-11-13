import Link from 'next/link';
import { Search } from 'lucide-react';
import { Marca } from '@/components/ui/marca';
import { classeBotaoPrimario } from '@/components/ui/campo';

/** Site institucional (para o dono do negócio). O app do cliente fica em /saloes. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col overflow-x-clip">
      <header className="sticky top-0 z-30 border-b border-borda bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Marca />
          <nav aria-label="Site" className="flex items-center gap-5 text-sm">
            <a href="#recursos" className="hidden hover:text-primaria md:inline">
              Recursos
            </a>
            <a href="#implantacao" className="hidden hover:text-primaria md:inline">
              Implantação
            </a>
            <a href="#duvidas" className="hidden hover:text-primaria md:inline">
              Dúvidas
            </a>
            <Link href="/entrar" className="hover:text-primaria">
              Entrar
            </Link>
            <Link href="/cadastro-salao" className={`${classeBotaoPrimario} hidden sm:inline-flex`}>
              Testar grátis
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-borda">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-suave">
          <span>© SalonFlow · gestão e agendamento para salões, barbearias e estética</span>
          <Link
            href="/saloes"
            className="inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primaria"
          >
            <Search className="size-4" aria-hidden />
            Procurando um salão para agendar? Encontre aqui
          </Link>
        </div>
      </footer>
    </div>
  );
}
