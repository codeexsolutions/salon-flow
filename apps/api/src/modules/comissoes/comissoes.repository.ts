import { Injectable } from '@nestjs/common';
import type { ConfiguracaoComissao, DefinirRegrasComissaoInput } from '@salonflow/shared';
import type { FormaPagamento } from '../../generated/prisma/client.js';
import { PrismaService } from '../../shared/database/prisma.service.js';

/** Todas as consultas filtram por salaoId (isolamento entre salões). */
@Injectable()
export class ComissoesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async configuracao(salaoId: string) {
    const [salao, taxas] = await Promise.all([
      this.prisma.salao.findUniqueOrThrow({
        where: { id: salaoId },
        select: {
          comissaoPadraoBps: true,
          comissaoSobreLiquido: true,
          comissaoDescontaProdutos: true,
        },
      }),
      this.prisma.taxaPagamento.findMany({
        where: { salaoId },
        select: { forma: true, taxaBps: true },
      }),
    ]);
    return { ...salao, taxas };
  }

  salvarConfiguracao(salaoId: string, { taxas, ...geral }: ConfiguracaoComissao) {
    return this.prisma.$transaction(async (tx) => {
      await tx.salao.update({ where: { id: salaoId }, data: geral });
      await tx.taxaPagamento.deleteMany({ where: { salaoId } });
      await tx.taxaPagamento.createMany({
        data: taxas.filter((t) => t.taxaBps > 0).map((t) => ({ ...t, salaoId })),
      });
    });
  }

  regras(salaoId: string) {
    return this.prisma.regraComissao.findMany({
      where: { salaoId },
      select: { profissionalId: true, servicoId: true, percentualBps: true },
    });
  }

  substituirRegras(salaoId: string, { regras }: DefinirRegrasComissaoInput) {
    return this.prisma.$transaction([
      this.prisma.regraComissao.deleteMany({ where: { salaoId } }),
      this.prisma.regraComissao.createMany({ data: regras.map((r) => ({ ...r, salaoId })) }),
    ]);
  }

  /** Itens de comandas FECHADAS no período (comissão já gravada). */
  itensDoPeriodo(salaoId: string, inicio: Date, fim: Date, profissionalId?: string) {
    return this.prisma.comandaItem.findMany({
      where: {
        salaoId,
        tipo: 'SERVICO',
        profissionalId: profissionalId ?? { not: null },
        comanda: { status: 'FECHADA', fechadaEm: { gte: inicio, lt: fim } },
      },
      include: {
        profissional: { select: { nome: true } },
        comanda: { select: { numero: true, fechadaEm: true, cliente: { select: { nome: true } } } },
      },
      orderBy: { comanda: { fechadaEm: 'asc' } },
    });
  }

  // ---------- Repasses ----------

  /**
   * Gera o repasse com as comissões PENDENTES do profissional no período.
   * Trava por profissional: dois cliques não incluem o mesmo item em dois repasses.
   * `montar` calcula os totais (regra de domínio) a partir dos itens encontrados.
   */
  gerarRepasse(
    salaoId: string,
    profissionalId: string,
    periodo: { de: string; ate: string; inicio: Date; fim: Date },
    montar: (itens: { valorCentavos: number; comissaoCentavos: number }[]) => {
      totalServicosCentavos: number;
      totalComissaoCentavos: number;
      descontosCentavos: number;
      valorPagoCentavos: number;
    },
    extras: { formaPagamento?: FormaPagamento; observacoes?: string; criadoPorId: string },
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('repasse'), hashtext(${profissionalId}))`;
      const itens = await tx.comandaItem.findMany({
        where: {
          salaoId,
          profissionalId,
          tipo: 'SERVICO',
          repasseId: null,
          comanda: { status: 'FECHADA', fechadaEm: { gte: periodo.inicio, lt: periodo.fim } },
        },
        select: { id: true, valorCentavos: true, comissaoCentavos: true },
      });
      const totais = montar(
        itens.map((i) => ({
          valorCentavos: i.valorCentavos,
          comissaoCentavos: i.comissaoCentavos ?? 0,
        })),
      );
      const repasse = await tx.repasse.create({
        data: {
          salaoId,
          profissionalId,
          de: periodo.de,
          ate: periodo.ate,
          totalServicosCentavos: totais.totalServicosCentavos,
          totalComissaoCentavos: totais.totalComissaoCentavos,
          descontosCentavos: totais.descontosCentavos,
          valorPagoCentavos: totais.valorPagoCentavos,
          ...extras,
        },
      });
      await tx.comandaItem.updateMany({
        where: { id: { in: itens.map((i) => i.id) } },
        data: { repasseId: repasse.id },
      });
      return repasse;
    });
  }

  listarRepasses(salaoId: string, profissionalId?: string) {
    return this.prisma.repasse.findMany({
      where: { salaoId, ...(profissionalId && { profissionalId }) },
      include: { profissional: { select: { id: true, nome: true } } },
      orderBy: { pagoEm: 'desc' },
      take: 100,
    });
  }

  buscarRepasse(salaoId: string, id: string) {
    return this.prisma.repasse.findFirst({
      where: { id, salaoId },
      include: {
        profissional: { select: { id: true, nome: true } },
        salao: { select: { nome: true, cidade: true, uf: true, fusoHorario: true } },
        itens: {
          select: {
            descricao: true,
            valorCentavos: true,
            comissaoCentavos: true,
            comanda: {
              select: { numero: true, fechadaEm: true, cliente: { select: { nome: true } } },
            },
          },
          orderBy: { comanda: { fechadaEm: 'asc' } },
        },
      },
    });
  }

  /** Cancela (só se PAGO) e devolve os itens para "pendente". */
  cancelarRepasse(salaoId: string, id: string) {
    return this.prisma.$transaction(async (tx) => {
      const { count } = await tx.repasse.updateMany({
        where: { id, salaoId, status: 'PAGO' },
        data: { status: 'CANCELADO', canceladoEm: new Date() },
      });
      if (count === 0) return false;
      await tx.comandaItem.updateMany({ where: { repasseId: id }, data: { repasseId: null } });
      return true;
    });
  }
}
