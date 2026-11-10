'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarHeart, Gift, Search, UserRound } from 'lucide-react';

export const ABAS_CLIENTE = [
  { rotulo: 'Explorar', href: '/saloes', icone: Search },
  { rotulo: 'Agenda', href: '/meus-agendamentos', icone: CalendarHeart },
  { rotulo: 'Pontos', href: '/meus-pontos', icone: Gift },
  { rotulo: 'Conta', href: '/conta/senha', icone: UserRound },
];

/** Aba ativa: "Conta" cobre as páginas de conta e notificações; "Explorar", as de salão. */
export function abaAtiva(caminho: string, href: string) {
  if (href === '/conta/senha') return caminho.startsWith('/conta');
  if (href === '/saloes')
    return caminho === '/' || caminho.startsWith('/saloes') || caminho.startsWith('/s/');
  return caminho.startsWith(href);
}

/** Barra inferior do app do cliente (só no celular; no computador o menu fica no topo). */
export function AbasCliente() {
  const caminho = usePathname();
  return (
    <nav
      aria-label="App do cliente"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-borda bg-superficie/95 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden print:hidden"
    >
      <div className="mx-auto flex max-w-md justify-around py-2">
        {ABAS_CLIENTE.map(({ rotulo, href, icone: Icone }) => {
          const ativo = abaAtiva(caminho, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={ativo ? 'page' : undefined}
              className={`flex min-w-16 flex-col items-center gap-0.5 rounded-xl px-3 py-1 text-xs ${
                ativo ? 'font-semibold text-primaria' : 'text-suave'
              }`}
            >
              <Icone className="size-5" aria-hidden />
              {rotulo}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** Menu do topo no computador (mesmos destinos da barra inferior). */
export function MenuTopoCliente() {
  const caminho = usePathname();
  return (
    <nav aria-label="Menu" className="hidden items-center gap-5 text-sm sm:flex">
      {ABAS_CLIENTE.map(({ rotulo, href, icone: Icone }) => {
        const ativo = abaAtiva(caminho, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={ativo ? 'page' : undefined}
            className={`inline-flex items-center gap-1.5 hover:text-primaria ${
              ativo ? 'font-semibold text-primaria' : ''
            }`}
          >
            <Icone className="size-4" aria-hidden />
            {rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
