import { Injectable } from '@nestjs/common';
import type { FormaPagamento, Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../shared/database/prisma.service.js';
import type { Fechamento } from '../comissoes/domain/calculo.js';
import type { SaidaEstoque } from '../produtos/produtos.service.js';
import { ajustarConferencia } from './domain/lancamento.js';

export const comDetalhes = {
  cliente: { select: { id: true, nome: true, telefone: true } },
  itens: {
    include: {
      profissional: {
        select: {
          id: true,
          nome: true,
          contratos: { where: { status: 'ATIVO' }, select: { servicoIds: true }, take: 1 },
        },
      },
      servico: { select: { precoAPartirDe: true } },
    },
    orderBy: { id: 'asc' as const },
  },
  pagamentos: {
    include: { maquininha: { select: { id: true, nome: true } } },
    orderBy: { id: 'asc' as const },
  },
  reaberturas: { orderBy: { reabertaEm: 'asc' as const } },
} satisfies Prisma.ComandaInclude;

/** Para onde vão os pagamentos no fechamento (ver domain/lancamento.ts). */
export type DestinoCaixa =
  | { tipo: 'NENHUM' }
  | { tipo: 'EXISTENTE'; caixaId: string }
  /** Dia passado sem caixa: usa o que existir naquele dia ou cria um "lançado depois". */
  | { tipo: 'DO_DIA'; inicio: Date; fim: Date; abertoEm: Date };

type Tx = Prisma.TransactionClient;

export interface NovoItem {
  tipo: 'SERVICO' | 'PRODUTO';
  servicoId?: string;
  profissionalId?: string;
  produtoId?: string;
  agendamentoId?: string;
  descricao: string;
  quantidade?: number;
  valorCentavos: number;
}

/** Todas as consultas filtram por salaoId (isolamento entre salões). */
@Injectable()
export class ComandasRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Abertas (todas) + fechadas/canceladas no período. */
  listar(salaoId: string, inicio: Date, fim: Date) {
    return this.prisma.comanda.findMany({
      where: {
        salaoId,
        OR: [{ status: 'ABERTA' }, { fechadaEm: { gte: inicio, lt: fim } }],
      },
      include: comDetalhes,
      orderBy: { numero: 'desc' },
    });
  }

  buscar(salaoId: string, id: string) {
    return this.prisma.comanda.findFirst({ where: { id, salaoId }, include: comDetalhes });
  }

  /** Cria com o próximo número do salão (trava por salão evita números repetidos). */
  criar(salaoId: string, dados: { clienteId?: string; abertaPorId: string; itens: NovoItem[] }) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('comanda'), hashtext(${salaoId}))`;
      const ultima = await tx.comanda.aggregate({ where: { salaoId }, _max: { numero: true } });
      return tx.comanda.create({
        data: {
          salaoId,
          numero: (ultima._max.numero ?? 0) + 1,
          clienteId: dados.clienteId,
          abertaPorId: dados.abertaPorId,
          itens: { create: dados.itens.map((i) => ({ ...i, salaoId })) },
        },
        include: comDetalhes,
      });
    });
  }

  adicionarItem(salaoId: string, comandaId: string, item: NovoItem) {
    return this.prisma.comandaItem.create({ data: { ...item, salaoId, comandaId } });
  }

  /** Altera valor/profissional de um item, só enquanto a comanda estiver ABERTA. */
  async atualizarItem(
    salaoId: string,
    comandaId: string,
    itemId: string,
    dados: { valorCentavos?: number; profissionalId?: string },
  ) {
    const { count } = await this.prisma.comandaItem.updateMany({
      where: { id: itemId, salaoId, comandaId, comanda: { status: 'ABERTA' } },
      data: dados,
    });
    return count > 0;
  }

  async removerItem(salaoId: string, comandaId: string, itemId: string) {
    const { count } = await this.prisma.comandaItem.deleteMany({
      where: { id: itemId, salaoId, comandaId, comanda: { status: 'ABERTA' } },
    });
    return count > 0;
  }

  atualizar(
    salaoId: string,
    id: string,
    dados: { descontoCentavos?: number; observacoes?: string | null; clienteId?: string | null },
  ) {
    return this.prisma.comanda.update({
      where: { id, salaoId },
      data: dados,
      include: comDetalhes,
    });
  }

  /**
   * Grava o fechamento (rateios, comissões, pagamentos e baixa de estoque) numa única
   * transação. Só fecha se ainda estiver ABERTA — dois cliques simultâneos não fecham
   * duas vezes. Null se não fechou.
   *
   * Exceção à regra de módulos: a baixa de estoque é gravada aqui (e não pelo
   * ProdutosService) para ficar na MESMA transação do fechamento. O que baixar é
   * calculado pelo ProdutosService.consumoDaComanda.
   */
  fechar(
    salaoId: string,
    id: string,
    fechamento: Fechamento,
    saidas: SaidaEstoque[],
    destino: DestinoCaixa,
    fechadaPorId: string,
    /** Data do atendimento (competência); "agora" na comanda normal. */
    fechadaEm: Date,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.comanda.updateMany({
        where: { id, salaoId, status: 'ABERTA' },
        data: {
          status: 'FECHADA',
          subtotalCentavos: fechamento.subtotalCentavos,
          totalCentavos: fechamento.totalCentavos,
          fechadaEm,
          lancadaEm: new Date(),
          competenciaEm: null,
          fechadaPorId,
        },
      });
      if (count === 0) return null;

      const caixaId = await this.resolverCaixa(tx, salaoId, destino, fechadaPorId);
      const dinheiro = fechamento.pagamentos
        .filter((p) => p.forma === 'DINHEIRO')
        .reduce((soma, p) => soma + p.valorCentavos, 0);
      if (caixaId) await this.ajustarCaixaFechado(tx, salaoId, caixaId, dinheiro);

      for (const item of fechamento.itens) {
        const { id: itemId, ...valores } = item;
        await tx.comandaItem.update({ where: { id: itemId, comandaId: id }, data: valores });
      }
      await tx.pagamento.createMany({
        data: fechamento.pagamentos.map((p) => ({
          comandaId: id,
          salaoId,
          forma: p.forma as FormaPagamento,
          valorCentavos: p.valorCentavos,
          taxaBps: p.taxaBps,
          taxaCentavos: p.taxaCentavos,
          maquininhaId: p.maquininhaId ?? null,
          parcelas: p.parcelas ?? null,
          caixaId,
        })),
      });
      for (const saida of saidas) {
        await tx.movimentoEstoque.create({
          data: {
            salaoId,
            produtoId: saida.produtoId,
            tipo: saida.tipo,
            quantidade: -saida.quantidade,
            comandaItemId: saida.comandaItemId,
            criadoPorId: fechadaPorId,
          },
        });
        await tx.produto.update({
          where: { id: saida.produtoId, salaoId },
          data: { estoqueAtual: { decrement: saida.quantidade } },
        });
      }
      return tx.comanda.findUniqueOrThrow({ where: { id }, include: comDetalhes });
    });
  }

  /**
   * Caixa que recebe os pagamentos. DO_DIA: com a trava do caixa, pega o caixa
   * daquele dia ou cria um já fechado e marcado "lançado depois".
   */
  private async resolverCaixa(
    tx: Tx,
    salaoId: string,
    destino: DestinoCaixa,
    usuarioId: string,
  ): Promise<string | null> {
    if (destino.tipo === 'NENHUM') return null;
    if (destino.tipo === 'EXISTENTE') return destino.caixaId;
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('caixa'), hashtext(${salaoId}))`;
    const existente = await tx.caixa.findFirst({
      where: { salaoId, abertoEm: { gte: destino.inicio, lt: destino.fim } },
      orderBy: { abertoEm: 'desc' },
      select: { id: true },
    });
    if (existente) return existente.id;
    const criado = await tx.caixa.create({
      data: {
        salaoId,
        status: 'FECHADO',
        lancadoDepois: true,
        trocoInicialCentavos: 0,
        abertoEm: destino.abertoEm,
        abertoPorId: usuarioId,
        fechadoEm: destino.abertoEm,
        fechadoPorId: usuarioId,
        esperadoDinheiroCentavos: 0,
        contadoDinheiroCentavos: 0,
        diferencaCentavos: 0,
        observacoes: 'Caixa criado pelo lançamento de comandas em data anterior.',
      },
      select: { id: true },
    });
    return criado.id;
  }

  /** Dinheiro entrou (+) ou saiu (−) de um caixa já FECHADO: recalcula a conferência. */
  private async ajustarCaixaFechado(tx: Tx, salaoId: string, caixaId: string, delta: number) {
    if (delta === 0) return;
    const caixa = await tx.caixa.findFirst({ where: { id: caixaId, salaoId } });
    if (!caixa || caixa.status !== 'FECHADO') return;
    await tx.caixa.update({
      where: { id: caixaId },
      data: ajustarConferencia(
        {
          esperadoCentavos: caixa.esperadoDinheiroCentavos ?? 0,
          contadoCentavos: caixa.contadoDinheiroCentavos ?? 0,
          lancadoDepois: caixa.lancadoDepois,
        },
        delta,
      ),
    });
  }

  /**
   * Desfaz o fechamento (só o dono; o service valida o prazo): guarda o histórico,
   * tira os pagamentos (recalculando caixa já fechado), devolve o estoque, limpa as
   * comissões e volta para ABERTA mantendo a data do atendimento.
   */
  reabrir(salaoId: string, id: string, motivo: string, usuarioId: string) {
    return this.prisma.$transaction(async (tx) => {
      const comanda = await tx.comanda.findFirst({
        where: { id, salaoId, status: 'FECHADA' },
        include: { itens: true, pagamentos: true },
      });
      if (!comanda?.fechadaEm) return 'NAO_FECHADA' as const;
      if (comanda.itens.some((i) => i.repasseId)) return 'REPASSE' as const;

      // Só reabre se ainda estiver FECHADA (dois cliques não reabrem duas vezes).
      const { count } = await tx.comanda.updateMany({
        where: { id, salaoId, status: 'FECHADA' },
        data: {
          status: 'ABERTA',
          competenciaEm: comanda.fechadaEm,
          fechadaEm: null,
          fechadaPorId: null,
          lancadaEm: null,
          subtotalCentavos: null,
          totalCentavos: null,
        },
      });
      if (count === 0) return 'NAO_FECHADA' as const;

      await tx.reaberturaComanda.create({
        data: {
          salaoId,
          comandaId: id,
          motivo,
          reabertaPorId: usuarioId,
          fechadaEmAnterior: comanda.fechadaEm,
          totalAnteriorCentavos: comanda.totalCentavos ?? 0,
          fechamentoAnterior: JSON.parse(
            JSON.stringify({ itens: comanda.itens, pagamentos: comanda.pagamentos }),
          ) as Prisma.InputJsonValue,
        },
      });

      // Pagamentos: tira o dinheiro da conferência de caixas já fechados.
      const dinheiroPorCaixa = new Map<string, number>();
      for (const p of comanda.pagamentos) {
        if (p.caixaId && p.forma === 'DINHEIRO') {
          dinheiroPorCaixa.set(p.caixaId, (dinheiroPorCaixa.get(p.caixaId) ?? 0) + p.valorCentavos);
        }
      }
      for (const [caixaId, valor] of dinheiroPorCaixa) {
        await this.ajustarCaixaFechado(tx, salaoId, caixaId, -valor);
      }
      await tx.pagamento.deleteMany({ where: { comandaId: id, salaoId } });

      // Estoque: devolve o que o fechamento baixou (consumo e venda).
      const itemIds = comanda.itens.map((i) => i.id);
      const movimentos = await tx.movimentoEstoque.findMany({
        where: { salaoId, comandaItemId: { in: itemIds } },
      });
      for (const m of movimentos) {
        await tx.produto.update({
          where: { id: m.produtoId, salaoId },
          data: { estoqueAtual: { increment: -m.quantidade } },
        });
      }
      await tx.movimentoEstoque.deleteMany({ where: { salaoId, comandaItemId: { in: itemIds } } });

      // Comissões e rateios são recalculados no novo fechamento.
      await tx.comandaItem.updateMany({
        where: { comandaId: id, salaoId },
        data: {
          descontoRateadoCentavos: null,
          taxaRateadaCentavos: null,
          baseComissaoCentavos: null,
          comissaoBps: null,
          comissaoCentavos: null,
          custoProdutosCentavos: null,
        },
      });
      return 'OK' as const;
    });
  }

  /** Muda a data do atendimento de uma comanda ABERTA (null = hoje). */
  async definirCompetencia(salaoId: string, id: string, competenciaEm: Date | null) {
    const { count } = await this.prisma.comanda.updateMany({
      where: { id, salaoId, status: 'ABERTA' },
      data: { competenciaEm },
    });
    return count > 0;
  }

  /**
   * Cancela a comanda aberta e solta os agendamentos dos itens: assim eles podem
   * ir para outra comanda (o vínculo item ↔ agendamento é único).
   */
  cancelar(salaoId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.comanda.updateMany({
        where: { id, salaoId, status: 'ABERTA' },
        data: { status: 'CANCELADA', fechadaEm: new Date() },
      });
      if (count === 0) return false;
      await tx.comandaItem.updateMany({
        where: { comandaId: id, salaoId, agendamentoId: { not: null } },
        data: { agendamentoId: null },
      });
      return true;
    });
  }
}
