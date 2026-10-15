import { redirect } from 'next/navigation';
import { CalendarDays, HandCoins, Package, Wallet } from 'lucide-react';
import { FormCadastroSalao } from '@/components/auth/form-cadastro-salao';
import { obterSessao } from '@/lib/auth/sessao';

export const metadata = { title: 'Cadastre seu negócio' };

const RECURSOS = [
  { icone: CalendarDays, texto: 'Agenda online: seus clientes agendam sozinhos, 24 horas.' },
  { icone: HandCoins, texto: 'Comissões configuráveis e repasse no modelo salão-parceiro.' },
  { icone: Package, texto: 'Estoque com ficha técnica e baixa automática.' },
  { icone: Wallet, texto: 'Comandas, caixa diário e formas de pagamento.' },
];

/** Cadastro do estabelecimento (salão, barbearia, estética…): conta do dono + dados, em uma etapa. */
export default async function CadastroSalaoPage() {
  // Já logado: só falta cadastrar o salão.
  if (await obterSessao()) redirect('/admin/novo-salao');

  return (
    <div className="grid overflow-hidden rounded-3xl border border-borda bg-superficie shadow-sm lg:grid-cols-[2fr_3fr]">
      <section className="flex flex-col gap-8 faixa-escura p-8 text-white sm:p-10">
        <div>
          <p className="text-xs font-medium tracking-[0.2em] text-faixa-destaque uppercase">
            Para o seu negócio
          </p>
          <p className="mt-3 font-display text-4xl leading-tight">
            Seu negócio organizado, <em className="text-faixa-destaque not-italic">sua agenda cheia.</em>
          </p>
        </div>
        <ul className="flex flex-col gap-4 text-sm text-white/90">
          {RECURSOS.map(({ icone: Icone, texto }) => (
            <li key={texto} className="flex items-start gap-3">
              <Icone className="mt-0.5 size-5 shrink-0 text-faixa-destaque" aria-hidden />
              {texto}
            </li>
          ))}
        </ul>
        <p className="mt-auto text-xs text-white/70">
          Depois do cadastro, adicione seus profissionais e serviços no painel. Cada profissional
          entra no app com o usuário e a senha que você criar para ele.
        </p>
      </section>

      <section className="p-6 sm:p-10">
        <h1 className="text-3xl">Cadastre seu negócio</h1>
        <p className="mt-1 mb-6 text-sm text-suave">Grátis. Leva menos de 2 minutos.</p>
        <FormCadastroSalao />
      </section>
    </div>
  );
}
