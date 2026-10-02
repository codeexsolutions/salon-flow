/** Papel de um usuário dentro de um salão (um usuário pode ter papéis diferentes em salões diferentes). */
export const Papel = {
  DONO: 'DONO',
  RECEPCAO: 'RECEPCAO',
  PROFISSIONAL: 'PROFISSIONAL',
} as const;
export type Papel = (typeof Papel)[keyof typeof Papel];

export const StatusAgendamento = {
  AGENDADO: 'AGENDADO',
  CONFIRMADO: 'CONFIRMADO',
  CONCLUIDO: 'CONCLUIDO',
  CANCELADO: 'CANCELADO',
  FALTOU: 'FALTOU',
} as const;
export type StatusAgendamento = (typeof StatusAgendamento)[keyof typeof StatusAgendamento];

/** Status que ocupam o horário do profissional na agenda. */
export const STATUS_QUE_OCUPAM: StatusAgendamento[] = ['AGENDADO', 'CONFIRMADO', 'CONCLUIDO'];

export const OrigemAgendamento = {
  SALAO: 'SALAO',
  APP_CLIENTE: 'APP_CLIENTE',
} as const;
export type OrigemAgendamento = (typeof OrigemAgendamento)[keyof typeof OrigemAgendamento];
