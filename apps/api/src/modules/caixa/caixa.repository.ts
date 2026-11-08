import { Injectable } from '@nestjs/common';
import type { MovimentoCaixaInput } from '@salonflow/shared';
import { PrismaService } from '../../shared/database/prisma.service.js';

/**
 * Todas as consultas filtram por salaoId. Exceção à regra de módulos: o caixa LÊ a
 * tabela de pagamentos (das comandas) para conferir os valores recebidos.
 */
const comValores = {
  movimentos: { orderBy: { criadoEm: 'asc' as const } },
  pagamentos: { select: { forma: true, valorCentavos: true } },
  reaberturas: { orderBy: { reabertoEm: 'asc' as const } },
};

@Injectable()
export class CaixaRepository {
  constructor(private readonly prisma: PrismaService) {}

  aberto(salaoId: string) {
    return this.prisma.caixa.findFirst({
      where: { salaoId, status: 'ABERTO' },
      include: comValores,
    });
  }

  idDoAberto(salaoId: string) {
    return this.prisma.caixa.findFirst({
      where: { salaoId, status: 'ABERTO' },
      select: { id: true },
    });
  }

  buscar(salaoId: string, id: string) {
    return this.prisma.caixa.findFirst({ where: { id, salaoId }, include: comValores });
  }

  /** Abre se não houver outro aberto (trava por salão). Null se já existir um aberto. */
  abrir(salaoId: string, trocoInicialCentavos: number, abertoPorId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('caixa'), hashtext(${salaoId}))`;
      const jaAberto = await tx.caixa.count({ where: { salaoId, status: 'ABERTO' } });
      if (jaAberto > 0) return null;
      return tx.caixa.create({ data: { salaoId, trocoInicialCentavos, abertoPorId } });
    });
  }

  registrarMovimento(
    salaoId: string,
    caixaId: string,
    dados: MovimentoCaixaInput,
    criadoPorId: string,
  ) {
    return this.prisma.movimentoCaixa.create({
      data: { ...dados, salaoId, caixaId, criadoPorId },
    });
  }

  /** Fecha só se ainda estiver ABERTO. False se já tinha sido fechado. */
  async fechar(
    salaoId: string,
    id: string,
    dados: {
      esperadoDinheiroCentavos: number;
      contadoDinheiroCentavos: number;
      diferencaCentavos: number;
      observacoes?: string;
      fechadoPorId: string;
    },
  ) {
    const { count } = await this.prisma.caixa.updateMany({
      where: { id, salaoId, status: 'ABERTO' },
      data: { ...dados, status: 'FECHADO', fechadoEm: new Date() },
    });
    return count > 0;
  }

  /**
   * Reabre um caixa FECHADO guardando o fechamento desfeito. Mesma trava da abertura:
   * só se não houver outro aberto e se for o caixa mais recente do salão.
   */
  reabrir(salaoId: string, id: string, motivo: string, reabertoPorId: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('caixa'), hashtext(${salaoId}))`;
      if ((await tx.caixa.count({ where: { salaoId, status: 'ABERTO' } })) > 0) {
        return 'OUTRO_ABERTO' as const;
      }
      const caixa = await tx.caixa.findFirst({ where: { id, salaoId } });
      if (!caixa) return 'NAO_ENCONTRADO' as const;
      if (caixa.status !== 'FECHADO') return 'NAO_FECHADO' as const;
      const maisRecente = await tx.caixa.findFirst({
        where: { salaoId },
        orderBy: { abertoEm: 'desc' },
        select: { id: true },
      });
      if (maisRecente?.id !== id) return 'NAO_E_O_ULTIMO' as const;

      await tx.reaberturaCaixa.create({
        data: {
          salaoId,
          caixaId: id,
          motivo,
          reabertoPorId,
          fechadoEmAnterior: caixa.fechadoEm ?? new Date(),
          esperadoAnteriorCentavos: caixa.esperadoDinheiroCentavos ?? 0,
          contadoAnteriorCentavos: caixa.contadoDinheiroCentavos ?? 0,
          diferencaAnteriorCentavos: caixa.diferencaCentavos ?? 0,
        },
      });
      await tx.caixa.update({
        where: { id },
        data: {
          status: 'ABERTO',
          fechadoEm: null,
          fechadoPorId: null,
          esperadoDinheiroCentavos: null,
          contadoDinheiroCentavos: null,
          diferencaCentavos: null,
        },
      });
      return 'OK' as const;
    });
  }

  historico(salaoId: string, inicio: Date, fim: Date) {
    return this.prisma.caixa.findMany({
      where: { salaoId, abertoEm: { gte: inicio, lt: fim } },
      include: comValores,
      orderBy: { abertoEm: 'desc' },
      take: 100,
    });
  }
}
