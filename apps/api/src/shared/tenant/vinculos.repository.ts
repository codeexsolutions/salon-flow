import { Injectable } from '@nestjs/common';
import type { Papel } from '@salonflow/shared';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class VinculosRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarPapelAtivo(usuarioId: string, salaoId: string): Promise<Papel | null> {
    const vinculo = await this.prisma.membroSalao.findFirst({
      where: { usuarioId, salaoId, ativo: true, salao: { ativo: true } },
      select: { papel: true },
    });
    return vinculo?.papel ?? null;
  }
}
