import { Injectable } from '@nestjs/common';
import type {
  AtualizarServicoInput,
  CriarServicoInput,
  DefinirProfissionaisServicoInput,
} from '@salonflow/shared';
import {
  ConflitoError,
  NaoEncontradoError,
  RegraDeNegocioError,
} from '../../shared/errors/domain.error.js';
import { ContextoSalao } from '../../shared/tenant/contexto-salao.js';
import { ProfissionaisService } from '../profissionais/profissionais.service.js';
import { ServicosRepository } from './servicos.repository.js';

@Injectable()
export class ServicosService {
  constructor(
    private readonly repository: ServicosRepository,
    private readonly profissionais: ProfissionaisService,
    private readonly contexto: ContextoSalao,
  ) {}

  listar(incluirInativos: boolean) {
    return this.repository.listar(this.contexto.salaoId, incluirInativos);
  }

  async buscar(id: string) {
    const servico = await this.repository.buscar(this.contexto.salaoId, id);
    if (!servico) throw new NaoEncontradoError('Serviço');
    return servico;
  }

  async criar(dados: CriarServicoInput) {
    const salaoId = this.contexto.salaoId;
    if (await this.repository.nomeEmUso(salaoId, dados.nome)) throw this.nomeDuplicado();
    return this.repository.criar(salaoId, dados);
  }

  async atualizar(id: string, dados: AtualizarServicoInput) {
    const salaoId = this.contexto.salaoId;
    await this.buscar(id);
    if (dados.nome && (await this.repository.nomeEmUso(salaoId, dados.nome, id))) {
      throw this.nomeDuplicado();
    }
    return this.repository.atualizar(salaoId, id, dados);
  }

  async definirProfissionais(id: string, dados: DefinirProfissionaisServicoInput) {
    await this.buscar(id);

    const ids = dados.profissionais.map((p) => p.profissionalId);
    const validos = await this.profissionais.contarAtivos(ids);
    if (validos !== ids.length) {
      throw new RegraDeNegocioError(
        'PROFISSIONAL_INVALIDO',
        'Há profissionais na lista que não existem neste salão ou estão desativados.',
      );
    }
    return this.repository.substituirProfissionais(this.contexto.salaoId, id, dados);
  }

  private nomeDuplicado() {
    return new ConflitoError('NOME_EM_USO', 'Já existe um serviço com este nome.');
  }
}
