import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service.js';
import type { ComandaFaturada } from './domain/relatorio.js';

/** Todas as consultas filtram por salaoId (isolamento entre salões). */
@Injectable()
export class FaturamentoRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Comandas fechadas com data de atendimento em [inicio, fim). */
  async comandasFechadas(salaoId: string, inicio: Date, fim: Date): Promise<ComandaFaturada[]> {
    const comandas = await this.prisma.comanda.findMany({
      where: { salaoId, status: 'FECHADA', fechadaEm: { gte: inicio, lt: fim } },
      select: {
        fechadaEm: true,
        subtotalCentavos: true,
        descontoCentavos: true,
        totalCentavos: true,
        itens: {
          select: {
            tipo: true,
            servicoId: true,
            produtoId: true,
            profissionalId: true,
            profissional: { select: { nome: true } },
            descricao: true,
            quantidade: true,
            valorCentavos: true,
            comissaoCentavos: true,
            custoProdutosCentavos: true,
          },
        },
        pagamentos: { select: { forma: true, valorCentavos: true, taxaCentavos: true } },
      },
    });
    return comandas.map(({ fechadaEm, itens, ...c }) => ({
      ...c,
      fechadaEm: fechadaEm!,
      itens: itens.map(({ profissional, ...i }) => ({
        ...i,
        profissionalNome: profissional?.nome ?? null,
      })),
    }));
  }
}
