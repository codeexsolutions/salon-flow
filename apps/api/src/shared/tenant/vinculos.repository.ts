import { Injectable } from '@nestjs/common';
import { permissoesEfetivas, type Papel, type Permissao } from '@salonflow/shared';
import { PrismaService } from '../database/prisma.service.js';

export interface VinculoAtivo {
  papel: Papel;
  fusoHorario: string;
  permissoes: Permissao[];
}

@Injectable()
export class VinculosRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Salão ativo pelo endereço público (/s/:slug). */
  buscarSalaoAtivoPorSlug(slug: string) {
    return this.prisma.salao.findFirst({
      where: { slug, ativo: true },
      select: { id: true, fusoHorario: true },
    });
  }

  async buscarVinculoAtivo(usuarioId: string, salaoId: string): Promise<VinculoAtivo | null> {
    const vinculo = await this.prisma.membroSalao.findFirst({
      where: { usuarioId, salaoId, ativo: true, salao: { ativo: true } },
      select: { papel: true, permissoes: true, salao: { select: { fusoHorario: true } } },
    });
    return vinculo
      ? {
          papel: vinculo.papel,
          fusoHorario: vinculo.salao.fusoHorario,
          permissoes: permissoesEfetivas(vinculo.papel, vinculo.permissoes),
        }
      : null;
  }
}
