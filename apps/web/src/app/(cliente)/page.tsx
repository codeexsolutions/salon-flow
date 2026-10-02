import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  HandCoins,
  MapPin,
  Package,
  Search,
  Store,
  Wallet,
} from 'lucide-react';
import type { SalaoMarketplace } from '@salonflow/shared';
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

export default async function InicioPage({ searchParams }: PageProps<'/'>) {
  const consulta = await searchParams;
  const busca = typeof consulta.busca === 'string' ? consulta.busca.trim() : '';
  const saloes = await api<SalaoMarketplace[]>(
    `/saloes${busca ? `?busca=${encodeURIComponent(busca)}` : ''}`,
    { cache: 'no-store' },
  ).catch(() => [] as SalaoMarketplace[]);

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
        <form className="flex w-full max-w-xl items-center gap-2 rounded-2xl border border-borda bg-superficie p-2 shadow-sm focus-within:border-primaria">
          <Search className="ml-2 size-5 shrink-0 text-suave" aria-hidden />
          <input
            name="busca"
            defaultValue={busca}
            placeholder="Nome do salão ou cidade"
            aria-label="Buscar salão"
            className="min-w-0 flex-1 bg-transparent px-1 py-2 outline-none placeholder:text-suave/70"
          />
          <button type="submit" className={classeBotaoPrimario}>
            Buscar
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-display text-2xl">
          {busca ? `Resultados para “${busca}”` : 'Salões no SalonFlow'}
        </h2>
        {saloes.length === 0 ? (
          <EstadoVazio
            icone={Store}
            titulo={busca ? 'Nenhum salão encontrado' : 'Nenhum salão disponível ainda'}
            descricao={
              busca ? 'Tente outro nome ou cidade.' : 'Os salões cadastrados aparecem aqui.'
            }
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {saloes.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/s/${s.slug}`}
                  className="group flex h-full flex-col gap-3 rounded-2xl border border-borda bg-superficie p-5 transition hover:-translate-y-0.5 hover:border-primaria/40 hover:shadow-md"
                >
                  <span className="flex size-12 items-center justify-center rounded-full bg-nude font-display text-xl text-primaria">
                    {s.nome.charAt(0).toUpperCase()}
                  </span>
                  <span className="flex flex-col gap-1">
                    <span className="font-medium">{s.nome}</span>
                    {s.cidade && (
                      <span className="inline-flex items-center gap-1 text-sm text-suave">
                        <MapPin className="size-3.5" aria-hidden />
                        {s.cidade}
                        {s.uf && ` - ${s.uf}`}
                      </span>
                    )}
                  </span>
                  <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-primaria">
                    {s.totalServicos > 0 ? `${s.totalServicos} serviço(s) · Agendar` : 'Ver salão'}
                    <ArrowRight
                      className="size-4 transition group-hover:translate-x-0.5"
                      aria-hidden
                    />
                  </span>
                </Link>
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
