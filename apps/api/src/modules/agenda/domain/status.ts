import type { StatusAgendamento } from '@salonflow/shared';

const TRANSICOES: Record<StatusAgendamento, StatusAgendamento[]> = {
  AGENDADO: ['CONFIRMADO', 'CONCLUIDO', 'CANCELADO', 'FALTOU'],
  CONFIRMADO: ['CONCLUIDO', 'CANCELADO', 'FALTOU'],
  CONCLUIDO: [],
  CANCELADO: [],
  FALTOU: [],
};

/** Concluído, cancelado e faltou são finais: não mudam mais. */
export function podeMudarStatus(de: StatusAgendamento, para: StatusAgendamento): boolean {
  return TRANSICOES[de].includes(para);
}

/** Só agendamentos ainda "em aberto" podem ser remarcados. */
export function podeRemarcar(status: StatusAgendamento): boolean {
  return status === 'AGENDADO' || status === 'CONFIRMADO';
}
