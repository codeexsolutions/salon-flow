import { Injectable } from '@nestjs/common';
import type { AtualizarProfissionalInput, CriarProfissionalInput } from '@salonflow/shared';
import { PrismaService } from '../../shared/database/prisma.service.js';
import type { IntervaloMin } from './domain/jornada.js';

const comJornada = {
  jornada: { orderBy: [{ diaSemana: 'asc' as const }, { inicioMin: 'asc' as const }] },
};

/** Todas as consultas filtram por salaoId (isolamento entre salões). */
@Injectable()
export class ProfissionaisRepository {
  constructor(private readonly prisma: PrismaService) {}

  listar(salaoId: string, incluirInativos: boolean) {
    return this.prisma.profissional.findMany({
      where: { salaoId, ...(incluirInativos ? {} : { ativo: true }) },
      orderBy: [{ ativo: 'desc' }, { nome: 'asc' }],
    });
  }

  buscar(salaoId: string, id: string) {
    return this.prisma.profissional.findFirst({ where: { id, salaoId }, include: comJornada });
  }

  /** Profissionais ativos com jornada completa e as folgas que tocam o período. */
  dadosDeAgenda(salaoId: string, inicio: Date, fim: Date, ids?: string[]) {
    return this.prisma.profissional.findMany({
      where: { salaoId, ativo: true, ...(ids && { id: { in: ids } }) },
      select: {
        id: true,
        nome: true,
        corAgenda: true,
        jornada: { orderBy: [{ diaSemana: 'asc' }, { inicioMin: 'asc' }] },
        bloqueios: { where: { inicio: { lt: fim }, fim: { gt: inicio } } },
      },
      orderBy: { nome: 'asc' },
    });
  }

  buscarPorUsuario(salaoId: string, usuarioId: string) {
    return this.prisma.profissional.findFirst({
      where: { salaoId, usuarioId, ativo: true },
      select: { id: true, nome: true, corAgenda: true },
    });
  }

  contarAtivos(salaoId: string, ids: string[]) {
    return this.prisma.profissional.count({ where: { salaoId, ativo: true, id: { in: ids } } });
  }

  async emailEmUso(salaoId: string, email: string, ignorarId?: string) {
    const total = await this.prisma.profissional.count({
      where: { salaoId, email, ...(ignorarId && { id: { not: ignorarId } }) },
    });
    return total > 0;
  }

  criar(salaoId: string, dados: CriarProfissionalInput) {
    return this.prisma.profissional.create({ data: { ...dados, salaoId } });
  }

  /** Atualiza o profissional e liga/desliga o acesso dele ao app junto com `ativo`. */
  atualizar(salaoId: string, id: string, dados: AtualizarProfissionalInput) {
    return this.prisma.$transaction(async (tx) => {
      const profissional = await tx.profissional.update({ where: { id, salaoId }, data: dados });

      if (dados.ativo !== undefined && profissional.usuarioId) {
        await tx.membroSalao.updateMany({
          where: { salaoId, usuarioId: profissional.usuarioId, papel: 'PROFISSIONAL' },
          data: { ativo: dados.ativo },
        });
      }
      return profissional;
    });
  }

  substituirJornada(salaoId: string, profissionalId: string, intervalos: IntervaloMin[]) {
    return this.prisma.$transaction(async (tx) => {
      await tx.jornadaIntervalo.deleteMany({ where: { salaoId, profissionalId } });
      await tx.jornadaIntervalo.createMany({
        data: intervalos.map((i) => ({ ...i, salaoId, profissionalId })),
      });
      return tx.profissional.findFirstOrThrow({
        where: { id: profissionalId, salaoId },
        include: comJornada,
      });
    });
  }

  listarBloqueios(salaoId: string, profissionalId: string, aPartirDe: Date) {
    return this.prisma.bloqueioAgenda.findMany({
      where: { salaoId, profissionalId, fim: { gte: aPartirDe } },
      orderBy: { inicio: 'asc' },
    });
  }

  criarBloqueio(
    salaoId: string,
    profissionalId: string,
    dados: { inicio: Date; fim: Date; motivo?: string },
  ) {
    return this.prisma.bloqueioAgenda.create({ data: { ...dados, salaoId, profissionalId } });
  }

  async removerBloqueio(salaoId: string, profissionalId: string, id: string) {
    const { count } = await this.prisma.bloqueioAgenda.deleteMany({
      where: { id, salaoId, profissionalId },
    });
    return count > 0;
  }

  /**
   * Vincula o usuário aos profissionais cadastrados com o e-mail dele (em qualquer salão)
   * e dá acesso ao app como PROFISSIONAL — sem rebaixar quem já é DONO/RECEPCAO.
   */
  vincularPorEmail(usuarioId: string, email: string) {
    return this.prisma.$transaction(async (tx) => {
      const pendentes = await tx.profissional.findMany({
        where: { email, usuarioId: null, ativo: true },
        select: { id: true, salaoId: true },
      });

      for (const p of pendentes) {
        await tx.profissional.update({ where: { id: p.id }, data: { usuarioId } });
        await tx.membroSalao.upsert({
          where: { salaoId_usuarioId: { salaoId: p.salaoId, usuarioId } },
          create: { salaoId: p.salaoId, usuarioId, papel: 'PROFISSIONAL' },
          update: {},
        });
      }
      return pendentes.length;
    });
  }
}
