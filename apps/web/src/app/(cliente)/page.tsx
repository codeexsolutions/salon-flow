import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  Check,
  Eye,
  Flower2,
  Hand,
  HandCoins,
  MapPin,
  Package,
  Scissors,
  Search,
  Smartphone,
  Sparkles,
  Store,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import type { FiltrosDiretorio, Paginado, SalaoMarketplace } from '@salonflow/shared';
import { CartaoSalao } from '@/components/cliente/cartao-salao';
import { EstadoVazio } from '@/components/ui/estado-vazio';
import { classeBotaoPrimario } from '@/components/ui/campo';
import { api } from '@/lib/api/client';

const DESTAQUES = 6;

const RECURSOS_NEGOCIO = [
  { icone: CalendarDays, titulo: 'Agenda online', texto: 'Seus clientes agendam sozinhos, 24 horas.' },
  { icone: HandCoins, titulo: 'Comissões', texto: 'Regras por profissional e repasse salão-parceiro.' },
  { icone: Package, titulo: 'Estoque', texto: 'Ficha técnica com baixa automática dos produtos.' },
  { icone: Wallet, titulo: 'Caixa', texto: 'Comandas, formas de pagamento e conferência.' },
];

const PASSOS = [
  { titulo: 'Encontre', texto: 'Busque pelo nome, bairro ou tipo de serviço e veja preços e durações.' },
  { titulo: 'Escolha', texto: 'Serviço, profissional, dia e horário livre, tudo na mesma tela.' },
  { titulo: 'Pronto', texto: 'Acompanhe, cancele ou fale com o estabelecimento quando precisar.' },
];

/** Ícone de cada categoria de serviço (pelo nome cadastrado). */
function iconeDaCategoria(categoria: string): LucideIcon {
  const c = categoria.toLowerCase();
  if (/barb|cabel|corte/.test(c)) return Scissors;
  if (/unha|manicure|pedicure|esmalt/.test(c)) return Hand;
  if (/sobrancelh|c[ií]lio|olhar/.test(c)) return Eye;
  if (/massag|spa|relax/.test(c)) return Flower2;
  return Sparkles;
}

export default async function InicioPage() {
  const [destaques, filtros] = await Promise.all([
    api<Paginado<SalaoMarketplace>>('/saloes', { cache: 'no-store' })
      .then((r) => r.itens.slice(0, DESTAQUES))
      .catch(() => [] as SalaoMarketplace[]),
    api<FiltrosDiretorio>('/saloes/filtros', { cache: 'no-store' }).catch(
      () => ({ cidades: [], categorias: [] }) as FiltrosDiretorio,
    ),
  ]);

  return (
    <div className="flex flex-col gap-16">
      {/* Topo: busca + ilustração do agendamento */}
      <section className="grid items-center gap-10 pt-4 lg:grid-cols-[1.15fr_1fr]">
        <div className="flex flex-col gap-6">
          <p className="text-xs font-medium tracking-[0.2em] text-dourado uppercase">
            Beleza e cuidado com hora marcada
          </p>
          <h1 className="text-4xl leading-[1.08] sm:text-5xl">
            Encontre onde agendar e{' '}
            <em className="text-primaria not-italic">marque em segundos</em>
          </h1>
          <p className="max-w-lg text-suave">
            Salões, barbearias, estética, unhas e sobrancelhas. Escolha o serviço, o profissional
            e o horário, sem ligação e sem espera.
          </p>
          <form
            action="/saloes"
            className="flex w-full max-w-lg items-center gap-2 rounded-2xl border border-borda bg-superficie p-2 shadow-sm focus-within:border-primaria"
          >
            <Search className="ml-2 size-5 shrink-0 text-suave" aria-hidden />
            <input
              name="busca"
              placeholder="Nome, bairro ou cidade"
              aria-label="Buscar estabelecimento"
              className="min-w-0 flex-1 bg-transparent px-1 py-2 outline-none placeholder:text-suave/70"
            />
            <button type="submit" className={classeBotaoPrimario}>
              Buscar
            </button>
          </form>
          {filtros.categorias.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-suave">Populares:</span>
              {filtros.categorias.slice(0, 5).map((c) => (
                <Link
                  key={c}
                  href={`/saloes?categoria=${encodeURIComponent(c)}`}
                  className="rounded-full border border-borda bg-superficie px-3 py-1 hover:border-primaria/50 hover:text-primaria"
                >
                  {c}
                </Link>
              ))}
            </div>
          )}
        </div>

        <IlustracaoAgendamento />
      </section>

      {/* Categorias */}
      {filtros.categorias.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="font-display text-2xl">Explore por categoria</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {filtros.categorias.map((c) => {
              const Icone = iconeDaCategoria(c);
              return (
                <li key={c}>
                  <Link
                    href={`/saloes?categoria=${encodeURIComponent(c)}`}
                    className="group flex items-center gap-3 rounded-2xl border border-borda bg-superficie p-4 transition hover:-translate-y-0.5 hover:border-primaria/40 hover:shadow-sm"
                  >
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-nude text-primaria">
                      <Icone className="size-5" aria-hidden />
                    </span>
                    <span className="min-w-0 font-medium leading-tight">{c}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Destaques */}
      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-2xl">Em destaque no SalonFlow</h2>
          {destaques.length > 0 && (
            <Link
              href="/saloes"
              className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primaria hover:underline"
            >
              Ver todos <ArrowRight className="size-4" aria-hidden />
            </Link>
          )}
        </div>
        {destaques.length === 0 ? (
          <EstadoVazio
            icone={Store}
            titulo="Nenhum estabelecimento disponível ainda"
            descricao="Os estabelecimentos cadastrados aparecem aqui."
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

      {/* Como funciona */}
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-2xl">Como funciona</h2>
          <p className="text-suave">Sem cadastro complicado e sem baixar nada da loja.</p>
        </div>
        <ol className="grid gap-4 sm:grid-cols-3">
          {PASSOS.map(({ titulo, texto }, i) => (
            <li key={titulo} className="flex gap-4 rounded-2xl border border-borda bg-superficie p-5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-botao font-display font-bold text-botao-contraste">
                {i + 1}
              </span>
              <span className="flex flex-col gap-1">
                <span className="font-medium">{titulo}</span>
                <span className="text-sm text-suave">{texto}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="inline-flex items-center gap-2 text-sm text-suave">
          <Smartphone className="size-4 text-primaria" aria-hidden />
          Funciona no navegador e pode ficar na tela inicial do celular como um app.
        </p>
      </section>

      {/* Para o seu negócio */}
      <section className="faixa-escura grid gap-8 rounded-3xl p-8 sm:p-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div className="flex flex-col gap-4">
          <p className="text-xs font-medium tracking-[0.2em] text-faixa-destaque uppercase">
            Para o seu negócio
          </p>
          <h2 className="font-display text-3xl leading-tight font-bold">
            Agenda cheia, caixa em dia e equipe no controle
          </h2>
          <p className="text-white/80">
            Salão, barbearia, clínica de estética ou studio de sobrancelhas: seus clientes agendam
            pelo link da sua página, e você cuida de comandas, comissões e estoque num só lugar.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/cadastro-salao"
              className="inline-flex items-center gap-2 rounded-xl bg-faixa-destaque px-5 py-2.5 font-medium text-faixa-destaque-texto hover:brightness-105"
            >
              Cadastre seu negócio grátis <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/entrar"
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-5 py-2.5 font-medium text-white hover:bg-white/10"
            >
              Já tenho conta
            </Link>
          </div>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {RECURSOS_NEGOCIO.map(({ icone: Icone, titulo, texto }) => (
            <li key={titulo} className="rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/10">
              <Icone className="size-5 text-faixa-destaque" aria-hidden />
              <p className="mt-2 font-medium">{titulo}</p>
              <p className="mt-1 text-sm text-white/75">{texto}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/** Ilustração (não interativa) de um agendamento, para mostrar o produto logo no topo. */
function IlustracaoAgendamento() {
  const horarios = ['14:00', '14:30', '15:30', '16:00', '17:00', '17:30'];
  return (
    <div aria-hidden className="relative mx-auto mb-6 w-full max-w-sm select-none lg:max-w-none">
      <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-nude/70" />
      <div className="rounded-3xl border border-borda bg-superficie p-5 pb-11 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-full bg-botao font-display font-bold text-botao-contraste">
            NO
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium">Barbearia Navalha de Ouro</p>
            <p className="inline-flex items-center gap-1 text-xs text-suave">
              <MapPin className="size-3" /> Aldeota, Fortaleza
            </p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-2xl bg-nude px-4 py-3 text-sm">
          <span>
            <span className="block font-medium">Corte + barba</span>
            <span className="text-xs text-suave">com Diego · 1h</span>
          </span>
          <span className="font-display font-bold">R$ 80</span>
        </div>
        <p className="mt-4 text-xs font-medium text-suave">Sábado, 7 de novembro</p>
        <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
          {horarios.map((h) => (
            <span
              key={h}
              className={`rounded-xl border py-1.5 text-center ${
                h === '15:30'
                  ? 'border-botao bg-botao font-medium text-botao-contraste'
                  : 'border-borda'
              }`}
            >
              {h}
            </span>
          ))}
        </div>
        <span className="mt-4 block rounded-xl bg-botao py-2.5 text-center text-sm font-medium text-botao-contraste">
          Confirmar agendamento
        </span>
      </div>
      <div className="absolute -bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-2xl border border-borda bg-superficie px-4 py-2.5 text-sm shadow-md">
        <span className="flex size-6 items-center justify-center rounded-full bg-sucesso text-white">
          <Check className="size-3.5" />
        </span>
        <span>
          <span className="block font-medium leading-tight">Agendamento confirmado</span>
          <span className="text-xs text-suave">Sáb, 7 nov · 15:30</span>
        </span>
      </div>
    </div>
  );
}
