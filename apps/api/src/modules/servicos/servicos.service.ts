import { Injectable } from '@nestjs/common';
import type {
  AtualizarServicoInput,
  CriarServicoInput,
  DefinirProfissionaisServicoInput,
  ServicoOnline,
} from '@salonflow/shared';
import {
  ConflitoError,
  NaoEncontradoError,
  RegraDeNegocioError,
} from '../../shared/errors/domain.error.js';
import { ContextoSalao } from '../../shared/tenant/contexto-salao.js';
import { ProfissionaisService } from '../profissionais/profissionais.service.js';
import { valoresDoProfissional } from './domain/valores.js';
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

  /**
   * Para a agenda: quem pode fazer o serviço e com que preço/duração.
   * Com `profissionalId`, exige que esse profissional faça o serviço.
   */
  async opcoesDeAgendamento(servicoId: string, profissionalId?: string, somenteOnline = false) {
    const servico = await this.repository.paraAgendamento(
      this.contexto.salaoId,
      servicoId,
      profissionalId,
      somenteOnline,
    );
    if (!servico) throw new NaoEncontradoError('Serviço');
    if (profissionalId && servico.profissionais.length === 0) {
      throw new RegraDeNegocioError(
        'PROFISSIONAL_NAO_FAZ_SERVICO',
        'Este profissional não faz o serviço escolhido.',
      );
    }

    return {
      servico: { id: servico.id, nome: servico.nome },
      profissionais: servico.profissionais.map((sp) => ({
        profissionalId: sp.profissionalId,
        nome: sp.profissional.nome,
        ...valoresDoProfissional(servico, sp),
      })),
    };
  }

  /** Página pública do salão: serviços que o cliente pode agendar, com valores por profissional. */
  async catalogoOnline(): Promise<ServicoOnline[]> {
    const servicos = await this.repository.catalogoOnline(this.contexto.salaoId);
    return servicos.map((s) => ({
      id: s.id,
      nome: s.nome,
      descricao: s.descricao,
      categoria: s.categoria,
      precoCentavos: s.precoCentavos,
      duracaoMin: s.duracaoMin,
      profissionais: s.profissionais.map((sp) => ({
        id: sp.profissionalId,
        nome: sp.profissional.nome,
        ...valoresDoProfissional(s, sp),
      })),
    }));
  }

  private nomeDuplicado() {
    return new ConflitoError('NOME_EM_USO', 'Já existe um serviço com este nome.');
  }
}
