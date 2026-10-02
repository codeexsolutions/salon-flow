import { Injectable } from '@nestjs/common';
import type {
  AgendaDia,
  AlterarStatusAgendamentoInput,
  CriarAgendamentoInput,
  HorariosLivresProfissional,
  HorariosLivresQuery,
  RemarcarAgendamentoInput,
} from '@salonflow/shared';
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

  /** Horários livres do serviço no dia, por profissional que o faz. */
  async horariosLivres({
    servicoId,
    data,
    profissionalId,
  }: HorariosLivresQuery): Promise<HorariosLivresProfissional[]> {
    const fuso = this.contexto.fusoHorario;
    const opcoes = await this.servicos.opcoesDeAgendamento(servicoId, profissionalId);
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
            naoAntesDe: agora,
          })
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

  async criar(dados: CriarAgendamentoInput, usuarioId: string) {
    await this.clientes.obter(dados.clienteId);
    const opcoes = await this.servicos.opcoesDeAgendamento(dados.servicoId, dados.profissionalId);
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
      origem: 'SALAO',
      criadoPorId: usuarioId,
    });
    if (!criado) throw this.horarioOcupado();
    return criado;
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
