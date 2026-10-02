import { Injectable } from '@nestjs/common';
import type {
  AtualizarServicoInput,
  CriarServicoInput,
  DefinirProfissionaisServicoInput,
} from '@salonflow/shared';
import { PrismaService } from '../../shared/database/prisma.service.js';

const contarProfissionaisAtivos = {
  _count: { select: { profissionais: { where: { profissional: { ativo: true } } } } },
};

const comProfissionais = {
  profissionais: {
    include: { profissional: { select: { nome: true, corAgenda: true, ativo: true } } },
    orderBy: { profissional: { nome: 'asc' as const } },
  },
};

/** Todas as consultas filtram por salaoId (isolamento entre salões). */
@Injectable()
export class ServicosRepository {
  constructor(private readonly prisma: PrismaService) {}

  listar(salaoId: string, incluirInativos: boolean) {
    return this.prisma.servico.findMany({
      where: { salaoId, ...(incluirInativos ? {} : { ativo: true }) },
      include: contarProfissionaisAtivos,
      orderBy: [{ ativo: 'desc' }, { categoria: 'asc' }, { nome: 'asc' }],
    });
  }

  buscar(salaoId: string, id: string) {
    return this.prisma.servico.findFirst({
      where: { id, salaoId },
      include: { ...contarProfissionaisAtivos, ...comProfissionais },
    });
  }

  /** Serviço ativo + profissionais ATIVOS que o fazem (com valores próprios). */
  paraAgendamento(salaoId: string, id: string, profissionalId?: string, somenteOnline = false) {
    return this.prisma.servico.findFirst({
      where: { id, salaoId, ativo: true, ...(somenteOnline && { visivelOnline: true }) },
      include: {
        profissionais: {
          where: { profissional: { ativo: true }, ...(profissionalId && { profissionalId }) },
          include: { profissional: { select: { nome: true } } },
          orderBy: { profissional: { nome: 'asc' } },
        },
      },
    });
  }

  /** Serviços que o cliente pode agendar pelo app (ativos, online e com profissional ativo). */
  catalogoOnline(salaoId: string) {
    return this.prisma.servico.findMany({
      where: {
        salaoId,
        ativo: true,
        visivelOnline: true,
        profissionais: { some: { profissional: { ativo: true } } },
      },
      include: {
        profissionais: {
          where: { profissional: { ativo: true } },
          include: { profissional: { select: { nome: true } } },
          orderBy: { profissional: { nome: 'asc' } },
        },
      },
      orderBy: [{ categoria: 'asc' }, { nome: 'asc' }],
    });
  }

  contarDoSalao(salaoId: string, ids: string[]) {
    return this.prisma.servico.count({ where: { salaoId, id: { in: ids } } });
  }

  async nomeEmUso(salaoId: string, nome: string, ignorarId?: string) {
    const total = await this.prisma.servico.count({
      where: {
        salaoId,
        nome: { equals: nome, mode: 'insensitive' },
        ...(ignorarId && { id: { not: ignorarId } }),
      },
    });
    return total > 0;
  }

  criar(salaoId: string, dados: CriarServicoInput) {
    return this.prisma.servico.create({
      data: { ...dados, salaoId },
      include: contarProfissionaisAtivos,
    });
  }

  atualizar(salaoId: string, id: string, dados: AtualizarServicoInput) {
    return this.prisma.servico.update({
      where: { id, salaoId },
      data: dados,
      include: contarProfissionaisAtivos,
    });
  }

  /** Substitui a lista inteira de quem faz o serviço. */
  substituirProfissionais(
    salaoId: string,
    servicoId: string,
    { profissionais }: DefinirProfissionaisServicoInput,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.servicoProfissional.deleteMany({ where: { salaoId, servicoId } });
      await tx.servicoProfissional.createMany({
        data: profissionais.map((p) => ({ ...p, salaoId, servicoId })),
      });
      return tx.servico.findFirstOrThrow({
        where: { id: servicoId, salaoId },
        include: { ...contarProfissionaisAtivos, ...comProfissionais },
      });
    });
  }
}
