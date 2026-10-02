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

  /**
   * Ficha do usuário do app neste salão: a já vinculada; senão, uma ficha criada pela
   * recepção com o mesmo e-mail (passa a ser dele); senão, uma nova.
   */
  garantirParaUsuario(salaoId: string, usuario: { id: string; email: string; nome: string }) {
    return this.prisma.$transaction(async (tx) => {
      const vinculada = await tx.cliente.findUnique({
        where: { salaoId_usuarioId: { salaoId, usuarioId: usuario.id } },
      });
      if (vinculada) return vinculada;

      const mesmoEmail = await tx.cliente.findFirst({
        where: { salaoId, usuarioId: null, email: { equals: usuario.email, mode: 'insensitive' } },
        orderBy: { criadoEm: 'asc' },
      });
      if (mesmoEmail) {
        return tx.cliente.update({ where: { id: mesmoEmail.id }, data: { usuarioId: usuario.id } });
      }

      return tx.cliente.create({
        data: { salaoId, usuarioId: usuario.id, nome: usuario.nome, email: usuario.email },
      });
    });
  }
}
