import { Injectable } from '@nestjs/common';
import {
  permissoesEfetivas,
  usuarioDeLogin,
  type PerfilCliente,
  type PerfilClienteInput,
  type PerfilUsuario,
} from '@salonflow/shared';
import type { UsuarioAutenticado } from '../../shared/auth/usuario-autenticado.js';
import { EquipeService } from '../equipe/equipe.service.js';
import { ProfissionaisService } from '../profissionais/profissionais.service.js';
import { UsuariosRepository } from './usuarios.repository.js';

@Injectable()
export class UsuariosService {
  constructor(
    private readonly repository: UsuariosRepository,
    private readonly profissionais: ProfissionaisService,
    private readonly equipe: EquipeService,
  ) {}

  /** Garante que o usuário do Supabase existe no nosso banco. */
  garantirCadastro(usuario: UsuarioAutenticado) {
    return this.repository.upsert(usuario);
  }

  /** Cadastro opcional do cliente (compartilhado com os salões em que agenda). */
  async perfilCliente(usuario: UsuarioAutenticado): Promise<PerfilCliente> {
    await this.garantirCadastro(usuario);
    const { perfil, saloes } = await this.repository.perfilCliente(usuario.id);
    return {
      nome: perfil?.nome ?? null,
      telefone: perfil?.telefone ?? null,
      email: perfil?.email ?? null,
      nascimento: perfil?.nascimento?.toISOString().slice(0, 10) ?? null,
      saloes,
    };
  }

  async salvarPerfilCliente(usuario: UsuarioAutenticado, dados: PerfilClienteInput) {
    await this.garantirCadastro(usuario);
    await this.repository.salvarPerfilCliente(usuario.id, dados);
    return this.perfilCliente(usuario);
  }

  /** Perfil + salões em que o usuário atua. Sem salões = usuário apenas cliente. */
  async perfil(usuario: UsuarioAutenticado): Promise<PerfilUsuario> {
    const cadastro = await this.garantirCadastro(usuario);
    // Profissional cadastrado com este e-mail ganha acesso ao app ao entrar.
    await this.profissionais.vincularConvitesPendentes(cadastro.id, cadastro.email);
    // Recepção liberada pelo dono com este e-mail também.
    await this.equipe.aceitarConvitesPendentes(cadastro.id, cadastro.email);
    const vinculos = await this.repository.buscarVinculosAtivos(usuario.id);

    return {
      id: cadastro.id,
      usuario: usuarioDeLogin(cadastro.email),
      email: cadastro.email,
      nome: cadastro.nome,
      avatarUrl: cadastro.avatarUrl,
      temRecuperacao: cadastro.recuperacaoHash !== null,
      saloes: vinculos.map(({ papel, permissoes, salao: { profissionais, ...salao } }) => ({
        ...salao,
        papel,
        ehProfissional: profissionais.length > 0,
        permissoes: permissoesEfetivas(papel, permissoes),
      })),
    };
  }
}
