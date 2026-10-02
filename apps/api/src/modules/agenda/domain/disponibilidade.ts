import { localParaUtc, minutosParaHora } from '../../../shared/domain/data-hora.js';

/**
 * Regras de disponibilidade da agenda. Funções puras: recebem jornada, folgas e
 * agendamentos já carregados e devolvem os horários livres / o motivo de recusa.
 */

export interface Periodo {
  inicio: Date;
  fim: Date;
}

/** Faixa de trabalho em minutos desde 00:00 (horário local do salão). */
export interface FaixaMin {
  inicioMin: number;
  fimMin: number;
}

/** Intervalos semiabertos [inicio, fim): encostar não é sobrepor. */
export function sobrepoe(a: Periodo, b: Periodo): boolean {
  return a.inicio < b.fim && b.inicio < a.fim;
}

export interface ParametrosHorariosLivres {
  /** Dia local do salão (AAAA-MM-DD). */
  data: string;
  fuso: string;
  /** Jornada do profissional NESSE dia da semana. */
  jornada: FaixaMin[];
  /** Agendamentos e folgas que já ocupam o profissional. */
  ocupados: Periodo[];
  duracaoMin: number;
  /** De quantos em quantos minutos oferecer horários (padrão 15). */
  passoMin?: number;
  /** Não oferecer horários antes deste instante (ex.: agora + antecedência mínima). */
  naoAntesDe?: Date;
}

/** Inícios possíveis (UTC) para um atendimento com a duração pedida. */
export function horariosLivres({
  data,
  fuso,
  jornada,
  ocupados,
  duracaoMin,
  passoMin = 15,
  naoAntesDe,
}: ParametrosHorariosLivres): Date[] {
  const duracaoMs = duracaoMin * 60_000;
  const livres = new Map<number, Date>();

  for (const faixa of jornada) {
    for (let min = faixa.inicioMin; min + duracaoMin <= faixa.fimMin; min += passoMin) {
      const inicio = localParaUtc(`${data}T${minutosParaHora(min)}`, fuso);
      const periodo = { inicio, fim: new Date(inicio.getTime() + duracaoMs) };

      if (naoAntesDe && inicio < naoAntesDe) continue;
      if (ocupados.some((o) => sobrepoe(periodo, o))) continue;
      livres.set(inicio.getTime(), inicio);
    }
  }

  return [...livres.values()].sort((a, b) => a.getTime() - b.getTime());
}

export type MotivoRecusa = 'CONFLITO' | 'BLOQUEADO' | 'FORA_DA_JORNADA';

export interface ParametrosAvaliacao {
  periodo: Periodo;
  /** Dia local do salão em que o atendimento começa. */
  data: string;
  fuso: string;
  jornada: FaixaMin[];
  bloqueios: Periodo[];
  agendamentos: Periodo[];
}

/**
 * Diz se o horário pode ser agendado. A ordem importa: conflito com outro
 * atendimento é sempre impeditivo; folga e jornada podem ser ignoradas num encaixe.
 */
export function avaliarHorario({
  periodo,
  data,
  fuso,
  jornada,
  bloqueios,
  agendamentos,
}: ParametrosAvaliacao): MotivoRecusa | null {
  if (agendamentos.some((a) => sobrepoe(periodo, a))) return 'CONFLITO';
  if (bloqueios.some((b) => sobrepoe(periodo, b))) return 'BLOQUEADO';

  const dentroDaJornada = jornada.some((faixa) => {
    const inicio = localParaUtc(`${data}T${minutosParaHora(faixa.inicioMin)}`, fuso);
    const fim = localParaUtc(`${data}T${minutosParaHora(faixa.fimMin)}`, fuso);
    return inicio <= periodo.inicio && periodo.fim <= fim;
  });
  return dentroDaJornada ? null : 'FORA_DA_JORNADA';
}
