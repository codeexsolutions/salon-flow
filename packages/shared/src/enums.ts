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
  EM_ATENDIMENTO: 'EM_ATENDIMENTO',
  CONCLUIDO: 'CONCLUIDO',
  CANCELADO: 'CANCELADO',
  FALTOU: 'FALTOU',
} as const;
export type StatusAgendamento = (typeof StatusAgendamento)[keyof typeof StatusAgendamento];
