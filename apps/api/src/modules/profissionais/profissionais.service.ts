import { Injectable } from '@nestjs/common';
import { emailDeLogin } from '@salonflow/shared';
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

  /**
   * Para a agenda: profissionais ativos (todos ou só `ids`) com jornada semanal
   * e folgas que se sobrepõem a [inicio, fim).
   */
  dadosDeAgenda(inicio: Date, fim: Date, ids?: string[]) {
    return this.repository.dadosDeAgenda(this.contexto.salaoId, inicio, fim, ids);
  }

  /** O profissional que é o usuário logado neste salão (app do profissional). */
  async doUsuario(usuarioId: string) {
    const profissional = await this.repository.buscarPorUsuario(this.contexto.salaoId, usuarioId);
    if (!profissional) throw new NaoEncontradoError('Profissional');
    return profissional;
  }

  /** Quantos dos ids são profissionais ATIVOS do salão atual (usado por outros módulos). */
  contarAtivos(ids: string[]) {
    if (ids.length === 0) return Promise.resolve(0);
    return this.repository.contarAtivos(this.contexto.salaoId, ids);
  }

  async criar({ usuario, ...dados }: CriarProfissionalInput) {
    const salaoId = this.contexto.salaoId;
    const email = usuario ? emailDeLogin(usuario) : undefined;
    if (email) await this.validarLoginLivre(salaoId, email);
    return this.repository.criar(salaoId, { ...dados, email });
  }

  async atualizar(id: string, { usuario, ...dados }: AtualizarProfissionalInput) {
    const salaoId = this.contexto.salaoId;
    const atual = await this.buscar(id);
    // undefined = não mexe; null = remove o usuário (ainda sem acesso).
    const email = usuario === undefined ? undefined : usuario && emailDeLogin(usuario);

    if (email !== undefined && email !== atual.email) {
      if (atual.usuarioId) {
        throw new RegraDeNegocioError(
          'USUARIO_VINCULADO',
          'O usuário não pode ser alterado: o profissional já entra no app com ele.',
        );
      }
      if (email) await this.validarLoginLivre(salaoId, email, id);
    }
    return this.repository.atualizar(salaoId, id, { ...dados, email });
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

  /** Usuário novo (ou de alguém que já é deste salão) e sem outro profissional com ele. */
  private async validarLoginLivre(salaoId: string, email: string, ignorarId?: string) {
    if (await this.repository.emailEmUso(salaoId, email, ignorarId)) {
      throw new ConflitoError(
        'USUARIO_EM_USO',
        'Já existe um profissional com este usuário neste salão.',
      );
    }
    if (await this.repository.loginDeOutraPessoa(salaoId, email)) {
      throw new ConflitoError('USUARIO_EXISTE', 'Este usuário já existe. Escolha outro.');
    }
  }
}
