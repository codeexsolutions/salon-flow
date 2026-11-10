import { Injectable, Logger } from '@nestjs/common';
import {
  pontosPorValor,
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
import { calcularSaldo, somarMeses, type MovimentoSaldo } from './domain/saldo.js';
import { FidelidadeRepository } from './fidelidade.repository.js';

type MovimentoDoBanco = Omit<MovimentoPontosDto, 'data' | 'expiraEm'> & {
  data: Date;
  expiraEm: Date | null;
};

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

const paraMovimento = (m: MovimentoDoBanco): MovimentoPontosDto => ({
  ...m,
  data: m.data.toISOString(),
  expiraEm: m.expiraEm?.toISOString() ?? null,
});

/** Saldo de agora + o extrato recente para mostrar. */
function resumo(movimentos: MovimentoDoBanco[]) {
  const r = calcularSaldo(movimentos, new Date());
  return {
    saldo: r.saldo,
    aVencer: r.aVencer && { pontos: r.aVencer.pontos, em: r.aVencer.em.toISOString() },
    extrato: movimentos.slice(0, 100).map(paraMovimento),
  };
}

@Injectable()
export class FidelidadeService {
  private readonly logger = new Logger(FidelidadeService.name);

  constructor(
    private readonly repository: FidelidadeRepository,
    private readonly contexto: ContextoSalao,
  ) {}

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
    const r = resumo(movimentos);
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
