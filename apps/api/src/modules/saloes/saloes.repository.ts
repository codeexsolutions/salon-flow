import { Injectable } from '@nestjs/common';
import type { AtualizarSalaoInput, CriarSalaoInput } from '@salonflow/shared';
import { PrismaService } from '../../shared/database/prisma.service.js';

/** Camada de INFRAESTRUTURA: único lugar do módulo que conhece o Prisma. */
@Injectable()
export class SaloesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async slugExiste(slug: string): Promise<boolean> {
    const total = await this.prisma.salao.count({ where: { slug } });
    return total > 0;
  }

  buscarPorId(id: string) {
    return this.prisma.salao.findUnique({ where: { id } });
  }

  buscarAtivoPorSlug(slug: string) {
    return this.prisma.salao.findFirst({ where: { slug, ativo: true } });
  }

  /** Cria o salão e já vincula o criador como DONO, na mesma transação. */
  criarComDono(dados: CriarSalaoInput, donoId: string) {
    return this.prisma.salao.create({
      data: {
        ...dados,
        membros: { create: { usuarioId: donoId, papel: 'DONO' } },
      },
    });
  }

  atualizar(id: string, dados: AtualizarSalaoInput) {
    return this.prisma.salao.update({ where: { id }, data: dados });
  }
}
