import { Injectable } from '@nestjs/common';
import type { AssinaturaPushInput, ConfigMensagensInput } from '@salonflow/shared';
import { PrismaService } from '../../shared/database/prisma.service.js';

/**
 * Dados de push, mensagens e avaliações. As consultas do salão filtram por
 * salaoId; as do agendador (lembretes/pedidos pendentes) são do sistema todo e
 * estão marcadas como tal.
 */
@Injectable()
export class NotificacoesRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Assinaturas de push (do usuário, não do salão) ----

  salvarAssinatura(usuarioId: string, { endpoint, keys }: AssinaturaPushInput) {
    return this.prisma.assinaturaPush.upsert({
      where: { endpoint },
      create: { usuarioId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
      update: { usuarioId, p256dh: keys.p256dh, auth: keys.auth },
    });
  }

  removerAssinatura(usuarioId: string, endpoint: string) {
    return this.prisma.assinaturaPush.deleteMany({ where: { usuarioId, endpoint } });
  }

  /** Assinatura recusada pelo serviço de push (aparelho desinscrito). */
  descartarEndpoint(endpoint: string) {
    return this.prisma.assinaturaPush.deleteMany({ where: { endpoint } });
  }

  assinaturas(usuarioId: string) {
    return this.prisma.assinaturaPush.findMany({ where: { usuarioId } });
  }

  /** Clientes do salão que têm o app com notificações ativas (ou um só). */
  assinantesDoSalao(salaoId: string, clienteId?: string) {
    return this.prisma.cliente.findMany({
      where: {
        salaoId,
        ...(clienteId && { id: clienteId }),
        usuario: { assinaturasPush: { some: {} } },
      },
      orderBy: { nome: 'asc' },
      select: {
        id: true,
        nome: true,
        telefone: true,
        usuarioId: true,
        usuario: { select: { _count: { select: { assinaturasPush: true } } } },
      },
    });
  }

  salao(salaoId: string) {
    return this.prisma.salao.findUniqueOrThrow({
      where: { id: salaoId },
      select: { nome: true, slug: true, logoUrl: true },
    });
  }

  // ---- Caixa de notificações (do usuário) ----

  guardarNotificacao(usuarioId: string, dados: { titulo: string; corpo: string; url: string }) {
    return this.prisma.notificacao.create({ data: { usuarioId, ...dados } });
  }

  notificacoes(usuarioId: string, desde: Date) {
    return this.prisma.notificacao.findMany({
      where: { usuarioId, criadoEm: { gte: desde } },
      orderBy: { criadoEm: 'desc' },
      take: 50,
      select: { id: true, titulo: true, corpo: true, criadoEm: true },
    });
  }

  contarNotificacoes(usuarioId: string, desde: Date) {
    return this.prisma.notificacao.count({ where: { usuarioId, criadoEm: { gte: desde } } });
  }

  /** Abrir = sair da caixa. Devolve o destino (null se já não existe). */
  async abrirNotificacao(usuarioId: string, id: string) {
    const n = await this.prisma.notificacao.findFirst({ where: { id, usuarioId } });
    if (!n) return null;
    await this.prisma.notificacao.deleteMany({ where: { id, usuarioId } });
    return n.url;
  }

  limparNotificacoes(usuarioId: string) {
    return this.prisma.notificacao.deleteMany({ where: { usuarioId } });
  }

  /** Limpeza: notificações antigas (sistema todo, ou de um usuário). */
  apagarNotificacoesAntigas(antes: Date, usuarioId?: string) {
    return this.prisma.notificacao.deleteMany({
      where: { criadoEm: { lt: antes }, ...(usuarioId && { usuarioId }) },
    });
  }

  // ---- Configuração de mensagens (salão) ----

  config(salaoId: string) {
    return this.prisma.configMensagens.findUnique({ where: { salaoId } });
  }

  salvarConfig(salaoId: string, dados: ConfigMensagensInput) {
    return this.prisma.configMensagens.upsert({
      where: { salaoId },
      create: { salaoId, ...dados },
      update: dados,
    });
  }

  // ---- Avaliações (salão) ----

  comandaFechada(salaoId: string, id: string) {
    return this.prisma.comanda.findFirst({
      where: { id, salaoId, status: 'FECHADA' },
      select: { id: true, clienteId: true },
    });
  }

  avaliacaoDaComanda(salaoId: string, comandaId: string) {
    return this.prisma.avaliacao.findFirst({ where: { salaoId, comandaId } });
  }

  /** Pedido de avaliação da comanda (fechar de novo mantém o mesmo link). */
  async gravarPedido(salaoId: string, comandaId: string, clienteId: string, pedirEm: Date | null) {
    const atual = await this.avaliacaoDaComanda(salaoId, comandaId);
    if (atual) {
      if (atual.respondidaEm) return atual;
      return this.prisma.avaliacao.update({ where: { id: atual.id }, data: { clienteId } });
    }
    const agora = new Date();
    return this.prisma.avaliacao.create({
      data: {
        salaoId,
        comandaId,
        clienteId,
        pedirEm: pedirEm ?? agora,
        // Sem push de avaliação no salão: fica só o link para o WhatsApp.
        pushEnviadoEm: pedirEm ? null : agora,
      },
    });
  }

  /** Comanda reaberta: some o pedido ainda não respondido. */
  removerPedidoPendente(salaoId: string, comandaId: string) {
    return this.prisma.avaliacao.deleteMany({ where: { salaoId, comandaId, respondidaEm: null } });
  }

  /** Avaliações do período (pela data do atendimento). */
  avaliacoesDoPeriodo(salaoId: string, inicio: Date, fim: Date) {
    return this.prisma.avaliacao.findMany({
      where: { salaoId, comanda: { fechadaEm: { gte: inicio, lt: fim } } },
      orderBy: { respondidaEm: 'desc' },
      select: {
        id: true,
        nota: true,
        comentario: true,
        respondidaEm: true,
        cliente: { select: { id: true, nome: true } },
        comanda: {
          select: {
            id: true,
            fechadaEm: true,
            itens: {
              where: { tipo: 'SERVICO' },
              select: { profissional: { select: { nome: true } } },
            },
          },
        },
      },
    });
  }

  // ---- Página pública da avaliação (pelo token) ----

  avaliacaoPorToken(token: string) {
    return this.prisma.avaliacao.findUnique({
      where: { token },
      select: {
        id: true,
        nota: true,
        comentario: true,
        respondidaEm: true,
        salao: { select: { nome: true, slug: true, logoUrl: true, fusoHorario: true } },
        comanda: {
          select: {
            fechadaEm: true,
            itens: {
              select: { descricao: true, tipo: true, profissional: { select: { nome: true } } },
            },
          },
        },
      },
    });
  }

  /** Só a primeira resposta vale. */
  responder(token: string, nota: number, comentario: string | null) {
    return this.prisma.avaliacao.updateMany({
      where: { token, respondidaEm: null },
      data: { nota, comentario, respondidaEm: new Date() },
    });
  }

  // ---- Agendador (sistema todo) ----

  /** Horários futuros, ainda sem lembrete, de clientes que usam o app. */
  agendamentosParaLembrete(agora: Date, ate: Date) {
    return this.prisma.agendamento.findMany({
      where: {
        status: { in: ['AGENDADO', 'CONFIRMADO'] },
        lembreteEnviadoEm: null,
        inicio: { gt: agora, lte: ate },
        cliente: { usuarioId: { not: null } },
      },
      select: {
        id: true,
        inicio: true,
        criadoEm: true,
        cliente: { select: { usuarioId: true } },
        servico: { select: { nome: true } },
        profissional: { select: { nome: true } },
        salao: {
          select: {
            nome: true,
            logoUrl: true,
            fusoHorario: true,
            configMensagens: { select: { lembreteHorasAntes: true } },
          },
        },
      },
      take: 500,
    });
  }

  /** Marca o lembrete; true = esta execução ficou com ele (evita envio duplicado). */
  async marcarLembrete(id: string) {
    const r = await this.prisma.agendamento.updateMany({
      where: { id, lembreteEnviadoEm: null },
      data: { lembreteEnviadoEm: new Date() },
    });
    return r.count === 1;
  }

  /** Pedidos de avaliação vencidos, de clientes com push de avaliação ligado. */
  pedidosParaPush(agora: Date, desde: Date) {
    return this.prisma.avaliacao.findMany({
      where: {
        pushEnviadoEm: null,
        respondidaEm: null,
        pedirEm: { lte: agora, gte: desde },
        cliente: { recebeNotificacoes: true, usuarioId: { not: null } },
      },
      select: {
        id: true,
        token: true,
        cliente: { select: { usuarioId: true } },
        salao: { select: { nome: true, logoUrl: true } },
      },
      take: 500,
    });
  }

  async marcarPedido(id: string) {
    const r = await this.prisma.avaliacao.updateMany({
      where: { id, pushEnviadoEm: null },
      data: { pushEnviadoEm: new Date() },
    });
    return r.count === 1;
  }

  /** Pedidos antigos que não saíram (cliente sem push, chave desligada): encerra. */
  encerrarPedidosVencidos(desde: Date) {
    return this.prisma.avaliacao.updateMany({
      where: { pushEnviadoEm: null, pedirEm: { lt: desde } },
      data: { pushEnviadoEm: new Date() },
    });
  }
}
