import { Injectable, Logger } from '@nestjs/common';
import {
  pontosPorValor,
  usuarioDeLogin,
  type AjustePontosInput,
  type ConfigFidelidade,
  type MeusPontosSalao,
  type MovimentoPontosDto,
  type PontosCliente,
  type PremioFidelidade,
  type PremioFidelidadeInput,
  type ProgramaFidelidade,
  type ProgramaFidelidadeInput,
} from '@salonflow/shared';
import { NaoEncontradoError, RegraDeNegocioError } from '../../shared/errors/domain.error.js';
import { ContextoSalao } from '../../shared/tenant/contexto-salao.js';
import { PushService } from '../notificacoes/push.service.js';
import { calcularSaldo, somarMeses, type MovimentoSaldo } from './domain/saldo.js';
import { FidelidadeRepository } from './fidelidade.repository.js';

type MovimentoDoBanco = Omit<MovimentoPontosDto, 'data' | 'expiraEm' | 'feitoPor'> & {
  data: Date;
  expiraEm: Date | null;
  criadoPorId: string | null;
};

const pts = (n: number) => `${n.toLocaleString('pt-BR')} ${Math.abs(n) === 1 ? 'ponto' : 'pontos'}`;

const paraPrograma = (p: ProgramaFidelidade): ProgramaFidelidade => ({
  ativo: p.ativo,
  centavosPorPonto: p.centavosPorPonto,
  validadeMeses: p.validadeMeses,
  regras: p.regras,
});

const paraPremio = (p: PremioFidelidade): PremioFidelidade => ({
  id: p.id,
  nome: p.nome,
  descricao: p.descricao,
  pontos: p.pontos,
  ativo: p.ativo,
});

const paraMovimento = (
  { criadoPorId, ...m }: MovimentoDoBanco,
  nomes?: Map<string, string>,
): MovimentoPontosDto => ({
  ...m,
  data: m.data.toISOString(),
  expiraEm: m.expiraEm?.toISOString() ?? null,
  // Ganho vem da comanda; só resgate e ajuste mostram quem fez.
  feitoPor: m.tipo !== 'GANHO' && criadoPorId ? (nomes?.get(criadoPorId) ?? null) : null,
});

/** Saldo de agora + o extrato recente. `nomes`: quem fez (só no painel). */
function resumo(movimentos: MovimentoDoBanco[], nomes?: Map<string, string>) {
  const r = calcularSaldo(movimentos, new Date());
  return {
    saldo: r.saldo,
    aVencer: r.aVencer && { pontos: r.aVencer.pontos, em: r.aVencer.em.toISOString() },
    extrato: movimentos.slice(0, 100).map((m) => paraMovimento(m, nomes)),
  };
}

@Injectable()
export class FidelidadeService {
  private readonly logger = new Logger(FidelidadeService.name);

  constructor(
    private readonly repository: FidelidadeRepository,
    private readonly contexto: ContextoSalao,
    private readonly push: PushService,
  ) {}

  /** Nome de quem fez cada movimento do extrato (equipe do salão). */
  private async nomesDaEquipe(movimentos: MovimentoDoBanco[]) {
    const ids = [
      ...new Set(
        movimentos
          .slice(0, 100)
          .filter((m) => m.tipo !== 'GANHO' && m.criadoPorId)
          .map((m) => m.criadoPorId!),
      ),
    ];
    const usuarios = await this.repository.usuarios(ids);
    return new Map(usuarios.map((u) => [u.id, u.nome?.trim() || `@${usuarioDeLogin(u.email)}`]));
  }

  /** Avisa o cliente no app (push + sino). Falha aqui não desfaz o resgate. */
  private async avisarCliente(clienteId: string, titulo: string, corpo: string) {
    try {
      const destino = await this.repository.destinoAviso(this.contexto.salaoId, clienteId);
      if (!destino?.usuarioId) return;
      await this.push.enviar(destino.usuarioId, {
        titulo,
        corpo,
        url: '/meus-pontos',
        salao: destino.salao,
      });
    } catch (erro) {
      this.logger.error(`Falha ao avisar o cliente ${clienteId} sobre pontos`, erro as Error);
    }
  }

  // ---- Configuração (dono) ----

  async config(): Promise<ConfigFidelidade> {
    const salaoId = this.contexto.salaoId;
    const [programa, premios] = await Promise.all([
      this.repository.programa(salaoId),
      this.repository.premios(salaoId),
    ]);
    return { programa: programa && paraPrograma(programa), premios: premios.map(paraPremio) };
  }

  async salvarPrograma(dados: ProgramaFidelidadeInput) {
    return paraPrograma(await this.repository.salvarPrograma(this.contexto.salaoId, dados));
  }

  async criarPremio(dados: PremioFidelidadeInput) {
    return paraPremio(await this.repository.criarPremio(this.contexto.salaoId, dados));
  }

  async atualizarPremio(id: string, dados: PremioFidelidadeInput) {
    if (!(await this.repository.premio(this.contexto.salaoId, id))) {
      throw new NaoEncontradoError('Prêmio');
    }
    return paraPremio(await this.repository.atualizarPremio(this.contexto.salaoId, id, dados));
  }

  // ---- Pontos do cliente ----

  private async exigirCliente(clienteId: string) {
    if (!(await this.repository.clienteExiste(this.contexto.salaoId, clienteId))) {
      throw new NaoEncontradoError('Cliente');
    }
  }

  async pontosDoCliente(clienteId: string): Promise<PontosCliente> {
    const salaoId = this.contexto.salaoId;
    await this.exigirCliente(clienteId);
    const [programa, premios, movimentos] = await Promise.all([
      this.repository.programa(salaoId),
      this.repository.premios(salaoId, true),
      this.repository.movimentos(salaoId, clienteId),
    ]);
    const r = resumo(movimentos, await this.nomesDaEquipe(movimentos));
    return {
      ...r,
      programa: programa && paraPrograma(programa),
      premios: premios.map((p) => ({ ...paraPremio(p), podeResgatar: r.saldo >= p.pontos })),
    };
  }

  async resgatar(clienteId: string, premioId: string, usuarioId: string) {
    const salaoId = this.contexto.salaoId;
    await this.exigirCliente(clienteId);
    const premio = await this.repository.premio(salaoId, premioId);
    if (!premio || !premio.ativo) throw new NaoEncontradoError('Prêmio');

    const agora = new Date();
    const feito = await this.repository.debitar(
      {
        salaoId,
        clienteId,
        tipo: 'RESGATE',
        pontos: -premio.pontos,
        descricao: premio.nome,
        data: agora,
        expiraEm: null,
        premioId: premio.id,
        criadoPorId: usuarioId,
      },
      (movimentos: MovimentoSaldo[]) => calcularSaldo(movimentos, agora).saldo >= premio.pontos,
    );
    if (!feito) {
      throw new RegraDeNegocioError(
        'PONTOS_INSUFICIENTES',
        `O cliente não tem pontos suficientes para "${premio.nome}" (${premio.pontos} pontos).`,
      );
    }
    const saldo = calcularSaldo(
      await this.repository.movimentos(salaoId, clienteId),
      new Date(),
    ).saldo;
    await this.avisarCliente(
      clienteId,
      `Resgate: ${premio.nome}`,
      `Você usou ${pts(premio.pontos)}. Saldo agora: ${pts(Math.max(saldo, 0))}. Não foi você? Fale com o salão.`,
    );
    return paraMovimento(feito);
  }

  /** Correção manual (só o dono). Crédito segue a validade do programa. */
  async ajustar(clienteId: string, { pontos, motivo }: AjustePontosInput, usuarioId: string) {
    const salaoId = this.contexto.salaoId;
    await this.exigirCliente(clienteId);
    const programa = await this.repository.programa(salaoId);
    const agora = new Date();
    const m = await this.repository.criarMovimento({
      salaoId,
      clienteId,
      tipo: 'AJUSTE',
      pontos,
      descricao: motivo,
      data: agora,
      expiraEm:
        pontos > 0 && programa?.validadeMeses ? somarMeses(agora, programa.validadeMeses) : null,
      criadoPorId: usuarioId,
    });
    await this.avisarCliente(
      clienteId,
      pontos > 0 ? `Você ganhou ${pts(pontos)}` : 'Ajuste nos seus pontos',
      `${pontos > 0 ? '+' : ''}${pontos.toLocaleString('pt-BR')} · ${motivo}`,
    );
    return paraMovimento(m);
  }

  // ---- Integração com a comanda ----

  /**
   * Credita os pontos da comanda fechada (programa ativo e com cliente). Não
   * impede o fechamento: se falhar, registra o erro.
   */
  async creditarComanda(comandaId: string, usuarioId: string) {
    const salaoId = this.contexto.salaoId;
    try {
      const [programa, comanda] = await Promise.all([
        this.repository.programa(salaoId),
        this.repository.comandaFechada(salaoId, comandaId),
      ]);
      if (!programa?.ativo || !comanda?.clienteId || !comanda.fechadaEm) return;
      const pontos = pontosPorValor(comanda.totalCentavos ?? 0, programa.centavosPorPonto);
      if (pontos <= 0) {
        await this.repository.removerGanho(salaoId, comandaId);
        return;
      }
      await this.repository.gravarGanho(comandaId, {
        salaoId,
        clienteId: comanda.clienteId,
        tipo: 'GANHO',
        pontos,
        descricao: `Comanda #${comanda.numero}`,
        data: comanda.fechadaEm,
        expiraEm: programa.validadeMeses
          ? somarMeses(comanda.fechadaEm, programa.validadeMeses)
          : null,
        criadoPorId: usuarioId,
      });
    } catch (erro) {
      this.logger.error(`Falha ao creditar pontos da comanda ${comandaId}`, erro as Error);
    }
  }

  /** Comanda reaberta: os pontos dela saem (voltam ao fechar de novo). */
  async estornarComanda(comandaId: string) {
    try {
      await this.repository.removerGanho(this.contexto.salaoId, comandaId);
    } catch (erro) {
      this.logger.error(`Falha ao estornar pontos da comanda ${comandaId}`, erro as Error);
    }
  }

  // ---- App do cliente ----

  async meusPontos(usuarioId: string): Promise<MeusPontosSalao[]> {
    const cadastros = await this.repository.cadastrosComPrograma(usuarioId);
    return Promise.all(
      cadastros.map(async (c) => {
        const movimentos = await this.repository.movimentos(c.salaoId, c.id);
        return {
          ...resumo(movimentos),
          salao: { nome: c.salao.nome, slug: c.salao.slug },
          programa: paraPrograma(c.salao.programaFidelidade!),
          premios: c.salao.premiosFidelidade.map(paraPremio),
        };
      }),
    );
  }
}
