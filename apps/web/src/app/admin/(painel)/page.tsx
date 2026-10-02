import Link from 'next/link';
import { CalendarDays, CalendarPlus, HandCoins, Package, Receipt, Wallet } from 'lucide-react';
import {
  formatarPreco,
  type AgendaDia,
  type CaixaDetalhe,
  type ComandaResumo,
  type ExtratoComissoes,
  type ProdutoResumo,
  type VinculoSalao,
} from '@salonflow/shared';
import { Indicador } from '@/components/ui/indicador';
import { classeBotaoPrimario, classeBotaoSecundario } from '@/components/ui/campo';
import { EstadoVazio } from '@/components/ui/estado-vazio';
import { Secao } from '@/components/ui/secao';
import { ROTULO_STATUS } from '@/lib/agenda';
import { apiSalao } from '@/lib/api/salao';
import { obterContextoAdmin } from '@/lib/auth/contexto';
import { dataPorExtenso, hojeNoFuso, horaLocal } from '@/lib/data-hora';
import { novaComanda } from './comandas/actions';

/** Reúne os dados do resumo do dia (chamadas em paralelo à API). */
async function carregarResumo(salao: VinculoSalao) {
  const hoje = hojeNoFuso(salao.fusoHorario);
  const ehDono = salao.papel === 'DONO';
  const [agenda, comandas, { caixa }, produtos, extrato] = await Promise.all([
    apiSalao<AgendaDia>(`/agenda?data=${hoje}`),
    apiSalao<ComandaResumo[]>(`/comandas?data=${hoje}`),
    apiSalao<{ caixa: CaixaDetalhe | null }>('/caixa/atual'),
    apiSalao<ProdutoResumo[]>('/produtos'),
    ehDono
      ? apiSalao<ExtratoComissoes>(`/comissoes/extrato?de=${hoje.slice(0, 8)}01&ate=${hoje}`)
      : Promise.resolve(null),
  ]);

  const agora = Date.now();
  const atendimentos = agenda.agendamentos.filter((a) => a.status !== 'CANCELADO');
  const proximos = atendimentos
    .filter(
      (a) =>
        new Date(a.fim).getTime() >= agora &&
        (a.status === 'AGENDADO' || a.status === 'CONFIRMADO'),
    )
    .slice(0, 6);
  const fechadas = comandas.filter((c) => c.status === 'FECHADA');

  return {
    hoje,
    atendimentos,
    proximos,
    concluidos: atendimentos.filter((a) => a.status === 'CONCLUIDO').length,
    profissionais: new Map(agenda.profissionais.map((p) => [p.id, p])),
    abertas: comandas.filter((c) => c.status === 'ABERTA').length,
    faturado: fechadas.reduce((s, c) => s + c.totalCentavos, 0),
    quantidadeFechadas: fechadas.length,
    caixa,
    estoqueBaixo: produtos.filter((p) => p.estoqueBaixo),
    pendenteComissoes: extrato?.profissionais.reduce((s, p) => s + p.pendenteCentavos, 0) ?? null,
  };
}

export default async function PainelInicioPage() {
  const { perfil, salao } = await obterContextoAdmin();
  const r = await carregarResumo(salao);
  const fuso = salao.fusoHorario;
  const primeiroNome = perfil.nome?.split(' ')[0];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-suave">{dataPorExtenso(r.hoje)}</p>
          <h1 className="text-3xl">Olá{primeiroNome && `, ${primeiroNome}`}!</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/agenda" className={classeBotaoPrimario}>
            <CalendarPlus className="size-4" aria-hidden /> Agendar
          </Link>
          <form action={novaComanda}>
            <button type="submit" className={classeBotaoSecundario}>
              <Receipt className="size-4" aria-hidden /> Nova comanda
            </button>
          </form>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumo do dia">
        <Indicador
          rotulo="Atendimentos hoje"
          valor={r.atendimentos.length}
          detalhe={`${r.concluidos} concluído(s) · ${r.proximos.length} a seguir`}
          icone={CalendarDays}
          href="/admin/agenda"
        />
        <Indicador
          rotulo="Faturado hoje"
          valor={formatarPreco(r.faturado)}
          detalhe={`${r.quantidadeFechadas} comanda(s) fechada(s) · ${r.abertas} aberta(s)`}
          icone={Receipt}
          href="/admin/comandas"
          destaque={r.abertas > 0}
        />
        <Indicador
          rotulo="Caixa"
          valor={r.caixa ? 'Aberto' : 'Fechado'}
          detalhe={
            r.caixa
              ? `${formatarPreco(r.caixa.esperadoDinheiroCentavos)} em dinheiro na gaveta`
              : 'Abra o caixa para começar o dia'
          }
          icone={Wallet}
          href="/admin/caixa"
          destaque={!r.caixa}
        />
        {r.pendenteComissoes !== null ? (
          <Indicador
            rotulo="Comissões a pagar (mês)"
            valor={formatarPreco(r.pendenteComissoes)}
            detalhe="Pendentes de repasse"
            icone={HandCoins}
            href="/admin/comissoes"
          />
        ) : (
          <Indicador
            rotulo="Estoque baixo"
            valor={r.estoqueBaixo.length}
            detalhe="produto(s) no mínimo"
            icone={Package}
            href="/admin/estoque"
            destaque={r.estoqueBaixo.length > 0}
          />
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Secao
          titulo="Próximos atendimentos"
          acoes={
            <Link href="/admin/agenda" className="text-sm text-primaria">
              Ver agenda
            </Link>
          }
        >
          {r.proximos.length === 0 ? (
            <EstadoVazio icone={CalendarDays} titulo="Nenhum atendimento a seguir hoje" />
          ) : (
            <ul className="flex flex-col divide-y divide-borda">
              {r.proximos.map((a) => {
                const profissional = r.profissionais.get(a.profissionalId);
                return (
                  <li key={a.id} className="flex items-center gap-3 py-3 text-sm">
                    <span className="w-14 shrink-0 font-display text-lg">
                      {horaLocal(a.inicio, fuso)}
                    </span>
                    <span
                      className="h-9 w-1 shrink-0 rounded-full"
                      style={{ backgroundColor: profissional?.corAgenda }}
                      aria-hidden
                    />
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium">{a.cliente.nome}</span>
                      <span className="truncate text-xs text-suave">
                        {a.servico.nome} · {profissional?.nome}
                      </span>
                    </span>
                    <span className="rounded-full bg-nude px-2.5 py-0.5 text-xs">
                      {ROTULO_STATUS[a.status]}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Secao>

        <Secao
          titulo="Estoque baixo"
          acoes={
            <Link href="/admin/estoque" className="text-sm text-primaria">
              Ver estoque
            </Link>
          }
        >
          {r.estoqueBaixo.length === 0 ? (
            <p className="text-sm text-suave">Tudo em ordem por aqui.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {r.estoqueBaixo.slice(0, 6).map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/admin/estoque/${p.id}`}
                    className="flex justify-between gap-2 hover:text-primaria"
                  >
                    <span className="truncate">{p.nome}</span>
                    <span className="shrink-0 text-alerta">
                      {p.estoqueAtual.toLocaleString('pt-BR')} {p.unidade.toLowerCase()}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Secao>
      </div>
    </div>
  );
}
