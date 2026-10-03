import { Injectable } from '@nestjs/common';
import type { Papel } from '@salonflow/shared';
import { PrismaService } from '../../shared/database/prisma.service.js';
import { papelAoAceitarConvite } from './domain/acesso.js';

@Injectable()
export class EquipeRepository {
  constructor(private readonly prisma: PrismaService) {}

  listarMembros(salaoId: string) {
    return this.prisma.membroSalao.findMany({
      where: { salaoId },
      select: {
        id: true,
        papel: true,
        ativo: true,
        criadoEm: true,
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            profissionais: { where: { salaoId, ativo: true }, select: { id: true }, take: 1 },
          },
        },
      },
      orderBy: { criadoEm: 'asc' },
    });
  }

  listarConvites(salaoId: string) {
    return this.prisma.conviteAcesso.findMany({ where: { salaoId }, orderBy: { criadoEm: 'asc' } });
  }

  buscarMembro(salaoId: string, id: string) {
    return this.prisma.membroSalao.findFirst({ where: { id, salaoId } });
  }

  buscarUsuarioPorEmail(email: string) {
    return this.prisma.usuario.findUnique({ where: { email }, select: { id: true } });
  }

  buscarMembroDoUsuario(salaoId: string, usuarioId: string) {
    return this.prisma.membroSalao.findUnique({
      where: { salaoId_usuarioId: { salaoId, usuarioId } },
    });
  }

  /** Dá (ou devolve) o acesso a um usuário que já tem conta. */
  liberarAcesso(salaoId: string, usuarioId: string, papel: Papel) {
    return this.prisma.membroSalao.upsert({
      where: { salaoId_usuarioId: { salaoId, usuarioId } },
      create: { salaoId, usuarioId, papel },
      update: { papel, ativo: true },
    });
  }

  salvarConvite(salaoId: string, dados: { email: string; nome: string; papel: Papel }) {
    return this.prisma.conviteAcesso.upsert({
      where: { salaoId_email: { salaoId, email: dados.email } },
      create: { salaoId, ...dados },
      update: { nome: dados.nome, papel: dados.papel },
    });
  }

  removerConvite(salaoId: string, id: string) {
    return this.prisma.conviteAcesso.deleteMany({ where: { id, salaoId } });
  }

  alterarAtivo(salaoId: string, id: string, ativo: boolean) {
    return this.prisma.membroSalao.update({ where: { id, salaoId }, data: { ativo } });
  }

  /**
   * No login: transforma os convites deste e-mail em acesso ao salão.
   * Chamado fora de um contexto de salão (GET /me), por isso não filtra por salaoId.
   */
  aceitarConvitesPendentes(usuarioId: string, email: string) {
    return this.prisma.$transaction(async (tx) => {
      const convites = await tx.conviteAcesso.findMany({ where: { email } });

      for (const convite of convites) {
        const chave = { salaoId_usuarioId: { salaoId: convite.salaoId, usuarioId } };
        const atual = await tx.membroSalao.findUnique({ where: chave, select: { papel: true } });
        const papel = papelAoAceitarConvite(atual?.papel ?? null, convite.papel);
        await tx.membroSalao.upsert({
          where: chave,
          create: { salaoId: convite.salaoId, usuarioId, papel },
          update: { papel, ativo: true },
        });
        await tx.conviteAcesso.delete({ where: { id: convite.id } });
      }
      return convites.length;
    });
  }
}
