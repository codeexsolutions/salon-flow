import { Injectable } from '@nestjs/common';
import type { ConfiguracaoComissao, DefinirRegrasComissaoInput } from '@salonflow/shared';
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
}
