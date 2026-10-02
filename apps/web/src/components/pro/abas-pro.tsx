'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, HandCoins, UserRound } from 'lucide-react';

const ABAS = [
  { rotulo: 'Agenda', href: '/pro', icone: CalendarDays },
  { rotulo: 'Comissões', href: '/pro/comissoes', icone: HandCoins },
  { rotulo: 'Conta', href: '/pro/conta', icone: UserRound },
];

/** Barra inferior do app do profissional. */
export function AbasPro() {
  const caminho = usePathname();
  const ativo = (href: string) =>
    href === '/pro'
      ? caminho === '/pro'
      : caminho.startsWith(href) ||
        (href === '/pro/comissoes' && caminho.startsWith('/pro/repasses'));

  return (
    <nav
      aria-label="App do profissional"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-borda bg-superficie/95 backdrop-blur print:hidden"
    >
      <div className="mx-auto flex max-w-md justify-around py-2">
        {ABAS.map(({ rotulo, href, icone: Icone }) => (
          <Link
            key={href}
            href={href}
            aria-current={ativo(href) ? 'page' : undefined}
            className={`flex flex-col items-center gap-0.5 rounded-xl px-4 py-1 text-xs ${
              ativo(href) ? 'font-semibold text-primaria' : 'text-suave'
            }`}
          >
            <Icone className="size-5" aria-hidden />
            {rotulo}
          </Link>
        ))}
      </div>
    </nav>
  );
}
