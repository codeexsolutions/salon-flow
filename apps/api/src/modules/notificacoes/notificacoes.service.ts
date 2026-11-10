import { Injectable, Logger } from '@nestjs/common';
import {
  CONFIG_MENSAGENS_PADRAO,
  MODELOS_MENSAGEM,
  type AssinaturaPushInput,
  type AvaliacaoPublica,
  type ConfigMensagens,
  type ConfigMensagensInput,
  type LinkAvaliacao,
  type ModeloMensagem,
  type RelatorioAvaliacoes,
  type ResponderAvaliacaoInput,
} from '@salonflow/shared';
import { limitesDoDia, utcParaLocal } from '../../shared/domain/data-hora.js';
import { ConflitoError, NaoEncontradoError } from '../../shared/errors/domain.error.js';
import { ContextoSalao } from '../../shared/tenant/contexto-salao.js';
import { quandoPedirAvaliacao } from './domain/lembretes.js';
import { NotificacoesRepository } from './notificacoes.repository.js';

const media = (notas: number[]) =>
  notas.length ? Math.round((notas.reduce((s, n) => s + n, 0) / notas.length) * 10) / 10 : null;

@Injectable()
export class NotificacoesService {
  private readonly logger = new Logger(NotificacoesService.name);

  constructor(
    private readonly repository: NotificacoesRepository,
    private readonly contexto: ContextoSalao,
  ) {}

  // ---- Push: aparelhos do usuário ----

  inscrever(usuarioId: string, dados: AssinaturaPushInput) {
    return this.repository.salvarAssinatura(usuarioId, dados);
  }

  cancelar(usuarioId: string, endpoint: string) {
    return this.repository.removerAssinatura(usuarioId, endpoint);
  }

  // ---- Configuração de mensagens ----

  async config(): Promise<ConfigMensagens> {
    const salva = await this.repository.config(this.contexto.salaoId);
    if (!salva) return CONFIG_MENSAGENS_PADRAO;
    const modelos = (salva.modelos ?? {}) as Partial<Record<ModeloMensagem, string>>;
    return {
      lembreteHorasAntes: salva.lembreteHorasAntes,
      avaliacaoHorasDepois: salva.avaliacaoHorasDepois,
      modelos: Object.fromEntries(
        MODELOS_MENSAGEM.map((m) => [m, modelos[m]?.trim() || CONFIG_MENSAGENS_PADRAO.modelos[m]]),
      ) as Record<ModeloMensagem, string>,
    };
  }

  async salvarConfig(dados: ConfigMensagensInput) {
    await this.repository.salvarConfig(this.contexto.salaoId, dados);
    return this.config();
  }

  // ---- Avaliações ----

  /**
   * Comanda fechada com cliente: cria o pedido de avaliação (link para o
   * WhatsApp e, se o salão pede por push, o horário do push). Não impede o fechamento.
   */
  async pedirAvaliacao(comandaId: string) {
    const salaoId = this.contexto.salaoId;
    try {
      const comanda = await this.repository.comandaFechada(salaoId, comandaId);
      if (!comanda?.clienteId) return;
      const config = await this.repository.config(salaoId);
      const pedirEm = quandoPedirAvaliacao(
        config ? config.avaliacaoHorasDepois : undefined,
        new Date(),
      );
      await this.repository.gravarPedido(salaoId, comandaId, comanda.clienteId, pedirEm);
    } catch (erro) {
      this.logger.error(
        `Falha ao criar pedido de avaliação da comanda ${comandaId}`,
        erro as Error,
      );
    }
  }

  async cancelarPedidoAvaliacao(comandaId: string) {
    try {
      await this.repository.removerPedidoPendente(this.contexto.salaoId, comandaId);
    } catch (erro) {
      this.logger.error(`Falha ao cancelar avaliação da comanda ${comandaId}`, erro as Error);
    }
  }

  async linkAvaliacao(comandaId: string): Promise<LinkAvaliacao> {
    const a = await this.repository.avaliacaoDaComanda(this.contexto.salaoId, comandaId);
    if (!a) throw new NaoEncontradoError('Avaliação');
    return { token: a.token, respondida: a.respondidaEm !== null };
  }

  async relatorio(de: string, ate: string): Promise<RelatorioAvaliacoes> {
    const fuso = this.contexto.fusoHorario;
    const inicio = limitesDoDia(de, fuso).inicio;
    const fim = limitesDoDia(ate, fuso).fim;
    const lista = await this.repository.avaliacoesDoPeriodo(this.contexto.salaoId, inicio, fim);
    const respondidas = lista.filter((a) => a.nota !== null);

    const porProfissional = new Map<string, number[]>();
    for (const a of respondidas) {
      const nomes = new Set(a.comanda.itens.map((i) => i.profissional?.nome).filter(Boolean));
      for (const nome of nomes) {
        porProfissional.set(nome!, [...(porProfissional.get(nome!) ?? []), a.nota!]);
      }
    }

    return {
      media: media(respondidas.map((a) => a.nota!)),
      respondidas: respondidas.length,
      pedidas: lista.length,
      distribuicao: [1, 2, 3, 4, 5].map((n) => respondidas.filter((a) => a.nota === n).length),
      porProfissional: [...porProfissional.entries()]
        .map(([nome, notas]) => ({ nome, media: media(notas)!, total: notas.length }))
        .sort((a, b) => b.media - a.media || b.total - a.total),
      recentes: respondidas.slice(0, 50).map((a) => ({
        id: a.id,
        data: utcParaLocal(a.comanda.fechadaEm!, fuso).slice(0, 10),
        cliente: a.cliente,
        comandaId: a.comanda.id,
        nota: a.nota!,
        comentario: a.comentario,
        profissionais: [
          ...new Set(
            a.comanda.itens.map((i) => i.profissional?.nome).filter((n): n is string => !!n),
          ),
        ],
      })),
    };
  }

  // ---- Página pública (sem login, pelo token do link) ----

  async avaliacaoPublica(token: string): Promise<AvaliacaoPublica> {
    const a = await this.repository.avaliacaoPorToken(token);
    if (!a) throw new NaoEncontradoError('Avaliação');
    const { fusoHorario, ...salao } = a.salao;
    return {
      salao,
      data: utcParaLocal(a.comanda.fechadaEm ?? new Date(), fusoHorario).slice(0, 10),
      itens: a.comanda.itens.map((i) => ({
        descricao: i.descricao,
        profissional: i.tipo === 'SERVICO' ? (i.profissional?.nome ?? null) : null,
      })),
      nota: a.nota,
      comentario: a.comentario,
      respondida: a.respondidaEm !== null,
    };
  }

  async responder(token: string, { nota, comentario }: ResponderAvaliacaoInput) {
    if (!(await this.repository.avaliacaoPorToken(token))) {
      throw new NaoEncontradoError('Avaliação');
    }
    const r = await this.repository.responder(token, nota, comentario ?? null);
    if (r.count === 0) {
      throw new ConflitoError('AVALIACAO_RESPONDIDA', 'Esta avaliação já foi enviada. Obrigado!');
    }
    return this.avaliacaoPublica(token);
  }
}
