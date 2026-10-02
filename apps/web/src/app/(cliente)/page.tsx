import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  HandCoins,
  Package,
  Search,
  Store,
  Wallet,
} from 'lucide-react';
import type { Paginado, SalaoMarketplace } from '@salonflow/shared';
import { CartaoSalao } from '@/components/cliente/cartao-salao';
import { EstadoVazio } from '@/components/ui/estado-vazio';
import { classeBotaoPrimario } from '@/components/ui/campo';
import { api } from '@/lib/api/client';

const RECURSOS_SALAO = [
  {
    icone: CalendarDays,
    titulo: 'Agenda online',
    texto: 'Seus clientes agendam sozinhos, 24 horas.',
  },
  {
    icone: HandCoins,
    titulo: 'Comissões',
    texto: 'Regras por profissional e repasse salão-parceiro.',
  },
  { icone: Package, titulo: 'Estoque', texto: 'Ficha técnica com baixa automática dos produtos.' },
  { icone: Wallet, titulo: 'Caixa', texto: 'Comandas, formas de pagamento e conferência.' },
];

const DESTAQUES = 6;

export default async function InicioPage() {
  const destaques = await api<Paginado<SalaoMarketplace>>('/saloes', { cache: 'no-store' })
    .then((r) => r.itens.slice(0, DESTAQUES))
    .catch(() => [] as SalaoMarketplace[]);

  return (
    <div className="flex flex-col gap-14">
      <section className="flex flex-col items-center gap-6 pt-6 text-center">
        <p className="text-xs font-medium tracking-[0.2em] text-dourado uppercase">
          Beleza com hora marcada
        </p>
        <h1 className="max-w-2xl text-4xl leading-tight sm:text-5xl">
          Encontre o salão ideal e <em className="text-primaria">agende em segundos</em>
        </h1>
        <p className="max-w-xl text-suave">
          Escolha o serviço, o profissional e o horário. Sem ligação, sem espera.
        </p>
        <form
          action="/saloes"
          className="flex w-full max-w-xl items-center gap-2 rounded-2xl border border-borda bg-superficie p-2 shadow-sm focus-within:border-primaria"
        >
          <Search className="ml-2 size-5 shrink-0 text-suave" aria-hidden />
          <input
            name="busca"
            placeholder="Nome do salão, bairro ou cidade"
            aria-label="Buscar salão"
            className="min-w-0 flex-1 bg-transparent px-1 py-2 outline-none placeholder:text-suave/70"
          />
          <button type="submit" className={classeBotaoPrimario}>
            Buscar
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl">Salões no SalonFlow</h2>
          {destaques.length > 0 && (
            <Link
              href="/saloes"
              className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primaria hover:underline"
            >
              Ver todos os salões <ArrowRight className="size-4" aria-hidden />
            </Link>
          )}
        </div>
        {destaques.length === 0 ? (
          <EstadoVazio
            icone={Store}
            titulo="Nenhum salão disponível ainda"
            descricao="Os salões cadastrados aparecem aqui."
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {destaques.map((s) => (
              <li key={s.id}>
                <CartaoSalao salao={s} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-6 rounded-3xl bg-gradient-to-br from-[#a35866] to-[#6e3540] p-8 text-white sm:p-10">
        <div className="max-w-2xl">
          <p className="text-xs font-medium tracking-[0.2em] text-[#f3d9a8] uppercase">
            Para salões
          </p>
          <h2 className="mt-2 font-display text-3xl">
            Tudo o que o seu salão precisa, num só lugar
          </h2>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {RECURSOS_SALAO.map(({ icone: Icone, titulo, texto }) => (
            <li key={titulo} className="rounded-2xl bg-white/10 p-4">
              <Icone className="size-5 text-[#f3d9a8]" aria-hidden />
              <p className="mt-2 font-medium">{titulo}</p>
              <p className="mt-1 text-sm text-white/80">{texto}</p>
            </li>
          ))}
        </ul>
        <Link
          href="/cadastro-salao"
          className="inline-flex items-center gap-2 self-start rounded-xl bg-white px-5 py-2.5 font-medium text-[#6e3540] hover:bg-[#fbf0ee]"
        >
          Cadastre seu salão grátis <ArrowRight className="size-4" aria-hidden />
        </Link>
      </section>
    </div>
  );
}
