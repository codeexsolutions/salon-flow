import { redirect } from 'next/navigation';
import { CalendarCheck, HandCoins, Sparkles } from 'lucide-react';
import { FormLogin, type Modo, type TipoConta } from '@/components/auth/form-login';
import { caminhoSeguro } from '@/lib/auth/destino';
import { obterSessao } from '@/lib/auth/sessao';
import { provedoresAtivos } from '@/lib/supabase/provedores';

export const metadata = { title: 'Entrar' };

const DESTAQUES = [
  { icone: CalendarCheck, texto: 'Agende em segundos, sem ligar nem esperar resposta.' },
  { icone: Sparkles, texto: 'Todos os seus horários, em todos os salões, num só lugar.' },
  { icone: HandCoins, texto: 'Para salões: agenda, comandas, comissões e caixa.' },
];

export default async function EntrarPage({ searchParams }: PageProps<'/entrar'>) {
  const params = await searchParams;
  const next = caminhoSeguro(typeof params.next === 'string' ? params.next : null);

  // Quem vem de "Cadastre seu salão" já cai em Criar conta > Tenho um salão.
  const vemDoCadastroDeSalao = next?.startsWith('/admin/novo-salao') ?? false;
  const tipoPedido = ['cliente', 'salao', 'profissional'].includes(String(params.tipo))
    ? (params.tipo as TipoConta)
    : undefined;
  const tipoInicial: TipoConta = vemDoCadastroDeSalao ? 'salao' : (tipoPedido ?? 'cliente');
  const modoInicial: Modo = vemDoCadastroDeSalao || params.modo === 'criar' ? 'criar' : 'entrar';

  const [sessao, provedores] = await Promise.all([obterSessao(), provedoresAtivos()]);
  if (sessao) {
    redirect(next ? `/auth/continuar?next=${encodeURIComponent(next)}` : '/auth/continuar');
  }

  return (
    <div className="grid overflow-hidden rounded-3xl border border-borda bg-superficie shadow-sm md:grid-cols-2">
      <section className="hidden flex-col justify-between gap-10 bg-gradient-to-br from-[#a35866] to-[#6e3540] p-10 text-white md:flex">
        <p className="font-display text-4xl leading-tight">
          Seu momento de beleza, <em className="text-[#f3d9a8]">sem complicação.</em>
        </p>
        <ul className="flex flex-col gap-4 text-sm text-white/90">
          {DESTAQUES.map(({ icone: Icone, texto }) => (
            <li key={texto} className="flex items-start gap-3">
              <Icone className="mt-0.5 size-5 shrink-0 text-[#f3d9a8]" aria-hidden />
              {texto}
            </li>
          ))}
        </ul>
      </section>

      <section className="p-6 sm:p-10">
        {params.erro === 'link' && (
          <p role="alert" className="mb-4 rounded-lg bg-perigo-suave p-3 text-sm text-perigo">
            O link expirou ou já foi usado. Tente novamente.
          </p>
        )}
        <FormLogin
          next={next}
          google={provedores.google}
          modoInicial={modoInicial}
          tipoInicial={tipoInicial}
        />
      </section>
    </div>
  );
}
