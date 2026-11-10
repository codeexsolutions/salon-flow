import { Injectable } from '@nestjs/common';
import type { PremioFidelidadeInput, ProgramaFidelidadeInput } from '@salonflow/shared';
import type { Prisma, TipoMovimentoPontos } from '../../generated/prisma/client.js';
import { PrismaService } from '../../shared/database/prisma.service.js';

export interface NovoMovimento {
  salaoId: string;
  clienteId: string;
  tipo: TipoMovimentoPontos;
  pontos: number;
  descricao: string;
  data: Date;
  expiraEm: Date | null;
  premioId?: string;
  criadoPorId?: string;
}

const SELECT_MOVIMENTO = {
  id: true,
  tipo: true,
  pontos: true,
  descricao: true,
  data: true,
  expiraEm: true,
  comandaId: true,
} as const;

/** Todas as consultas filtram por salaoId (isolamento entre salões). */
@Injectable()
export class FidelidadeRepository {
  constructor(private readonly prisma: PrismaService) {}

  programa(salaoId: string) {
    return this.prisma.programaFidelidade.findUnique({ where: { salaoId } });
  }

  salvarPrograma(salaoId: string, dados: ProgramaFidelidadeInput) {
    return this.prisma.programaFidelidade.upsert({
      where: { salaoId },
      create: { salaoId, ...dados },
      update: dados,
    });
  }

  premios(salaoId: string, somenteAtivos = false) {
    return this.prisma.premioFidelidade.findMany({
      where: { salaoId, ...(somenteAtivos && { ativo: true }) },
      orderBy: [{ ativo: 'desc' }, { pontos: 'asc' }],
    });
  }

  premio(salaoId: string, id: string) {
    return this.prisma.premioFidelidade.findFirst({ where: { id, salaoId } });
  }

  criarPremio(salaoId: string, dados: PremioFidelidadeInput) {
    return this.prisma.premioFidelidade.create({ data: { salaoId, ...dados } });
  }

  atualizarPremio(salaoId: string, id: string, dados: PremioFidelidadeInput) {
    return this.prisma.premioFidelidade.update({ where: { id, salaoId }, data: dados });
  }

  clienteExiste(salaoId: string, id: string) {
    return this.prisma.cliente.count({ where: { id, salaoId } }).then((n) => n > 0);
  }

  /** Extrato completo (o saldo depende de todos os movimentos), mais recente primeiro. */
  movimentos(salaoId: string, clienteId: string, db: Prisma.TransactionClient = this.prisma) {
    return db.movimentoPontos.findMany({
      where: { salaoId, clienteId },
      orderBy: [{ data: 'desc' }, { criadoEm: 'desc' }],
      select: SELECT_MOVIMENTO,
    });
  }

  /**
   * Débito com saldo conferido dentro da transação: trava o cliente para dois
   * resgates simultâneos não passarem do saldo.
   */
  debitar(
    novo: NovoMovimento,
    saldoSuficiente: (
      movimentos: { pontos: number; data: Date; expiraEm: Date | null }[],
    ) => boolean,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM clientes WHERE id = ${novo.clienteId}::uuid FOR UPDATE`;
      const movimentos = await this.movimentos(novo.salaoId, novo.clienteId, tx);
      if (!saldoSuficiente(movimentos)) return null;
      return tx.movimentoPontos.create({ data: novo, select: SELECT_MOVIMENTO });
    });
  }

  criarMovimento(novo: NovoMovimento) {
    return this.prisma.movimentoPontos.create({ data: novo, select: SELECT_MOVIMENTO });
  }

  comandaFechada(salaoId: string, id: string) {
    return this.prisma.comanda.findFirst({
      where: { id, salaoId, status: 'FECHADA' },
      select: { id: true, numero: true, clienteId: true, totalCentavos: true, fechadaEm: true },
    });
  }

  /** Ganho da comanda (um por comanda; fechar de novo substitui). */
  gravarGanho(comandaId: string, ganho: NovoMovimento) {
    return this.prisma.movimentoPontos.upsert({
      where: { comandaId },
      create: { ...ganho, comandaId },
      update: {
        clienteId: ganho.clienteId,
        pontos: ganho.pontos,
        descricao: ganho.descricao,
        data: ganho.data,
        expiraEm: ganho.expiraEm,
      },
    });
  }

  removerGanho(salaoId: string, comandaId: string) {
    return this.prisma.movimentoPontos.deleteMany({ where: { salaoId, comandaId } });
  }

  /** App do cliente: cadastros dele nos salões com programa ativo. */
  cadastrosComPrograma(usuarioId: string) {
    return this.prisma.cliente.findMany({
      where: { usuarioId, salao: { programaFidelidade: { ativo: true } } },
      select: {
        id: true,
        salaoId: true,
        salao: {
          select: {
            nome: true,
            slug: true,
            programaFidelidade: true,
            premiosFidelidade: { where: { ativo: true }, orderBy: { pontos: 'asc' } },
          },
        },
      },
    });
  }
}
