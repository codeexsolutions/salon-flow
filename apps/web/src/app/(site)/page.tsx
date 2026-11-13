import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BellRing,
  CalendarDays,
  ChartColumn,
  Check,
  Gift,
  HandCoins,
  Headset,
  Package,
  ShieldCheck,
  Smartphone,
  UsersRound,
  Wallet,
  X,
} from 'lucide-react';
import { classeBotaoPrimario, classeBotaoSecundario } from '@/components/ui/campo';
import {
  IlustracaoAgendamento,
  IlustracaoComissoes,
  IlustracaoPainel,
} from '@/components/site/ilustracoes';

export const metadata: Metadata = {
  title: { absolute: 'SalonFlow · gestão para salões, barbearias e estética' },
  description:
    'Agenda online, comandas, comissões, estoque e caixa do seu salão em um só lugar. Grátis na fase de testes.',
};

const DORES = [
  {
    antes: 'Agenda no caderno e horários marcados por WhatsApp, a qualquer hora.',
    depois: 'O cliente agenda sozinho pelo link do salão, 24 horas, e a agenda se organiza.',
  },
  {
    antes: 'Comissão calculada na mão no fim do mês, com conta errada e discussão.',
    depois: 'A comissão de cada profissional sai calculada ao fechar a comanda.',
  },
  {
    antes: 'Produto acaba no meio do atendimento sem ninguém perceber.',
    depois: 'A ficha técnica dá baixa no estoque a cada serviço feito.',
  },
  {
    antes: 'No fim do mês, você não sabe ao certo quanto o salão faturou.',
    depois: 'Faturamento por período, por profissional e por forma de pagamento.',
  },
];

const RECURSOS = [
  {
    icone: CalendarDays,
    titulo: 'Agenda e agendamento online',
    texto:
      'Agenda por profissional e uma página do salão onde o cliente escolhe serviço, profissional e horário.',
  },
  {
    icone: Wallet,
    titulo: 'Comandas e caixa',
    texto:
      'Serviços e produtos na comanda, várias formas de pagamento e fechamento do caixa do dia.',
  },
  {
    icone: HandCoins,
    titulo: 'Comissões e repasses',
    texto:
      'Regras por profissional e serviço, desconto de produtos, vales e repasse no modelo salão-parceiro.',
  },
  {
    icone: Package,
    titulo: 'Estoque com ficha técnica',
    texto:
      'Quanto de cada produto um serviço consome, baixa automática e estoque mínimo por produto.',
  },
  {
    icone: UsersRound,
    titulo: 'Equipe e permissões',
    texto:
      'Cada um vê só o que precisa: a recepção cadastra clientes sem ver comissões. Os profissionais têm um app próprio.',
  },
  {
    icone: ChartColumn,
    titulo: 'Faturamento',
    texto: 'Do bruto ao resultado, por profissional, por serviço e por forma de pagamento.',
  },
  {
    icone: Gift,
    titulo: 'Clientes e fidelidade',
    texto:
      'Histórico e ficha técnica de cada cliente, aniversariantes e programa de pontos com prêmios.',
  },
  {
    icone: BellRing,
    titulo: 'Lembretes e avaliações',
    texto:
      'Notificações no celular do cliente e mensagens prontas para enviar pelo WhatsApp com um toque.',
  },
];

const IMPLANTACAO = [
  {
    titulo: 'Crie a conta',
    texto: 'Leva 2 minutos: nome do salão, seu WhatsApp e uma senha.',
  },
  {
    titulo: 'Configuramos juntos',
    texto:
      'Serviços, profissionais, horários e comissões, com a nossa ajuda por WhatsApp ou chamada.',
  },
  {
    titulo: 'Divulgue seu link',
    texto:
      'Coloque o link de agendamento no Instagram e no WhatsApp do salão e comece a receber horários.',
  },
];

const DUVIDAS = [
  {
    p: 'Quanto custa?',
    r: 'Na fase de testes o SalonFlow é grátis e não pede cartão de crédito. Quem participar agora terá condição especial quando os planos forem lançados.',
  },
  {
    p: 'Preciso instalar alguma coisa?',
    r: 'Não. Funciona no navegador do computador e do celular, e pode ficar na tela inicial do celular como um aplicativo.',
  },
  {
    p: 'Meus clientes precisam baixar um app?',
    r: 'Não. Eles agendam pelo link do seu salão, direto no navegador. Se quiserem, podem instalar o app para acompanhar horários e pontos.',
  },
  {
    p: 'A recepção vai ver quanto cada profissional ganha?',
    r: 'Só se você permitir. Você define o que cada pessoa da equipe pode ver e fazer. A recepção pode, por exemplo, cadastrar clientes e agendar sem acesso às comissões.',
  },
  {
    p: 'Funciona para salão-parceiro?',
    r: 'Sim. O SalonFlow calcula a cota de cada profissional-parceiro, registra os repasses e ajuda a gerar o contrato de parceria.',
  },
  {
    p: 'Quem vê os dados do meu salão?',
    r: 'Só a sua equipe, conforme as permissões que você der. Os dados de cada salão ficam separados dos demais.',
  },
];

/** Página inicial: apresenta o SalonFlow ao dono do negócio. */
export default function InicioPage() {
  return (
    <div className="flex flex-col">
      {/* Topo */}
      <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pt-12 pb-16 lg:grid-cols-[1fr_1.1fr] lg:pt-16">
        <div className="flex flex-col gap-6">
          <p className="text-xs font-medium tracking-[0.2em] text-dourado uppercase">
            Para salões, barbearias e estética
          </p>
          <h1 className="text-4xl leading-[1.08] text-balance sm:text-5xl">
            Chega de controlar seu salão em{' '}
            <em className="text-primaria not-italic">cadernos, planilhas e WhatsApp</em>
          </h1>
          <p className="max-w-xl text-lg text-suave">
            Com o SalonFlow você organiza agendamentos, profissionais, comissões, estoque e
            financeiro em um único lugar.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/cadastro-salao" className={`${classeBotaoPrimario} px-6 py-3 text-base`}>
              Testar grátis <ArrowRight className="size-4" aria-hidden />
            </Link>
            <a href="#recursos" className={`${classeBotaoSecundario} px-6 py-3 text-base`}>
              Ver o que ele faz
            </a>
          </div>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-suave">
            {[
              'Grátis na fase de testes',
              'Sem cartão de crédito',
              'Implantação com a nossa ajuda',
            ].map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5">
                <Check className="size-4 text-sucesso" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </div>
        <IlustracaoPainel />
      </section>

      {/* Antes e depois */}
      <section className="border-y border-borda bg-superficie">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-16">
          <div className="max-w-2xl">
            <h2 className="font-display text-3xl text-balance">
              Menos tempo organizando, mais tempo atendendo
            </h2>
            <p className="mt-2 text-suave">
              O que muda no dia a dia de quem sai do caderno para o SalonFlow.
            </p>
          </div>
          <ul className="grid gap-4 md:grid-cols-2">
            {DORES.map(({ antes, depois }) => (
              <li
                key={antes}
                className="grid gap-3 rounded-2xl border border-borda bg-background p-5"
              >
                <p className="flex gap-2.5 text-suave">
                  <X className="mt-0.5 size-4 shrink-0 text-perigo" aria-hidden />
                  {antes}
                </p>
                <p className="flex gap-2.5 font-medium">
                  <Check className="mt-0.5 size-4 shrink-0 text-sucesso" aria-hidden />
                  {depois}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Recursos */}
      <section
        id="recursos"
        className="mx-auto flex w-full max-w-6xl scroll-mt-20 flex-col gap-8 px-4 py-16"
      >
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl text-balance">
            Tudo o que o salão precisa, no mesmo lugar
          </h2>
          <p className="mt-2 text-suave">
            Todos os recursos estão incluídos. Nada de módulo extra para liberar depois.
          </p>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {RECURSOS.map(({ icone: Icone, titulo, texto }) => (
            <li
              key={titulo}
              className="flex flex-col gap-2 rounded-2xl border border-borda bg-superficie p-5"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-nude text-primaria">
                <Icone className="size-5" aria-hidden />
              </span>
              <h3 className="mt-1 font-medium">{titulo}</h3>
              <p className="text-sm text-suave">{texto}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Telas */}
      <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pb-16 lg:grid-cols-2">
        <div className="flex flex-col gap-4 lg:order-2">
          <h2 className="font-display text-3xl text-balance">Comissão certa, sem planilha</h2>
          <p className="text-suave">
            Ao fechar a comanda, o SalonFlow calcula a comissão de cada profissional pelas regras
            que você definiu, desconta produtos e vales e mostra quanto falta pagar. O repasse fica
            registrado, com comprovante.
          </p>
        </div>
        <IlustracaoComissoes />
      </section>
      <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pb-16 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <h2 className="font-display text-3xl text-balance">
            Seu salão aberto para agendamentos 24 horas
          </h2>
          <p className="text-suave">
            Cada salão ganha uma página própria com serviços, preços e horários livres. O cliente
            agenda pelo celular, sem ligar e sem esperar resposta, e o horário aparece na sua
            agenda. Seu salão também aparece na busca do SalonFlow para novos clientes da região.
          </p>
          <p className="inline-flex items-center gap-2 text-sm text-suave">
            <Smartphone className="size-4 text-primaria" aria-hidden />
            Sem baixar nada: funciona no navegador e vira app na tela inicial.
          </p>
        </div>
        <IlustracaoAgendamento />
      </section>

      {/* Implantação */}
      <section id="implantacao" className="scroll-mt-20 border-y border-borda bg-superficie">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-16">
          <div className="flex max-w-2xl flex-col gap-2">
            <p className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.2em] text-dourado uppercase">
              <Headset className="size-4" aria-hidden /> Implantação acompanhada
            </p>
            <h2 className="font-display text-3xl text-balance">Você não começa sozinho</h2>
            <p className="text-suave">
              Trocar de sistema dá receio. Por isso, na fase de testes, a gente configura o
              SalonFlow junto com você e fica por perto nas primeiras semanas.
            </p>
          </div>
          <ol className="grid gap-4 md:grid-cols-3">
            {IMPLANTACAO.map(({ titulo, texto }, i) => (
              <li
                key={titulo}
                className="flex gap-4 rounded-2xl border border-borda bg-background p-5"
              >
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
        </div>
      </section>

      {/* Dúvidas */}
      <section
        id="duvidas"
        className="mx-auto flex w-full max-w-3xl scroll-mt-20 flex-col gap-6 px-4 py-16"
      >
        <h2 className="font-display text-3xl">Dúvidas frequentes</h2>
        <div className="flex flex-col divide-y divide-borda rounded-2xl border border-borda bg-superficie">
          {DUVIDAS.map(({ p, r }) => (
            <details key={p} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                {p}
                <span
                  className="text-xl leading-none text-suave transition group-open:rotate-45"
                  aria-hidden
                >
                  +
                </span>
              </summary>
              <p className="mt-2 text-suave">{r}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Chamada final */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-16">
        <div className="faixa-escura flex flex-col items-start gap-5 rounded-3xl p-8 sm:p-12">
          <p className="inline-flex items-center gap-2 text-xs font-medium tracking-[0.2em] text-faixa-destaque uppercase">
            <ShieldCheck className="size-4" aria-hidden /> Fase de testes
          </p>
          <h2 className="max-w-2xl font-display text-3xl leading-tight font-bold text-balance">
            Teste o SalonFlow no seu salão, de graça
          </h2>
          <p className="max-w-xl text-white/80">
            Estamos escolhendo os primeiros salões para usar o sistema e ajudar a melhorá-lo. Sem
            cartão, sem compromisso e com a nossa ajuda para começar.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/cadastro-salao"
              className="inline-flex items-center gap-2 rounded-xl bg-faixa-destaque px-6 py-3 font-medium text-faixa-destaque-texto hover:brightness-105"
            >
              Criar minha conta grátis <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/entrar"
              className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-6 py-3 font-medium text-white hover:bg-white/10"
            >
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
