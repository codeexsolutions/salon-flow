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

  historico(salaoId: string, inicio: Date, fim: Date) {
    return this.prisma.caixa.findMany({
      where: { salaoId, abertoEm: { gte: inicio, lt: fim } },
      include: comValores,
      orderBy: { abertoEm: 'desc' },
      take: 100,
    });
  }
}
