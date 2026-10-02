import type { StatusAgendamento } from '@salonflow/shared';

export const ROTULO_STATUS: Record<StatusAgendamento, string> = {
  AGENDADO: 'Agendado',
  CONFIRMADO: 'Confirmado',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
  FALTOU: 'Faltou',
};

/** Aparência do bloco do atendimento na grade, conforme o status. */
export const ESTILO_STATUS: Record<StatusAgendamento, string> = {
  AGENDADO: 'bg-background',
  CONFIRMADO: 'bg-nude',
  CONCLUIDO: 'bg-sucesso-suave opacity-80',
  CANCELADO: 'bg-nude line-through opacity-50',
  FALTOU: 'bg-perigo-suave opacity-70',
};

/** Ações possíveis a partir de cada status (espelha a regra da API). */
export const ACOES_STATUS: Record<
  StatusAgendamento,
  { status: 'CONFIRMADO' | 'CONCLUIDO' | 'CANCELADO' | 'FALTOU'; rotulo: string }[]
> = {
  AGENDADO: [
    { status: 'CONFIRMADO', rotulo: 'Confirmar' },
    { status: 'CONCLUIDO', rotulo: 'Concluir' },
    { status: 'FALTOU', rotulo: 'Faltou' },
    { status: 'CANCELADO', rotulo: 'Cancelar' },
  ],
  CONFIRMADO: [
    { status: 'CONCLUIDO', rotulo: 'Concluir' },
    { status: 'FALTOU', rotulo: 'Faltou' },
    { status: 'CANCELADO', rotulo: 'Cancelar' },
  ],
  CONCLUIDO: [],
  CANCELADO: [],
  FALTOU: [],
};

/** Link de WhatsApp a partir de um telefone brasileiro digitado livremente. */
export function linkWhatsApp(telefone: string): string | null {
  const digitos = telefone.replace(/\D/g, '');
  if (digitos.length < 10) return null;
  return `https://wa.me/${digitos.length <= 11 ? `55${digitos}` : digitos}`;
}
