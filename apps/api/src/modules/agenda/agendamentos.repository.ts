import { Injectable } from '@nestjs/common';
import { STATUS_QUE_OCUPAM, type StatusAgendamento } from '@salonflow/shared';
import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../shared/database/prisma.service.js';

const comDetalhes = {
  cliente: { select: { id: true, nome: true, telefone: true } },
  servico: { select: { id: true, nome: true } },
} as const;

type Tx = Prisma.TransactionClient;

interface NovoHorario {
  profissionalId: string;
  inicio: Date;
  fim: Date;
}

/** Todas as consultas filtram por salaoId (isolamento entre salões). */
@Injectable()
export class AgendamentosRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Agendamentos (exceto cancelados) que tocam o período, para exibir na agenda. */
  listarDoPeriodo(salaoId: string, inicio: Date, fim: Date) {
    return this.prisma.agendamento.findMany({
      where: { salaoId, inicio: { lt: fim }, fim: { gt: inicio }, status: { not: 'CANCELADO' } },
      include: comDetalhes,
      orderBy: { inicio: 'asc' },
    });
  }

  /** Períodos que ocupam os profissionais (para calcular horários livres). */
  ocupacoes(
    salaoId: string,
    profissionalIds: string[],
    inicio: Date,
    fim: Date,
    ignorarId?: string,
  ) {
    return this.prisma.agendamento.findMany({
      where: {
        salaoId,
        profissionalId: { in: profissionalIds },
        status: { in: STATUS_QUE_OCUPAM },
        inicio: { lt: fim },
        fim: { gt: inicio },
        ...(ignorarId && { id: { not: ignorarId } }),
      },
      select: { profissionalId: true, inicio: true, fim: true },
    });
  }

  /** Agendamentos futuros ainda em aberto do cliente neste salão. */
  contarAbertosDoCliente(salaoId: string, clienteId: string, agora: Date) {
    return this.prisma.agendamento.count({
      where: {
        salaoId,
        clienteId,
        status: { in: ['AGENDADO', 'CONFIRMADO'] },
        inicio: { gte: agora },
      },
    });
  }

  /**
   * Agendamentos do USUÁRIO (cliente do app) em todos os salões. Filtra pela conta
   * vinculada à ficha do cliente — nunca expõe dados de outros clientes.
   */
  doUsuario(usuarioId: string, desde: Date) {
    return this.prisma.agendamento.findMany({
      where: { cliente: { usuarioId }, inicio: { gte: desde } },
      include: {
        salao: { select: { nome: true, slug: true, fusoHorario: true, telefone: true } },
        servico: { select: { nome: true } },
        profissional: { select: { nome: true } },
      },
      orderBy: { inicio: 'asc' },
      take: 100,
    });
  }

  buscarDoUsuario(usuarioId: string, id: string) {
    return this.prisma.agendamento.findFirst({ where: { id, cliente: { usuarioId } } });
  }

  buscar(salaoId: string, id: string) {
    return this.prisma.agendamento.findFirst({ where: { id, salaoId }, include: comDetalhes });
  }

  /**
   * Cria o agendamento SÓ se o profissional estiver livre. A trava por profissional
   * (advisory lock) impede que duas pessoas reservem o mesmo horário ao mesmo tempo.
   * Devolve null em caso de conflito.
   */
  inserirSemConflito(dados: Prisma.AgendamentoUncheckedCreateInput) {
    return this.prisma.$transaction(async (tx) => {
      const horario = {
        profissionalId: dados.profissionalId,
        inicio: new Date(dados.inicio),
        fim: new Date(dados.fim),
      };
      if (await this.ocupadoComTrava(tx, dados.salaoId, horario)) return null;
      return tx.agendamento.create({ data: dados, include: comDetalhes });
    });
  }

  /** Muda horário/profissional SÓ se o novo horário estiver livre. Null em caso de conflito. */
  remarcarSemConflito(salaoId: string, id: string, novo: NovoHorario & { precoCentavos: number }) {
    return this.prisma.$transaction(async (tx) => {
      if (await this.ocupadoComTrava(tx, salaoId, novo, id)) return null;
      return tx.agendamento.update({
        where: { id, salaoId },
        data: novo,
        include: comDetalhes,
      });
    });
  }

  atualizarStatus(salaoId: string, id: string, status: StatusAgendamento) {
    return this.prisma.agendamento.update({
      where: { id, salaoId },
      data: { status },
      include: comDetalhes,
    });
  }

  private async ocupadoComTrava(tx: Tx, salaoId: string, h: NovoHorario, ignorarId?: string) {
    // Liberada automaticamente no fim da transação.
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('agenda'), hashtext(${h.profissionalId}))`;
    const conflitos = await tx.agendamento.count({
      where: {
        salaoId,
        profissionalId: h.profissionalId,
        status: { in: STATUS_QUE_OCUPAM },
        inicio: { lt: h.fim },
        fim: { gt: h.inicio },
        ...(ignorarId && { id: { not: ignorarId } }),
      },
    });
    return conflitos > 0;
  }
}
