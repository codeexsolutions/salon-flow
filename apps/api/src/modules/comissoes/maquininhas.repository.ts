import { Injectable } from '@nestjs/common';
import type { MaquininhaInput } from '@salonflow/shared';
import { PrismaService } from '../../shared/database/prisma.service.js';

/** Todas as consultas filtram por salaoId (isolamento entre salões). */
@Injectable()
export class MaquininhasRepository {
  constructor(private readonly prisma: PrismaService) {}

  listar(salaoId: string) {
    return this.prisma.maquininha.findMany({
      where: { salaoId },
      orderBy: [{ ativo: 'desc' }, { nome: 'asc' }],
    });
  }

  buscarVarias(salaoId: string, ids: string[]) {
    return this.prisma.maquininha.findMany({ where: { salaoId, id: { in: ids } } });
  }

  async nomeEmUso(salaoId: string, nome: string, ignorarId?: string) {
    const total = await this.prisma.maquininha.count({
      where: { salaoId, nome: { equals: nome, mode: 'insensitive' }, id: { not: ignorarId } },
    });
    return total > 0;
  }

  criar(salaoId: string, dados: MaquininhaInput) {
    return this.prisma.maquininha.create({ data: { ...dados, salaoId } });
  }

  async atualizar(salaoId: string, id: string, dados: MaquininhaInput) {
    const { count } = await this.prisma.maquininha.updateMany({
      where: { id, salaoId },
      data: dados,
    });
    return count > 0;
  }
}
