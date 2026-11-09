import { Injectable } from '@nestjs/common';
import {
  TAMANHO_MAXIMO_CONTRATO_BYTES,
  type ContratoInput,
  type EncerrarContratoInput,
  type SituacaoContrato,
  type SugestaoContrato,
} from '@salonflow/shared';
import {
  ConflitoError,
  NaoEncontradoError,
  RegraDeNegocioError,
} from '../../shared/errors/domain.error.js';
import { ContextoSalao } from '../../shared/tenant/contexto-salao.js';
import { ComissoesService } from '../comissoes/comissoes.service.js';
import { ProfissionaisService } from '../profissionais/profissionais.service.js';
import { ServicosService } from '../servicos/servicos.service.js';
import { paraContratoDetalhe, paraContratoResumo } from './contratos.mapper.js';
import { ContratosRepository } from './contratos.repository.js';
import { pendenciasParaAtivar, validarEncerramento } from './domain/contrato.js';

/** Ordem para escolher o contrato que representa o profissional. */
const PRIORIDADE = { ATIVO: 0, RASCUNHO: 1, ENCERRADO: 2 } as const;

export interface ArquivoEnviado {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
}

@Injectable()
export class ContratosService {
  constructor(
    private readonly repository: ContratosRepository,
    private readonly profissionais: ProfissionaisService,
    private readonly servicos: ServicosService,
    private readonly comissoes: ComissoesService,
    private readonly contexto: ContextoSalao,
  ) {}

  /** Profissionais ativos e a situação do contrato de cada um. */
  async situacao(): Promise<SituacaoContrato[]> {
    const [profissionais, contratos] = await Promise.all([
      this.profissionais.listar(false),
      this.repository.listar(this.contexto.salaoId),
    ]);
    return profissionais.map((p) => {
      const doProfissional = contratos
        .filter((c) => c.profissionalId === p.id)
        .sort((a, b) => PRIORIDADE[a.status] - PRIORIDADE[b.status]);
      return {
        profissionalId: p.id,
        nome: p.nome,
        contrato: doProfissional[0] ? paraContratoResumo(doProfissional[0]) : null,
      };
    });
  }

  async historico(profissionalId?: string) {
    const contratos = await this.repository.listar(this.contexto.salaoId, profissionalId);
    return contratos.map(paraContratoResumo);
  }

  async detalhe(id: string) {
    const salaoId = this.contexto.salaoId;
    const contrato = await this.repository.buscar(salaoId, id);
    if (!contrato) throw new NaoEncontradoError('Contrato');
    const [servicos, { salao }] = await Promise.all([
      this.repository.nomesDosServicos(salaoId, contrato.servicoIds),
      this.repository.dadosParaSugestao(salaoId, contrato.profissionalId),
    ]);
    return paraContratoDetalhe(contrato, servicos, salao.nome);
  }

  /** Dados para começar um contrato: salão do último contrato, serviços e comissão dele. */
  async sugestao(profissionalId: string): Promise<SugestaoContrato> {
    const [{ salao, profissional, ultimo }, parametros] = await Promise.all([
      this.repository.dadosParaSugestao(this.contexto.salaoId, profissionalId),
      this.comissoes.parametrosDeCalculo(),
    ]);
    if (!profissional) throw new NaoEncontradoError('Profissional');
    const cidade = salao.cidade ? `${salao.cidade}${salao.uf ? `/${salao.uf}` : ''}` : null;
    const enderecoSalao = [salao.endereco, salao.bairro, cidade].filter(Boolean).join(', ');
    const cota =
      parametros.regras.find((r) => r.profissionalId === profissionalId && r.servicoId === null)
        ?.percentualBps ?? parametros.padraoBps;

    return {
      profissionalId,
      salaoRazaoSocial: ultimo?.salaoRazaoSocial ?? salao.nome,
      salaoDocumento: ultimo?.salaoDocumento ?? '',
      salaoEndereco: ultimo?.salaoEndereco ?? enderecoSalao,
      profissionalNome: profissional.nome,
      profissionalDocumento: '',
      profissionalMei: true,
      profissionalEndereco: '',
      funcoes: [],
      servicoIds: profissional.servicos.map((s) => s.servicoId),
      cotaProfissionalBps: cota,
      periodicidade: ultimo?.periodicidade ?? 'MENSAL',
      inicioEm: new Date().toISOString().slice(0, 10),
      assinadoEm: null,
      homologacao: null,
      homologadoEm: null,
      testemunhas: [],
    };
  }

  async criar(dados: ContratoInput) {
    await this.validar(dados);
    const contrato = await this.repository.criar(this.contexto.salaoId, dados);
    return this.detalhe(contrato.id);
  }

  async atualizar(id: string, dados: ContratoInput) {
    const salaoId = this.contexto.salaoId;
    const atual = await this.repository.buscar(salaoId, id);
    if (!atual) throw new NaoEncontradoError('Contrato');
    if (atual.status === 'ENCERRADO') {
      throw new RegraDeNegocioError(
        'CONTRATO_ENCERRADO',
        'Contrato encerrado não pode ser alterado.',
      );
    }
    if (atual.status === 'RASCUNHO') {
      await this.validar({ ...dados, profissionalId: atual.profissionalId });
      await this.repository.atualizarRascunho(salaoId, id, dados);
    } else {
      // Ativo: o conteúdo do contrato assinado não muda; só a formalização.
      await this.repository.atualizarFormalizacao(salaoId, id, dados);
    }
    return this.detalhe(id);
  }

  async ativar(id: string) {
    const contrato = await this.detalhe(id);
    const pendencias = pendenciasParaAtivar(contrato);
    if (pendencias.length > 0) {
      throw new RegraDeNegocioError('CONTRATO_INCOMPLETO', `${pendencias.join('. ')}.`);
    }
    const r = await this.repository.ativar(this.contexto.salaoId, id, contrato.profissionalId);
    if (r === 'OUTRO_ATIVO') {
      throw new ConflitoError(
        'OUTRO_CONTRATO_ATIVO',
        'Este profissional já tem um contrato ativo. Encerre-o antes de ativar outro.',
      );
    }
    if (r === 'NAO_RASCUNHO') {
      throw new ConflitoError(
        'CONTRATO_NAO_RASCUNHO',
        'Este contrato já foi ativado ou encerrado.',
      );
    }
    return this.detalhe(id);
  }

  async encerrar(id: string, dados: EncerrarContratoInput) {
    const contrato = await this.detalhe(id);
    if (contrato.status !== 'ATIVO') {
      throw new ConflitoError('CONTRATO_NAO_ATIVO', 'Só um contrato ativo pode ser encerrado.');
    }
    validarEncerramento({ inicioEm: contrato.inicioEm, ...dados });
    await this.repository.encerrar(this.contexto.salaoId, id, dados);
    return this.detalhe(id);
  }

  async excluir(id: string) {
    if (!(await this.repository.excluirRascunho(this.contexto.salaoId, id))) {
      throw new RegraDeNegocioError(
        'CONTRATO_NAO_RASCUNHO',
        'Só é possível excluir um contrato em rascunho.',
      );
    }
  }

  async salvarArquivo(id: string, arquivo: ArquivoEnviado | undefined) {
    const salaoId = this.contexto.salaoId;
    if (!(await this.repository.buscar(salaoId, id))) throw new NaoEncontradoError('Contrato');
    const ehPdf =
      !!arquivo &&
      arquivo.mimetype === 'application/pdf' &&
      arquivo.buffer.subarray(0, 4).toString('latin1') === '%PDF';
    if (!ehPdf) throw new RegraDeNegocioError('ARQUIVO_INVALIDO', 'Envie o contrato em PDF.');
    if (arquivo.buffer.length > TAMANHO_MAXIMO_CONTRATO_BYTES) {
      throw new RegraDeNegocioError('ARQUIVO_GRANDE', 'O PDF pode ter no máximo 5 MB.');
    }
    const nome = arquivo.originalname.slice(0, 120) || 'contrato.pdf';
    await this.repository.salvarArquivo(salaoId, id, nome, arquivo.buffer);
    return this.detalhe(id);
  }

  async arquivo(id: string) {
    const arquivo = await this.repository.arquivo(this.contexto.salaoId, id);
    if (!arquivo) throw new NaoEncontradoError('Arquivo do contrato');
    return arquivo;
  }

  // ---------- App do profissional ----------

  /** Contrato do profissional logado: o ativo; sem ele, o mais recente. */
  async doUsuario(usuarioId: string) {
    const profissional = await this.profissionais.doUsuario(usuarioId);
    const contratos = await this.repository.listar(this.contexto.salaoId, profissional.id);
    const [principal] = contratos.sort((a, b) => PRIORIDADE[a.status] - PRIORIDADE[b.status]);
    return principal ? this.detalhe(principal.id) : null;
  }

  async arquivoDoUsuario(usuarioId: string) {
    const contrato = await this.doUsuario(usuarioId);
    if (!contrato) throw new NaoEncontradoError('Contrato');
    return this.arquivo(contrato.id);
  }

  private async validar(dados: ContratoInput) {
    await this.profissionais.buscar(dados.profissionalId);
    if ((await this.servicos.contarDoSalao(dados.servicoIds)) !== dados.servicoIds.length) {
      throw new RegraDeNegocioError('SERVICO_INVALIDO', 'Há serviços que não são deste salão.');
    }
  }
}
