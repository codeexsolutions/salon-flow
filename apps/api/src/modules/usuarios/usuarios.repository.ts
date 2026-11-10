import { Injectable } from '@nestjs/common';
import type { PerfilClienteInput } from '@salonflow/shared';
import { PrismaService } from '../../shared/database/prisma.service.js';
import type { UsuarioAutenticado } from '../../shared/auth/usuario-autenticado.js';
import type { EstadoTentativas } from './domain/recuperacao.js';

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

  /** Cadastro do cliente no app e em quantos salões ele tem ficha. */
  async perfilCliente(usuarioId: string) {
    const [perfil, saloes] = await Promise.all([
      this.prisma.perfilCliente.findUnique({ where: { usuarioId } }),
      this.prisma.cliente.count({ where: { usuarioId } }),
    ]);
    return { perfil, saloes };
  }

  /**
   * Salva o cadastro e leva os campos preenchidos para a ficha do cliente em
   * cada salão (campos vazios não apagam o que o salão já tem).
   */
  salvarPerfilCliente(usuarioId: string, { nascimento, ...dados }: PerfilClienteInput) {
    const data = { ...dados, nascimento: nascimento ? new Date(`${nascimento}T00:00:00Z`) : null };
    const preenchidos = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== null));
    return this.prisma.$transaction(async (tx) => {
      const perfil = await tx.perfilCliente.upsert({
        where: { usuarioId },
        create: { usuarioId, ...data },
        update: data,
      });
      if (Object.keys(preenchidos).length > 0) {
        await tx.cliente.updateMany({ where: { usuarioId }, data: preenchidos });
      }
      return perfil;
    });
  }

  buscarParaRecuperacao(email: string) {
    return this.prisma.usuario.findUnique({
      where: { email },
      select: {
        id: true,
        telefone: true,
        recuperacaoHash: true,
        recuperacaoTentativas: true,
        recuperacaoBloqueadaAte: true,
      },
    });
  }

  /** Novo código (hash) e celular; zera as tentativas erradas. */
  salvarRecuperacao(id: string, telefone: string, recuperacaoHash: string) {
    return this.prisma.usuario.update({
      where: { id },
      data: {
        telefone,
        recuperacaoHash,
        recuperacaoTentativas: 0,
        recuperacaoBloqueadaAte: null,
      },
    });
  }

  salvarTentativas(id: string, { tentativas, bloqueadaAte }: EstadoTentativas) {
    return this.prisma.usuario.update({
      where: { id },
      data: { recuperacaoTentativas: tentativas, recuperacaoBloqueadaAte: bloqueadaAte },
    });
  }

  buscarVinculosAtivos(usuarioId: string) {
    return this.prisma.membroSalao.findMany({
      where: { usuarioId, ativo: true, salao: { ativo: true } },
      select: {
        papel: true,
        permissoes: true,
        salao: {
          select: {
            id: true,
            nome: true,
            slug: true,
            fusoHorario: true,
            // Cadastro de profissional ativo deste usuário no salão (dá o app do profissional).
            profissionais: { where: { usuarioId, ativo: true }, select: { id: true }, take: 1 },
          },
        },
      },
      orderBy: { criadoEm: 'asc' },
    });
  }
}
