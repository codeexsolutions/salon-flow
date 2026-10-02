import { Injectable } from '@nestjs/common';
import type { StatusComanda } from '@salonflow/shared';
import type { FormaPagamento, Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../shared/database/prisma.service.js';
import type { Fechamento } from '../comissoes/domain/calculo.js';
import type { SaidaEstoque } from '../produtos/produtos.service.js';

export const comDetalhes = {
  cliente: { select: { id: true, nome: true } },
  itens: {
    include: { profissional: { select: { id: true, nome: true } } },
    orderBy: { id: 'asc' as const },
  },
  pagamentos: { orderBy: { id: 'asc' as const } },
} satisfies Prisma.ComandaInclude;

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
    /** Caixa aberto no momento (os pagamentos entram nele), se houver. */
    caixaId: string | null,
    fechadaPorId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.comanda.updateMany({
        where: { id, salaoId, status: 'ABERTA' },
        data: {
          status: 'FECHADA',
          subtotalCentavos: fechamento.subtotalCentavos,
          totalCentavos: fechamento.totalCentavos,
          fechadaEm: new Date(),
          fechadaPorId,
        },
      });
      if (count === 0) return null;

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

  async alterarStatus(salaoId: string, id: string, de: StatusComanda, para: StatusComanda) {
    const { count } = await this.prisma.comanda.updateMany({
      where: { id, salaoId, status: de },
      data: { status: para, ...(para === 'CANCELADA' && { fechadaEm: new Date() }) },
    });
    return count > 0;
  }
}
