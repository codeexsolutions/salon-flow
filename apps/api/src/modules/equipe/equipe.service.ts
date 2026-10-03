import { Injectable } from '@nestjs/common';
import { emailDeLogin, type ConvidarRecepcaoInput, type ResultadoConvite } from '@salonflow/shared';
import { SupabaseAdminService } from '../../shared/auth/supabase-admin.service.js';
import { ConflitoError, NaoEncontradoError } from '../../shared/errors/domain.error.js';
import { ContextoSalao } from '../../shared/tenant/contexto-salao.js';
import {
  papelAoAceitarConvite,
  validarAlteracaoAcesso,
  validarRedefinicaoSenha,
} from './domain/acesso.js';
import { EquipeRepository } from './equipe.repository.js';

@Injectable()
export class EquipeService {
  constructor(
    private readonly repository: EquipeRepository,
    private readonly contexto: ContextoSalao,
    private readonly supabaseAdmin: SupabaseAdminService,
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
   * Libera o painel para a recepção. Se o usuário já tem conta, o acesso vale na
   * hora; senão fica pendente até a pessoa entrar pela primeira vez.
   */
  async convidarRecepcao({ nome, usuario: login }: ConvidarRecepcaoInput): Promise<ResultadoConvite> {
    const salaoId = this.contexto.salaoId;
    const email = emailDeLogin(login);
    const usuario = await this.repository.buscarUsuarioPorEmail(email);

    if (!usuario) {
      const convite = await this.repository.salvarConvite(salaoId, {
        nome,
        email,
        papel: 'RECEPCAO',
      });
      return { situacao: 'PENDENTE', conviteId: convite.id };
    }

    const atual = await this.repository.buscarMembroDoUsuario(salaoId, usuario.id);
    // Conta de quem não é do salão: o usuário é de outra pessoa.
    if (!atual) {
      throw new ConflitoError('USUARIO_EXISTE', 'Este usuário já existe. Escolha outro.');
    }
    if (atual.ativo && atual.papel !== 'PROFISSIONAL') {
      throw new ConflitoError('JA_TEM_ACESSO', 'Esta pessoa já tem acesso ao painel do salão.');
    }
    await this.repository.liberarAcesso(
      salaoId,
      usuario.id,
      papelAoAceitarConvite(atual.papel, 'RECEPCAO'),
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

  /** Senha nova para alguém da equipe que esqueceu a dele (só o dono). */
  async redefinirSenha(id: string, senha: string, usuarioLogadoId: string) {
    const salaoId = this.contexto.salaoId;
    const membro = await this.repository.buscarMembro(salaoId, id);
    if (!membro) throw new NaoEncontradoError('Membro');
    validarRedefinicaoSenha({
      papel: membro.papel,
      ehVoce: membro.usuarioId === usuarioLogadoId,
      temAcessoEmOutroSalao: await this.repository.temVinculoEmOutroSalao(
        salaoId,
        membro.usuarioId,
      ),
    });
    await this.supabaseAdmin.redefinirSenha(membro.usuarioId, senha);
  }

  /** Usado no login (GET /me): convites deste e-mail viram acesso. */
  aceitarConvitesPendentes(usuarioId: string, email: string) {
    return this.repository.aceitarConvitesPendentes(usuarioId, email);
  }
}
