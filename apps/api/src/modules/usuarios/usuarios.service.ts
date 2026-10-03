import { Injectable } from '@nestjs/common';
import type { PerfilUsuario } from '@salonflow/shared';
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
      email: cadastro.email,
      nome: cadastro.nome,
      avatarUrl: cadastro.avatarUrl,
      saloes: vinculos.map(({ papel, salao: { profissionais, ...salao } }) => ({
        ...salao,
        papel,
        ehProfissional: profissionais.length > 0,
      })),
    };
  }
}
