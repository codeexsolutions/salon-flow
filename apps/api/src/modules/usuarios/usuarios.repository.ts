import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service.js';
import type { UsuarioAutenticado } from '../../shared/auth/usuario-autenticado.js';

@Injectable()
export class UsuariosRepository {
  constructor(private readonly prisma: PrismaService) {}

  /** Cria o usuário no primeiro acesso ou atualiza nome/foto vindos do Supabase. */
  upsert(usuario: UsuarioAutenticado) {
    return this.prisma.usuario.upsert({
      where: { id: usuario.id },
      create: {
        id: usuario.id,
        email: usuario.email,
        nome: usuario.nome,
        avatarUrl: usuario.avatarUrl,
      },
      update: { email: usuario.email, nome: usuario.nome, avatarUrl: usuario.avatarUrl },
    });
  }

  buscarVinculosAtivos(usuarioId: string) {
    return this.prisma.membroSalao.findMany({
      where: { usuarioId, ativo: true, salao: { ativo: true } },
      select: {
        papel: true,
        salao: { select: { id: true, nome: true, slug: true, fusoHorario: true } },
      },
      orderBy: { criadoEm: 'asc' },
    });
  }
}
