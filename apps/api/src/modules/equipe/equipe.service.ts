import { Injectable } from '@nestjs/common';
import type { ConvidarRecepcaoInput, ResultadoConvite } from '@salonflow/shared';
import { ConflitoError, NaoEncontradoError } from '../../shared/errors/domain.error.js';
import { ContextoSalao } from '../../shared/tenant/contexto-salao.js';
import { papelAoAceitarConvite, validarAlteracaoAcesso } from './domain/acesso.js';
import { EquipeRepository } from './equipe.repository.js';

@Injectable()
export class EquipeService {
  constructor(
    private readonly repository: EquipeRepository,
    private readonly contexto: ContextoSalao,
  ) {}

  async listar() {
    const salaoId = this.contexto.salaoId;
    const [membros, convites] = await Promise.all([
      this.repository.listarMembros(salaoId),
      this.repository.listarConvites(salaoId),
    ]);
    return { membros, convites };
  }

  /**
   * Libera o painel para a recepção. Se o e-mail já tem conta, o acesso vale na
   * hora; senão fica pendente até a pessoa entrar pela primeira vez.
   */
  async convidarRecepcao(dados: ConvidarRecepcaoInput): Promise<ResultadoConvite> {
    const salaoId = this.contexto.salaoId;
    const usuario = await this.repository.buscarUsuarioPorEmail(dados.email);

    if (!usuario) {
      await this.repository.salvarConvite(salaoId, { ...dados, papel: 'RECEPCAO' });
      return { situacao: 'PENDENTE' };
    }

    const atual = await this.repository.buscarMembroDoUsuario(salaoId, usuario.id);
    if (atual?.ativo && atual.papel !== 'PROFISSIONAL') {
      throw new ConflitoError('JA_TEM_ACESSO', 'Esta pessoa já tem acesso ao painel do salão.');
    }
    await this.repository.liberarAcesso(
      salaoId,
      usuario.id,
      papelAoAceitarConvite(atual?.papel ?? null, 'RECEPCAO'),
    );
    return { situacao: 'LIBERADO' };
  }

  async cancelarConvite(id: string) {
    const { count } = await this.repository.removerConvite(this.contexto.salaoId, id);
    if (count === 0) throw new NaoEncontradoError('Convite');
  }

  async alterarAcesso(id: string, ativo: boolean, usuarioLogadoId: string) {
    const salaoId = this.contexto.salaoId;
    const membro = await this.repository.buscarMembro(salaoId, id);
    if (!membro) throw new NaoEncontradoError('Membro');
    validarAlteracaoAcesso({ papel: membro.papel, ehVoce: membro.usuarioId === usuarioLogadoId });
    await this.repository.alterarAtivo(salaoId, id, ativo);
  }

  /** Usado no login (GET /me): convites deste e-mail viram acesso. */
  aceitarConvitesPendentes(usuarioId: string, email: string) {
    return this.repository.aceitarConvitesPendentes(usuarioId, email);
  }
}
