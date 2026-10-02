import { Injectable } from '@nestjs/common';
import {
  ANTECEDENCIA_MINIMA_APP_MIN,
  JANELA_AGENDAMENTO_APP_DIAS,
  MAX_AGENDAMENTOS_ABERTOS_POR_CLIENTE,
  PRAZO_CANCELAMENTO_CLIENTE_MIN,
  type AgendaDia,
  type AgendarPeloAppInput,
  type MeuAgendamento,
  type AlterarStatusAgendamentoInput,
  type CriarAgendamentoInput,
  type HorariosLivresProfissional,
  type HorariosLivresQuery,
  type RemarcarAgendamentoInput,
} from '@salonflow/shared';
import type { UsuarioAutenticado } from '../../shared/auth/usuario-autenticado.js';
import {
  diaSemanaDe,
  limitesDoDia,
  localParaUtc,
  minutosParaHora,
  utcParaLocal,
} from '../../shared/domain/data-hora.js';
import {
  ConflitoError,
  NaoEncontradoError,
  RegraDeNegocioError,
} from '../../shared/errors/domain.error.js';
import { ContextoSalao } from '../../shared/tenant/contexto-salao.js';
import { ClientesService } from '../clientes/clientes.service.js';
import { ProfissionaisService } from '../profissionais/profissionais.service.js';
import { ServicosService } from '../servicos/servicos.service.js';
import { paraAgendamentoAgenda } from './agenda.mapper.js';
import { AgendamentosRepository } from './agendamentos.repository.js';
import { avaliarHorario, horariosLivres, type Periodo } from './domain/disponibilidade.js';
import {
  avaliarHorarioApp,
  clientePodeCancelar,
  primeiroHorarioApp,
} from './domain/regras-cliente.js';
import { podeMudarStatus, podeRemarcar } from './domain/status.js';

const MENSAGENS_RECUSA = {
  BLOQUEADO:
    'O profissional está de folga nesse horário. Marque como encaixe para agendar mesmo assim.',
  FORA_DA_JORNADA:
    'Fora do horário de trabalho do profissional. Marque como encaixe para agendar mesmo assim.',
};

@Injectable()
export class AgendaService {
  constructor(
    private readonly repository: AgendamentosRepository,
    private readonly profissionais: ProfissionaisService,
    private readonly servicos: ServicosService,
    private readonly clientes: ClientesService,
    private readonly contexto: ContextoSalao,
  ) {}

  /** Agenda de um dia: quem trabalha, jornada, folgas e agendamentos. */
  async agendaDoDia(data: string): Promise<AgendaDia> {
    const fuso = this.contexto.fusoHorario;
    const { inicio, fim } = limitesDoDia(data, fuso);
    const dia = diaSemanaDe(data);

    const [profissionais, agendamentos] = await Promise.all([
      this.profissionais.dadosDeAgenda(inicio, fim),
      this.repository.listarDoPeriodo(this.contexto.salaoId, inicio, fim),
    ]);

    // Mostra quem trabalha no dia ou tem algum atendimento nele (ex.: encaixe).
    const comAtendimento = new Set(agendamentos.map((a) => a.profissionalId));
    const visiveis = profissionais.filter(
      (p) => p.jornada.some((j) => j.diaSemana === dia) || comAtendimento.has(p.id),
    );

    return {
      data,
      fusoHorario: fuso,
      profissionais: visiveis.map((p) => ({
        id: p.id,
        nome: p.nome,
        corAgenda: p.corAgenda,
        jornada: p.jornada
          .filter((j) => j.diaSemana === dia)
          .map((j) => ({ inicio: minutosParaHora(j.inicioMin), fim: minutosParaHora(j.fimMin) })),
      })),
      agendamentos: agendamentos.map(paraAgendamentoAgenda),
      bloqueios: visiveis.flatMap((p) =>
        p.bloqueios.map((b) => ({
          id: b.id,
          profissionalId: p.id,
          inicio: b.inicio.toISOString(),
          fim: b.fim.toISOString(),
          motivo: b.motivo,
        })),
      ),
    };
  }

  /**
   * Horários livres do serviço no dia, por profissional que o faz.
   * `paraApp`: só serviços online e respeitando antecedência mínima/janela do cliente.
   */
  async horariosLivres(
    { servicoId, data, profissionalId }: HorariosLivresQuery,
    paraApp = false,
  ): Promise<HorariosLivresProfissional[]> {
    const fuso = this.contexto.fusoHorario;
    const opcoes = await this.servicos.opcoesDeAgendamento(servicoId, profissionalId, paraApp);
    const ids = opcoes.profissionais.map((p) => p.profissionalId);
    if (ids.length === 0) return [];

    const { inicio, fim } = limitesDoDia(data, fuso);
    const [profissionais, ocupacoes] = await Promise.all([
      this.profissionais.dadosDeAgenda(inicio, fim, ids),
      this.repository.ocupacoes(this.contexto.salaoId, ids, inicio, fim),
    ]);
    const dia = diaSemanaDe(data);
    const agora = new Date();

    return opcoes.profissionais.map((opcao) => {
      const p = profissionais.find((x) => x.id === opcao.profissionalId);
      const livres = p
        ? horariosLivres({
            data,
            fuso,
            jornada: p.jornada.filter((j) => j.diaSemana === dia),
            ocupados: [
              ...p.bloqueios,
              ...ocupacoes.filter((o) => o.profissionalId === opcao.profissionalId),
            ],
            duracaoMin: opcao.duracaoMin,
            naoAntesDe: paraApp ? primeiroHorarioApp(agora) : agora,
          }).filter((d) => !paraApp || avaliarHorarioApp(d, agora) === null)
        : [];
      return {
        ...opcao,
        horarios: livres.map((d) => ({
          inicio: d.toISOString(),
          inicioLocal: utcParaLocal(d, fuso),
        })),
      };
    });
  }

  /** Agendamento feito pela equipe no painel. */
  criar(dados: CriarAgendamentoInput, usuarioId: string) {
    return this.inserir({ ...dados, origem: 'SALAO', criadoPorId: usuarioId });
  }

  /** Agendamento feito pelo próprio cliente no app (página do salão). */
  async agendarPeloApp(usuario: UsuarioAutenticado, dados: AgendarPeloAppInput) {
    const agora = new Date();
    const recusa = avaliarHorarioApp(localParaUtc(dados.inicio, this.contexto.fusoHorario), agora);
    if (recusa === 'ANTECEDENCIA_MINIMA') {
      throw new RegraDeNegocioError(
        recusa,
        `Escolha um horário com pelo menos ${ANTECEDENCIA_MINIMA_APP_MIN} minutos de antecedência.`,
      );
    }
    if (recusa === 'FORA_DA_JANELA') {
      throw new RegraDeNegocioError(
        recusa,
        `É possível agendar com até ${JANELA_AGENDAMENTO_APP_DIAS} dias de antecedência.`,
      );
    }

    const cliente = await this.clientes.garantirParaUsuario(usuario);
    const abertos = await this.repository.contarAbertosDoCliente(
      this.contexto.salaoId,
      cliente.id,
      agora,
    );
    if (abertos >= MAX_AGENDAMENTOS_ABERTOS_POR_CLIENTE) {
      throw new RegraDeNegocioError(
        'LIMITE_AGENDAMENTOS',
        `Você já tem ${abertos} agendamentos em aberto neste salão. Cancele um para marcar outro.`,
      );
    }

    return this.inserir({
      ...dados,
      clienteId: cliente.id,
      encaixe: false,
      origem: 'APP_CLIENTE',
      criadoPorId: usuario.id,
      somenteOnline: true,
    });
  }

  private async inserir(
    dados: CriarAgendamentoInput & {
      origem: 'SALAO' | 'APP_CLIENTE';
      criadoPorId: string;
      somenteOnline?: boolean;
    },
  ) {
    await this.clientes.obter(dados.clienteId);
    const opcoes = await this.servicos.opcoesDeAgendamento(
      dados.servicoId,
      dados.profissionalId,
      dados.somenteOnline,
    );
    const { precoCentavos, duracaoMin } = opcoes.profissionais[0];

    const periodo = this.periodo(dados.inicio, duracaoMin);
    await this.validarHorario(dados.profissionalId, dados.inicio, periodo, dados.encaixe);

    const criado = await this.repository.inserirSemConflito({
      salaoId: this.contexto.salaoId,
      clienteId: dados.clienteId,
      profissionalId: dados.profissionalId,
      servicoId: dados.servicoId,
      inicio: periodo.inicio,
      fim: periodo.fim,
      precoCentavos,
      observacoes: dados.observacoes,
      origem: dados.origem,
      criadoPorId: dados.criadoPorId,
    });
    if (!criado) throw this.horarioOcupado();
    return criado;
  }

  /**
   * Para abrir comanda: os agendamentos pedidos, todos do mesmo cliente, válidos e
   * ainda sem comanda.
   */
  async paraComanda(ids: string[]) {
    const unicos = [...new Set(ids)];
    const agendamentos = await this.repository.paraComanda(this.contexto.salaoId, unicos);
    if (agendamentos.length !== unicos.length) {
      throw new RegraDeNegocioError(
        'AGENDAMENTO_INDISPONIVEL',
        'Algum agendamento não existe, foi cancelado ou já está em outra comanda.',
      );
    }
    if (new Set(agendamentos.map((a) => a.clienteId)).size > 1) {
      throw new RegraDeNegocioError(
        'CLIENTES_DIFERENTES',
        'Uma comanda só pode ter agendamentos do mesmo cliente.',
      );
    }
    return agendamentos;
  }

  /** Chamado ao fechar a comanda: os atendimentos dela ficam concluídos. */
  async concluirDaComanda(ids: string[]) {
    if (ids.length > 0) await this.repository.concluir(this.contexto.salaoId, ids);
  }

  /** "Meus agendamentos" do cliente, em todos os salões (sem contexto de salão). */
  async meusAgendamentos(usuarioId: string): Promise<MeuAgendamento[]> {
    const agora = new Date();
    const desde = new Date(agora.getTime() - 90 * 24 * 60 * 60_000);
    const lista = await this.repository.doUsuario(usuarioId, desde);
    return lista.map((a) => ({
      id: a.id,
      inicio: a.inicio.toISOString(),
      fim: a.fim.toISOString(),
      status: a.status,
      precoCentavos: a.precoCentavos,
      salao: a.salao,
      servico: a.servico,
      profissional: a.profissional,
      podeCancelar: clientePodeCancelar(a.status, a.inicio, agora),
    }));
  }

  /** Cancelamento pelo cliente: só o próprio agendamento, em aberto e dentro do prazo. */
  async cancelarPeloCliente(usuarioId: string, id: string) {
    const agendamento = await this.repository.buscarDoUsuario(usuarioId, id);
    if (!agendamento) throw new NaoEncontradoError('Agendamento');
    if (!clientePodeCancelar(agendamento.status, agendamento.inicio, new Date())) {
      throw new RegraDeNegocioError(
        'PRAZO_CANCELAMENTO',
        `O cancelamento pelo app é possível até ${PRAZO_CANCELAMENTO_CLIENTE_MIN / 60} horas antes. Fale com o salão.`,
      );
    }
    await this.repository.atualizarStatus(agendamento.salaoId, id, 'CANCELADO');
  }

  /** Agenda do dia do profissional logado (app do profissional). */
  async agendaDoProfissional(usuarioId: string, data: string): Promise<AgendaDia> {
    const profissional = await this.profissionais.doUsuario(usuarioId);
    const agenda = await this.agendaDoDia(data);
    const naAgenda = agenda.profissionais.find((p) => p.id === profissional.id);

    return {
      ...agenda,
      profissionais: [naAgenda ?? { ...profissional, jornada: [] }],
      agendamentos: agenda.agendamentos.filter((a) => a.profissionalId === profissional.id),
      bloqueios: agenda.bloqueios.filter((b) => b.profissionalId === profissional.id),
    };
  }

  async remarcar(id: string, dados: RemarcarAgendamentoInput) {
    const atual = await this.buscar(id);
    if (!podeRemarcar(atual.status)) {
      throw new RegraDeNegocioError(
        'NAO_REMARCAVEL',
        'Só é possível remarcar agendamentos em aberto.',
      );
    }

    const profissionalId = dados.profissionalId ?? atual.profissionalId;
    let duracaoMin = (atual.fim.getTime() - atual.inicio.getTime()) / 60_000;
    let precoCentavos = atual.precoCentavos;
    if (profissionalId !== atual.profissionalId) {
      // Outro profissional: vale o preço/duração dele para este serviço.
      const opcoes = await this.servicos.opcoesDeAgendamento(atual.servicoId, profissionalId);
      ({ duracaoMin, precoCentavos } = opcoes.profissionais[0]);
    }

    const periodo = this.periodo(dados.inicio, duracaoMin);
    await this.validarHorario(profissionalId, dados.inicio, periodo, dados.encaixe, id);

    const remarcado = await this.repository.remarcarSemConflito(this.contexto.salaoId, id, {
      profissionalId,
      ...periodo,
      precoCentavos,
    });
    if (!remarcado) throw this.horarioOcupado();
    return remarcado;
  }

  async alterarStatus(id: string, { status }: AlterarStatusAgendamentoInput) {
    const atual = await this.buscar(id);
    if (!podeMudarStatus(atual.status, status)) {
      throw new RegraDeNegocioError(
        'TRANSICAO_INVALIDA',
        `Não é possível mudar um agendamento ${atual.status.toLowerCase()} para ${status.toLowerCase()}.`,
      );
    }
    return this.repository.atualizarStatus(this.contexto.salaoId, id, status);
  }

  private async buscar(id: string) {
    const agendamento = await this.repository.buscar(this.contexto.salaoId, id);
    if (!agendamento) throw new NaoEncontradoError('Agendamento');
    return agendamento;
  }

  private periodo(inicioLocal: string, duracaoMin: number): Periodo {
    const inicio = localParaUtc(inicioLocal, this.contexto.fusoHorario);
    return { inicio, fim: new Date(inicio.getTime() + duracaoMin * 60_000) };
  }

  /** Recusa conflito sempre; folga e fora da jornada só se não for encaixe. */
  private async validarHorario(
    profissionalId: string,
    inicioLocal: string,
    periodo: Periodo,
    encaixe: boolean,
    ignorarId?: string,
  ) {
    const data = inicioLocal.slice(0, 10);
    const [profissionais, agendamentos] = await Promise.all([
      this.profissionais.dadosDeAgenda(periodo.inicio, periodo.fim, [profissionalId]),
      this.repository.ocupacoes(
        this.contexto.salaoId,
        [profissionalId],
        periodo.inicio,
        periodo.fim,
        ignorarId,
      ),
    ]);
    const profissional = profissionais[0];
    if (!profissional) throw new NaoEncontradoError('Profissional');

    const motivo = avaliarHorario({
      periodo,
      data,
      fuso: this.contexto.fusoHorario,
      jornada: profissional.jornada.filter((j) => j.diaSemana === diaSemanaDe(data)),
      bloqueios: profissional.bloqueios,
      agendamentos,
    });
    if (motivo === 'CONFLITO') throw this.horarioOcupado();
    if (motivo && !encaixe) throw new RegraDeNegocioError(motivo, MENSAGENS_RECUSA[motivo]);
  }

  private horarioOcupado() {
    return new ConflitoError(
      'HORARIO_OCUPADO',
      'O profissional já tem um atendimento nesse horário.',
    );
  }
}
