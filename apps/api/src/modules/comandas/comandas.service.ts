import { Injectable } from '@nestjs/common';
import type {
  AdicionarItemComandaInput,
  AtualizarComandaInput,
  AtualizarItemComandaInput,
  CriarComandaInput,
  DataAtendimentoComandaInput,
  FecharComandaInput,
  ReabrirComandaInput,
} from '@salonflow/shared';
import { limitesDoDia, localParaUtc, utcParaLocal } from '../../shared/domain/data-hora.js';
import {
  ConflitoError,
  NaoEncontradoError,
  RegraDeNegocioError,
} from '../../shared/errors/domain.error.js';
import { ContextoSalao } from '../../shared/tenant/contexto-salao.js';
import { AgendaService } from '../agenda/agenda.service.js';
import { CaixaService } from '../caixa/caixa.service.js';
import { ClientesService } from '../clientes/clientes.service.js';
import { calcularFechamento } from '../comissoes/domain/calculo.js';
import { ComissoesService } from '../comissoes/comissoes.service.js';
import { ProdutosService } from '../produtos/produtos.service.js';
import { ServicosService } from '../servicos/servicos.service.js';
import { ComandasRepository, type DestinoCaixa, type NovoItem } from './comandas.repository.js';
import {
  diasEntre,
  LIMITE_DIAS_RETROATIVOS,
  planoDeCaixa,
  validarDataAtendimento,
} from './domain/lancamento.js';

@Injectable()
export class ComandasService {
  constructor(
    private readonly repository: ComandasRepository,
    private readonly agenda: AgendaService,
    private readonly clientes: ClientesService,
    private readonly servicos: ServicosService,
    private readonly comissoes: ComissoesService,
    private readonly produtos: ProdutosService,
    private readonly caixa: CaixaService,
    private readonly contexto: ContextoSalao,
  ) {}

  /** Comandas abertas + as fechadas/canceladas no dia (data local do salão). */
  listar(data: string) {
    const { inicio, fim } = limitesDoDia(data, this.contexto.fusoHorario);
    return this.repository.listar(this.contexto.salaoId, inicio, fim);
  }

  async buscar(id: string) {
    const comanda = await this.repository.buscar(this.contexto.salaoId, id);
    if (!comanda) throw new NaoEncontradoError('Comanda');
    return comanda;
  }

  /** Abre a comanda, opcionalmente já com os serviços de agendamentos do cliente. */
  async criar({ clienteId, agendamentoIds = [] }: Partial<CriarComandaInput>, usuarioId: string) {
    let itens: NovoItem[] = [];
    let cliente = clienteId;

    if (agendamentoIds.length > 0) {
      const agendamentos = await this.agenda.paraComanda(agendamentoIds);
      if (cliente && cliente !== agendamentos[0].clienteId) {
        throw new RegraDeNegocioError(
          'CLIENTES_DIFERENTES',
          'Os agendamentos são de outro cliente.',
        );
      }
      cliente = agendamentos[0].clienteId;
      itens = agendamentos.map((a) => ({
        tipo: 'SERVICO' as const,
        servicoId: a.servicoId,
        profissionalId: a.profissionalId,
        agendamentoId: a.id,
        descricao: a.servico.nome,
        valorCentavos: a.precoCentavos,
      }));
    } else if (cliente) {
      await this.clientes.obter(cliente);
    }

    return this.repository.criar(this.contexto.salaoId, {
      clienteId: cliente,
      abertaPorId: usuarioId,
      itens,
    });
  }

  async adicionarItem(id: string, dados: AdicionarItemComandaInput) {
    await this.buscarAberta(id);

    if (dados.tipo === 'SERVICO') {
      const opcoes = await this.servicos.opcoesDeAgendamento(dados.servicoId, dados.profissionalId);
      await this.repository.adicionarItem(this.contexto.salaoId, id, {
        tipo: 'SERVICO',
        servicoId: dados.servicoId,
        profissionalId: dados.profissionalId,
        descricao: opcoes.servico.nome,
        valorCentavos: dados.valorCentavos ?? opcoes.profissionais[0].precoCentavos,
      });
    } else {
      const produto = await this.produtos.buscar(dados.produtoId);
      const unitario = dados.valorUnitarioCentavos ?? produto.precoVendaCentavos;
      if (!produto.ativo || unitario === null) {
        throw new RegraDeNegocioError(
          'PRODUTO_NAO_VENDAVEL',
          'Este produto não está à venda. Defina um preço de venda no cadastro ou informe o valor.',
        );
      }
      await this.repository.adicionarItem(this.contexto.salaoId, id, {
        tipo: 'PRODUTO',
        produtoId: produto.id,
        descricao: produto.nome,
        quantidade: dados.quantidade,
        valorCentavos: unitario * dados.quantidade,
      });
    }
    return this.buscar(id);
  }

  /** Corrige valor cobrado ("a partir de") e/ou profissional de um item da comanda aberta. */
  async atualizarItem(id: string, itemId: string, dados: AtualizarItemComandaInput) {
    const comanda = await this.buscarAberta(id);
    const item = comanda.itens.find((i) => i.id === itemId);
    if (!item) throw new NaoEncontradoError('Item');

    if (dados.profissionalId !== undefined && dados.profissionalId !== item.profissionalId) {
      if (item.tipo !== 'SERVICO' || !item.servicoId) {
        throw new RegraDeNegocioError(
          'ITEM_SEM_PROFISSIONAL',
          'Venda de produto não tem profissional.',
        );
      }
      // Valida que o profissional (do salão) faz o serviço.
      await this.servicos.opcoesDeAgendamento(item.servicoId, dados.profissionalId);
    }

    if (!(await this.repository.atualizarItem(this.contexto.salaoId, id, itemId, dados))) {
      throw this.naoEstaAberta();
    }
    return this.buscar(id);
  }

  async removerItem(id: string, itemId: string) {
    await this.buscarAberta(id);
    if (!(await this.repository.removerItem(this.contexto.salaoId, id, itemId))) {
      throw new NaoEncontradoError('Item');
    }
    return this.buscar(id);
  }

  async atualizar(id: string, dados: AtualizarComandaInput) {
    await this.buscarAberta(id);
    if (dados.clienteId) await this.clientes.obter(dados.clienteId);
    return this.repository.atualizar(this.contexto.salaoId, id, dados);
  }

  /**
   * Fecha: confere pagamentos, calcula e GRAVA as comissões (com custo da ficha
   * técnica), baixa o estoque e conclui os agendamentos.
   */
  async fechar(
    id: string,
    { pagamentos, confirmarCaixaFechado }: FecharComandaInput,
    usuarioId: string,
  ) {
    const comanda = await this.buscarAberta(id);
    const fuso = this.contexto.fusoHorario;
    const hoje = this.hoje();
    const dataAtendimento = comanda.competenciaEm
      ? utcParaLocal(comanda.competenciaEm, fuso).slice(0, 10)
      : null;
    const [parametros, consumo, caixaAbertoAgora, caixaDoDia] = await Promise.all([
      this.comissoes.parametrosDeCalculo(),
      this.produtos.consumoDaComanda(comanda.itens),
      this.caixa.idDoCaixaAberto(),
      dataAtendimento ? this.caixa.caixaDoDia(dataAtendimento) : Promise.resolve(null),
    ]);

    const plano = planoDeCaixa({ dataAtendimento, hoje, caixaAbertoAgora, caixaDoDia });
    if (plano.tipo === 'USAR' && plano.exigeConfirmacao && !confirmarCaixaFechado) {
      throw new ConflitoError(
        'CAIXA_DO_DIA_FECHADO',
        `O caixa de ${dataAtendimento!.split('-').reverse().join('/')} já foi fechado. ` +
          'Os pagamentos vão entrar nele e a conferência do dinheiro será recalculada.',
      );
    }
    const destino: DestinoCaixa =
      plano.tipo === 'USAR'
        ? { tipo: 'EXISTENTE', caixaId: plano.caixaId }
        : plano.tipo === 'CRIAR'
          ? {
              tipo: 'DO_DIA',
              ...limitesDoDia(dataAtendimento!, fuso),
              abertoEm: comanda.competenciaEm!,
            }
          : { tipo: 'NENHUM' };

    const fechamento = calcularFechamento({
      itens: comanda.itens.map((i) => ({
        ...i,
        custoProdutosCentavos: consumo.custoPorItem.get(i.id) ?? 0,
      })),
      descontoCentavos: comanda.descontoCentavos,
      pagamentos,
      ...parametros,
    });

    const fechada = await this.repository.fechar(
      this.contexto.salaoId,
      id,
      fechamento,
      consumo.saidas,
      destino,
      usuarioId,
      comanda.competenciaEm ?? new Date(),
    );
    if (!fechada) throw this.naoEstaAberta();

    await this.agenda.concluirDaComanda(
      comanda.itens.map((i) => i.agendamentoId).filter((a): a is string => !!a),
    );
    return fechada;
  }

  /**
   * Lançamento atrasado: define em que dia o atendimento aconteceu (só o dono).
   * null ou hoje = comanda normal.
   */
  async definirDataAtendimento(id: string, { data }: DataAtendimentoComandaInput) {
    await this.buscarAberta(id);
    const hoje = this.hoje();
    if (data && data !== hoje) {
      const erro = validarDataAtendimento(data, hoje);
      if (erro) throw new RegraDeNegocioError('DATA_ATENDIMENTO_INVALIDA', erro);
    }
    const competencia =
      data && data !== hoje ? localParaUtc(`${data}T12:00`, this.contexto.fusoHorario) : null;
    if (!(await this.repository.definirCompetencia(this.contexto.salaoId, id, competencia))) {
      throw this.naoEstaAberta();
    }
    return this.buscar(id);
  }

  /**
   * Reabre comanda fechada para correção (só o dono): desfaz pagamentos, estoque e
   * comissões; ao fechar de novo, mantém a data do atendimento original.
   */
  async reabrir(id: string, { motivo }: ReabrirComandaInput, usuarioId: string) {
    const comanda = await this.buscar(id);
    if (comanda.status !== 'FECHADA' || !comanda.fechadaEm) {
      throw new ConflitoError('COMANDA_NAO_FECHADA', 'Só é possível reabrir comanda fechada.');
    }
    const diaDoAtendimento = utcParaLocal(comanda.fechadaEm, this.contexto.fusoHorario).slice(
      0,
      10,
    );
    if (diasEntre(diaDoAtendimento, this.hoje()) > LIMITE_DIAS_RETROATIVOS) {
      throw new RegraDeNegocioError(
        'COMANDA_ANTIGA',
        `Só é possível reabrir comandas dos últimos ${LIMITE_DIAS_RETROATIVOS} dias.`,
      );
    }
    const r = await this.repository.reabrir(this.contexto.salaoId, id, motivo, usuarioId);
    if (r === 'REPASSE') {
      throw new RegraDeNegocioError(
        'COMANDA_COM_REPASSE',
        'A comissão desta comanda já foi paga em um repasse. Cancele o repasse antes de reabrir.',
      );
    }
    if (r === 'NAO_FECHADA') {
      throw new ConflitoError('COMANDA_NAO_FECHADA', 'Só é possível reabrir comanda fechada.');
    }
    return this.buscar(id);
  }

  async cancelar(id: string) {
    await this.buscarAberta(id);
    if (!(await this.repository.cancelar(this.contexto.salaoId, id))) {
      throw this.naoEstaAberta();
    }
    return this.buscar(id);
  }

  private async buscarAberta(id: string) {
    const comanda = await this.buscar(id);
    if (comanda.status !== 'ABERTA') throw this.naoEstaAberta();
    return comanda;
  }

  /** Data local de hoje no fuso do salão. */
  private hoje() {
    return utcParaLocal(new Date(), this.contexto.fusoHorario).slice(0, 10);
  }

  private naoEstaAberta() {
    return new ConflitoError('COMANDA_NAO_ABERTA', 'Esta comanda já foi fechada ou cancelada.');
  }
}
