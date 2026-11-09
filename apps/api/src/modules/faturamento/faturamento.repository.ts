import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service.js';
import type { ComandaFaturada, MovimentoAvulso } from './domain/relatorio.js';

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

  /** Entradas/saídas avulsas dos caixas abertos em [inicio, fim) (dia do caixa). */
  async movimentosDoCaixa(salaoId: string, inicio: Date, fim: Date): Promise<MovimentoAvulso[]> {
    const movimentos = await this.prisma.movimentoCaixa.findMany({
      where: { salaoId, caixa: { abertoEm: { gte: inicio, lt: fim } } },
      select: {
        tipo: true,
        forma: true,
        valorCentavos: true,
        motivo: true,
        criadoEm: true,
        caixa: { select: { abertoEm: true } },
      },
    });
    return movimentos.map(({ caixa, ...m }) => ({ ...m, diaDoCaixa: caixa.abertoEm }));
  }
}
