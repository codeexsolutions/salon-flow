import { Injectable } from '@nestjs/common';
import type { UsuarioAutenticado } from '../../shared/auth/usuario-autenticado.js';
import { UsuariosRepository } from './usuarios.repository.js';

@Injectable()
export class UsuariosService {
  constructor(private readonly repository: UsuariosRepository) {}

  /** Garante que o usuário do Supabase existe no nosso banco. */
  garantirCadastro(usuario: UsuarioAutenticado) {
    return this.repository.upsert(usuario);
  }

  /** Perfil + salões em que o usuário atua. Sem salões = usuário apenas cliente. */
  async perfil(usuario: UsuarioAutenticado) {
    const cadastro = await this.garantirCadastro(usuario);
    const vinculos = await this.repository.buscarVinculosAtivos(usuario.id);

    return {
      id: cadastro.id,
      email: cadastro.email,
      nome: cadastro.nome,
      avatarUrl: cadastro.avatarUrl,
      saloes: vinculos.map((v) => ({ ...v.salao, papel: v.papel })),
    };
  }
}
