import {
  ANTECEDENCIA_MINIMA_APP_MIN,
  JANELA_AGENDAMENTO_APP_DIAS,
  PRAZO_CANCELAMENTO_CLIENTE_MIN,
  type StatusAgendamento,
} from '@salonflow/shared';
import { podeRemarcar } from './status.js';

const MIN = 60_000;

export type RecusaApp = 'ANTECEDENCIA_MINIMA' | 'FORA_DA_JANELA';

/** O horário escolhido pelo cliente respeita antecedência mínima e janela máxima? */
export function avaliarHorarioApp(inicio: Date, agora: Date): RecusaApp | null {
  const diferencaMin = (inicio.getTime() - agora.getTime()) / MIN;
  if (diferencaMin < ANTECEDENCIA_MINIMA_APP_MIN) return 'ANTECEDENCIA_MINIMA';
  if (diferencaMin > JANELA_AGENDAMENTO_APP_DIAS * 24 * 60) return 'FORA_DA_JANELA';
  return null;
}

/** Primeiro instante que o cliente pode escolher no app. */
export function primeiroHorarioApp(agora: Date): Date {
  return new Date(agora.getTime() + ANTECEDENCIA_MINIMA_APP_MIN * MIN);
}

/** O cliente pode cancelar pelo app enquanto está em aberto e dentro do prazo. */
export function clientePodeCancelar(status: StatusAgendamento, inicio: Date, agora: Date): boolean {
  return (
    podeRemarcar(status) &&
    inicio.getTime() - agora.getTime() >= PRAZO_CANCELAMENTO_CLIENTE_MIN * MIN
  );
}
