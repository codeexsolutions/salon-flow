'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  ArrowLeftRight,
  CalendarDays,
  ExternalLink,
  HandCoins,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Receipt,
  Scissors,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react';
import type { Papel, VinculoSalao } from '@salonflow/shared';
import { sair, trocarSalao } from '@/lib/auth/actions';
import { Marca } from '@/components/ui/marca';

interface Item {
  rotulo: string;
  href: string;
  icone: LucideIcon;
  /** Papéis que veem o item (sem = todos). */
  papeis?: Papel[];
}

const ITENS: Item[] = [
  { rotulo: 'Início', href: '/admin', icone: LayoutDashboard },
  { rotulo: 'Agenda', href: '/admin/agenda', icone: CalendarDays },
  { rotulo: 'Comandas', href: '/admin/comandas', icone: Receipt },
  { rotulo: 'Caixa', href: '/admin/caixa', icone: Wallet },
  { rotulo: 'Profissionais', href: '/admin/profissionais', icone: Users },
  { rotulo: 'Serviços', href: '/admin/servicos', icone: Scissors },
  { rotulo: 'Estoque', href: '/admin/estoque', icone: Package },
  { rotulo: 'Comissões', href: '/admin/comissoes', icone: HandCoins, papeis: ['DONO'] },
];

interface Props {
  salao: VinculoSalao;
  outrosSaloes: VinculoSalao[];
  usuario: { nome: string | null; email: string };
}

/** Menu do painel: barra lateral no computador e gaveta no celular. */
export function NavegacaoPainel(props: Props) {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-borda bg-superficie md:flex print:hidden">
        <ConteudoMenu {...props} />
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-borda bg-superficie/95 px-4 py-3 backdrop-blur md:hidden print:hidden">
        <button
          type="button"
          onClick={() => setAberto(true)}
          aria-label="Abrir menu"
          aria-expanded={aberto}
          className="-ml-1 rounded-lg p-1.5 hover:bg-nude"
        >
          <Menu className="size-6" aria-hidden />
        </button>
        <span className="truncate px-3 font-medium">{props.salao.nome}</span>
        <Marca href="/admin" />
      </header>

      {aberto && (
        <div
          className="fixed inset-0 z-40 md:hidden print:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <button
            type="button"
            aria-label="Fechar menu"
            onClick={() => setAberto(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-superficie shadow-xl">
            <button
              type="button"
              onClick={() => setAberto(false)}
              aria-label="Fechar menu"
              className="absolute top-4 right-3 rounded-lg p-1 hover:bg-nude"
            >
              <X className="size-5" aria-hidden />
            </button>
            <ConteudoMenu {...props} aoNavegar={() => setAberto(false)} />
          </div>
        </div>
      )}
    </>
  );
}

function ConteudoMenu({
  salao,
  outrosSaloes,
  usuario,
  aoNavegar,
}: Props & { aoNavegar?: () => void }) {
  const caminho = usePathname();
  const ativo = (href: string) =>
    href === '/admin' ? caminho === '/admin' : caminho === href || caminho.startsWith(`${href}/`);
  const itens = ITENS.filter((i) => !i.papeis || i.papeis.includes(salao.papel));

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-5">
      <div>
        <Marca href="/admin" />
        <p className="mt-3 truncate text-sm font-medium" title={salao.nome}>
          {salao.nome}
        </p>
        <Link
          href={`/s/${salao.slug}`}
          target="_blank"
          className="mt-0.5 inline-flex items-center gap-1 text-xs text-suave hover:text-primaria"
        >
          Página do salão <ExternalLink className="size-3" aria-hidden />
        </Link>
      </div>

      <nav className="flex flex-col gap-0.5" aria-label="Painel">
        {itens.map(({ rotulo, href, icone: Icone }) => (
          <Link
            key={href}
            href={href}
            onClick={aoNavegar}
            aria-current={ativo(href) ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
              ativo(href)
                ? 'bg-nude font-semibold text-primaria'
                : 'text-foreground/80 hover:bg-nude/60 hover:text-foreground'
            }`}
          >
            <Icone className="size-[18px]" aria-hidden />
            {rotulo}
          </Link>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-3 border-t border-borda pt-4 text-sm">
        {outrosSaloes.length > 0 && (
          <form action={trocarSalao} className="flex flex-col gap-1.5">
            <label htmlFor="salaoId" className="flex items-center gap-1 text-xs text-suave">
              <ArrowLeftRight className="size-3" aria-hidden /> Trocar de salão
            </label>
            <div className="flex gap-1">
              <select
                id="salaoId"
                name="salaoId"
                className="min-w-0 flex-1 rounded-lg border border-borda bg-superficie px-2 py-1.5"
              >
                {outrosSaloes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
              <button type="submit" className="rounded-lg border border-borda px-2.5 hover:bg-nude">
                Ir
              </button>
            </div>
          </form>
        )}
        <div className="min-w-0">
          <p className="truncate font-medium">{usuario.nome ?? usuario.email}</p>
          {usuario.nome && <p className="truncate text-xs text-suave">{usuario.email}</p>}
        </div>
        <div className="flex gap-4">
          <Link
            href="/conta/senha"
            onClick={aoNavegar}
            className="inline-flex items-center gap-1 text-suave hover:text-primaria"
          >
            <KeyRound className="size-4" aria-hidden /> Senha
          </Link>
          <form action={sair}>
            <button
              type="submit"
              className="inline-flex items-center gap-1 text-suave hover:text-perigo"
            >
              <LogOut className="size-4" aria-hidden /> Sair
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
