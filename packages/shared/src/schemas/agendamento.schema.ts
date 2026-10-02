import { z } from 'zod';
import type { OrigemAgendamento, StatusAgendamento } from '../enums.js';
import type { IntervaloJornada } from './profissional.schema.js';
import { dataHoraLocalSchema, dataLocalSchema } from './comum.schema.js';

export const criarAgendamentoSchema = z.object({
  clienteId: z.uuid('Escolha o cliente'),
  servicoId: z.uuid('Escolha o serviço'),
  profissionalId: z.uuid('Escolha o profissional'),
  /** Horário local do salão. */
  inicio: dataHoraLocalSchema,
  observacoes: z.string().trim().max(500).optional(),
  /** Encaixe: permite marcar fora da jornada/folga (nunca sobre outro agendamento). */
  encaixe: z.boolean().default(false),
});
export type CriarAgendamentoInput = z.infer<typeof criarAgendamentoSchema>;

export const remarcarAgendamentoSchema = z.object({
  inicio: dataHoraLocalSchema,
  profissionalId: z.uuid().optional(),
  encaixe: z.boolean().default(false),
});
export type RemarcarAgendamentoInput = z.infer<typeof remarcarAgendamentoSchema>;

export const alterarStatusAgendamentoSchema = z.object({
  status: z.enum(['CONFIRMADO', 'CONCLUIDO', 'CANCELADO', 'FALTOU']),
});
export type AlterarStatusAgendamentoInput = z.infer<typeof alterarStatusAgendamentoSchema>;

export const horariosLivresQuerySchema = z.object({
  servicoId: z.uuid(),
  data: dataLocalSchema,
  /** Sem profissional = todos os que fazem o serviço. */
  profissionalId: z.uuid().optional(),
});
export type HorariosLivresQuery = z.infer<typeof horariosLivresQuerySchema>;

export interface AgendamentoAgenda {
  id: string;
  /** ISO 8601 (UTC) */
  inicio: string;
  fim: string;
  status: StatusAgendamento;
  origem: OrigemAgendamento;
  precoCentavos: number;
  observacoes: string | null;
  profissionalId: string;
  cliente: { id: string; nome: string; telefone: string | null };
  servico: { id: string; nome: string };
}

export interface ProfissionalNaAgenda {
  id: string;
  nome: string;
  corAgenda: string;
  /** Jornada do dia consultado (HH:MM, horário do salão). */
  jornada: Omit<IntervaloJornada, 'diaSemana'>[];
}

export interface BloqueioNaAgenda {
  id: string;
  profissionalId: string;
  inicio: string;
  fim: string;
  motivo: string | null;
}

/** Resposta de GET /agenda?data=AAAA-MM-DD */
export interface AgendaDia {
  data: string;
  fusoHorario: string;
  profissionais: ProfissionalNaAgenda[];
  agendamentos: AgendamentoAgenda[];
  bloqueios: BloqueioNaAgenda[];
}

export interface HorarioLivre {
  /** ISO 8601 (UTC) */
  inicio: string;
  /** Mesmo horário em AAAA-MM-DDTHH:MM local, pronto para enviar ao agendar. */
  inicioLocal: string;
}

export interface HorariosLivresProfissional {
  profissionalId: string;
  nome: string;
  precoCentavos: number;
  duracaoMin: number;
  horarios: HorarioLivre[];
}
