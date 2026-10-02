import { Injectable } from '@nestjs/common';
import type {
  AtualizarProfissionalInput,
  CriarBloqueioInput,
  CriarProfissionalInput,
  DefinirJornadaInput,
} from '@salonflow/shared';
import { localParaUtc } from '../../shared/domain/data-hora.js';
import {
  ConflitoError,
  NaoEncontradoError,
  RegraDeNegocioError,
} from '../../shared/errors/domain.error.js';
import { ContextoSalao } from '../../shared/tenant/contexto-salao.js';
import { normalizarJornada } from './domain/jornada.js';
import { ProfissionaisRepository } from './profissionais.repository.js';

const DURACAO_MAXIMA_BLOQUEIO_MS = 366 * 24 * 60 * 60 * 1000;

@Injectable()
export class ProfissionaisService {
  constructor(
    private readonly repository: ProfissionaisRepository,
    private readonly contexto: ContextoSalao,
  ) {}

  listar(incluirInativos: boolean) {
    return this.repository.listar(this.contexto.salaoId, incluirInativos);
  }

  async buscar(id: string) {
    const profissional = await this.repository.buscar(this.contexto.salaoId, id);
    if (!profissional) throw new NaoEncontradoError('Profissional');
    return profissional;
  }

  /** Quantos dos ids são profissionais ATIVOS do salão atual (usado por outros módulos). */
  contarAtivos(ids: string[]) {
    if (ids.length === 0) return Promise.resolve(0);
    return this.repository.contarAtivos(this.contexto.salaoId, ids);
  }

  async criar(dados: CriarProfissionalInput) {
    const salaoId = this.contexto.salaoId;
    if (dados.email && (await this.repository.emailEmUso(salaoId, dados.email))) {
      throw this.emailDuplicado();
    }
    return this.repository.criar(salaoId, dados);
  }

  async atualizar(id: string, dados: AtualizarProfissionalInput) {
    const salaoId = this.contexto.salaoId;
    const atual = await this.buscar(id);

    if (dados.email !== undefined && dados.email !== atual.email) {
      if (atual.usuarioId) {
        throw new RegraDeNegocioError(
          'EMAIL_VINCULADO',
          'O e-mail não pode ser alterado: o profissional já usa o app com ele.',
        );
      }
      if (dados.email && (await this.repository.emailEmUso(salaoId, dados.email, id))) {
        throw this.emailDuplicado();
      }
    }
    return this.repository.atualizar(salaoId, id, dados);
  }

  async definirJornada(id: string, { intervalos }: DefinirJornadaInput) {
    await this.buscar(id);
    return this.repository.substituirJornada(
      this.contexto.salaoId,
      id,
      normalizarJornada(intervalos),
    );
  }

  async listarBloqueios(id: string) {
    await this.buscar(id);
    return this.repository.listarBloqueios(this.contexto.salaoId, id, new Date());
  }

  async criarBloqueio(id: string, dados: CriarBloqueioInput) {
    await this.buscar(id);
    const inicio = localParaUtc(dados.inicio, this.contexto.fusoHorario);
    const fim = localParaUtc(dados.fim, this.contexto.fusoHorario);

    if (fim <= inicio) {
      throw new RegraDeNegocioError('PERIODO_INVALIDO', 'O fim deve ser depois do início.');
    }
    if (fim.getTime() - inicio.getTime() > DURACAO_MAXIMA_BLOQUEIO_MS) {
      throw new RegraDeNegocioError('PERIODO_INVALIDO', 'O período máximo é de 1 ano.');
    }
    return this.repository.criarBloqueio(this.contexto.salaoId, id, {
      inicio,
      fim,
      motivo: dados.motivo,
    });
  }

  async removerBloqueio(id: string, bloqueioId: string) {
    const removido = await this.repository.removerBloqueio(this.contexto.salaoId, id, bloqueioId);
    if (!removido) throw new NaoEncontradoError('Folga');
  }

  /** Chamado no login (UsuariosService): ativa os convites pendentes para o e-mail. */
  vincularConvitesPendentes(usuarioId: string, email: string) {
    return this.repository.vincularPorEmail(usuarioId, email.toLowerCase());
  }

  private emailDuplicado() {
    return new ConflitoError(
      'EMAIL_EM_USO',
      'Já existe um profissional com este e-mail neste salão.',
    );
  }
}
