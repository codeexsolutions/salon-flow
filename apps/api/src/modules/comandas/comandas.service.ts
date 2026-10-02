import { Injectable } from '@nestjs/common';
import type {
  AdicionarItemComandaInput,
  AtualizarComandaInput,
  CriarComandaInput,
  FecharComandaInput,
} from '@salonflow/shared';
import { limitesDoDia } from '../../shared/domain/data-hora.js';
import {
  ConflitoError,
  NaoEncontradoError,
  RegraDeNegocioError,
} from '../../shared/errors/domain.error.js';
import { ContextoSalao } from '../../shared/tenant/contexto-salao.js';
import { AgendaService } from '../agenda/agenda.service.js';
import { ClientesService } from '../clientes/clientes.service.js';
import { calcularFechamento } from '../comissoes/domain/calculo.js';
import { ComissoesService } from '../comissoes/comissoes.service.js';
import { ServicosService } from '../servicos/servicos.service.js';
import { ComandasRepository, type NovoItem } from './comandas.repository.js';

@Injectable()
export class ComandasService {
  constructor(
    private readonly repository: ComandasRepository,
    private readonly agenda: AgendaService,
    private readonly clientes: ClientesService,
    private readonly servicos: ServicosService,
    private readonly comissoes: ComissoesService,
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
    const opcoes = await this.servicos.opcoesDeAgendamento(dados.servicoId, dados.profissionalId);
    await this.repository.adicionarItem(this.contexto.salaoId, id, {
      servicoId: dados.servicoId,
      profissionalId: dados.profissionalId,
      descricao: opcoes.servico.nome,
      valorCentavos: dados.valorCentavos ?? opcoes.profissionais[0].precoCentavos,
    });
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

  /** Fecha: confere pagamentos, calcula e GRAVA as comissões, conclui os agendamentos. */
  async fechar(id: string, { pagamentos }: FecharComandaInput, usuarioId: string) {
    const comanda = await this.buscarAberta(id);
    const parametros = await this.comissoes.parametrosDeCalculo();

    const fechamento = calcularFechamento({
      itens: comanda.itens,
      descontoCentavos: comanda.descontoCentavos,
      pagamentos,
      ...parametros,
    });

    const fechada = await this.repository.fechar(this.contexto.salaoId, id, fechamento, usuarioId);
    if (!fechada) throw this.naoEstaAberta();

    await this.agenda.concluirDaComanda(
      comanda.itens.map((i) => i.agendamentoId).filter((a): a is string => !!a),
    );
    return fechada;
  }

  async cancelar(id: string) {
    await this.buscarAberta(id);
    if (!(await this.repository.alterarStatus(this.contexto.salaoId, id, 'ABERTA', 'CANCELADA'))) {
      throw this.naoEstaAberta();
    }
    return this.buscar(id);
  }

  private async buscarAberta(id: string) {
    const comanda = await this.buscar(id);
    if (comanda.status !== 'ABERTA') throw this.naoEstaAberta();
    return comanda;
  }

  private naoEstaAberta() {
    return new ConflitoError('COMANDA_NAO_ABERTA', 'Esta comanda já foi fechada ou cancelada.');
  }
}
