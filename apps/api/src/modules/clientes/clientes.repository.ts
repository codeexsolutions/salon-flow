import { Injectable } from '@nestjs/common';
import type { CriarClienteInput } from '@salonflow/shared';
import { PrismaService } from '../../shared/database/prisma.service.js';

/** Todas as consultas filtram por salaoId (isolamento entre salões). */
@Injectable()
export class ClientesRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Busca por nome, telefone ou e-mail (sem diferenciar maiúsculas). */
  buscar(salaoId: string, termo: string, limite: number) {
    const contem = { contains: termo, mode: 'insensitive' as const };
    return this.prisma.cliente.findMany({
      where: {
        salaoId,
        ...(termo && { OR: [{ nome: contem }, { telefone: contem }, { email: contem }] }),
      },
      orderBy: { nome: 'asc' },
      take: limite,
    });
  }

  buscarPorId(salaoId: string, id: string) {
    return this.prisma.cliente.findFirst({ where: { id, salaoId } });
  }

  criar(salaoId: string, dados: CriarClienteInput) {
    return this.prisma.cliente.create({ data: { ...dados, salaoId } });
  }
}
