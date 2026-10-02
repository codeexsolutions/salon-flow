import { Injectable } from '@nestjs/common';
import type { AtualizarSalaoInput, CriarSalaoInput } from '@salonflow/shared';
import type { UsuarioAutenticado } from '../../shared/auth/usuario-autenticado.js';
import { ConflitoError, NaoEncontradoError } from '../../shared/errors/domain.error.js';
import { ContextoSalao } from '../../shared/tenant/contexto-salao.js';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import { gerarSlug } from './domain/slug.js';
import { SaloesRepository } from './saloes.repository.js';

/**
 * Camada de APLICAÇÃO: orquestra os casos de uso.
 * Conversa com outros módulos pelos SERVICES deles (nunca pelos repositories).
 */
@Injectable()
export class SaloesService {
  constructor(
    private readonly repository: SaloesRepository,
    private readonly usuarios: UsuariosService,
    private readonly contexto: ContextoSalao,
  ) {}

  async criar(usuario: UsuarioAutenticado, dados: CriarSalaoInput) {
    const slug = gerarSlug(dados.slug);
    if (await this.repository.slugExiste(slug)) {
      throw new ConflitoError('SLUG_EM_USO', 'Este endereço já está em uso por outro salão');
    }

    await this.usuarios.garantirCadastro(usuario);
    return this.repository.criarComDono({ ...dados, slug }, usuario.id);
  }

  buscarMarketplace(termo = '') {
    return this.repository.buscarMarketplace(termo.trim().slice(0, 80), 30);
  }

  async buscarPublico(slug: string) {
    const salao = await this.repository.buscarAtivoPorSlug(slug);
    if (!salao) throw new NaoEncontradoError('Salão');
    return salao;
  }

  async atual() {
    const salao = await this.repository.buscarPorId(this.contexto.salaoId);
    if (!salao) throw new NaoEncontradoError('Salão');
    return salao;
  }

  async atualizar(dados: AtualizarSalaoInput) {
    const salaoId = this.contexto.salaoId;

    if (dados.slug) {
      const slug = gerarSlug(dados.slug);
      const atual = await this.atual();
      if (slug !== atual.slug && (await this.repository.slugExiste(slug))) {
        throw new ConflitoError('SLUG_EM_USO', 'Este endereço já está em uso por outro salão');
      }
      dados = { ...dados, slug };
    }

    return this.repository.atualizar(salaoId, dados);
  }
}
