const HORA = 3_600_000;

/** Padrão quando o salão não configurou: lembrete 24 h antes. */
export const LEMBRETE_HORAS_PADRAO = 24;
export const AVALIACAO_HORAS_PADRAO = 2;
/** O agendador olha os horários até este tanto à frente (maior opção de configuração). */
export const JANELA_LEMBRETE_HORAS = 72;
/** Pedido de avaliação que não saiu nesse prazo (ex.: push desligado) é descartado. */
export const VALIDADE_PEDIDO_AVALIACAO_HORAS = 72;

export interface AgendamentoParaLembrete {
  id: string;
  inicio: Date;
  criadoEm: Date;
  /** Configuração do salão: undefined = padrão; null = desligado. */
  horasAntes: number | null | undefined;
}

export type DecisaoLembrete = 'ENVIAR' | 'DISPENSAR' | 'AGUARDAR';

/**
 * Lembrete: sai quando faltam `horasAntes` para o horário. Horário marcado já
 * dentro dessa janela (o cliente acabou de agendar) é dispensado. Salão com
 * lembrete desligado: dispensa.
 */
export function decidirLembrete(a: AgendamentoParaLembrete, agora: Date): DecisaoLembrete {
  if (a.inicio.getTime() <= agora.getTime()) return 'DISPENSAR';
  const horas = a.horasAntes === undefined ? LEMBRETE_HORAS_PADRAO : a.horasAntes;
  if (horas === null) return 'DISPENSAR';
  const abre = a.inicio.getTime() - horas * HORA;
  if (agora.getTime() < abre) return 'AGUARDAR';
  return a.criadoEm.getTime() >= abre ? 'DISPENSAR' : 'ENVIAR';
}

/**
 * Quando pedir a avaliação de uma comanda fechada agora. null = salão não pede
 * por push (o link continua valendo para o WhatsApp).
 */
export function quandoPedirAvaliacao(
  horasDepois: number | null | undefined,
  agora: Date,
): Date | null {
  const horas = horasDepois === undefined ? AVALIACAO_HORAS_PADRAO : horasDepois;
  return horas === null ? null : new Date(agora.getTime() + horas * HORA);
}
