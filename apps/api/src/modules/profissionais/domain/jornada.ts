import type { IntervaloJornada } from '@salonflow/shared';
import { horaParaMinutos, minutosParaHora } from '../../../shared/domain/data-hora.js';
import { RegraDeNegocioError } from '../../../shared/errors/domain.error.js';

/** Intervalo de jornada já em minutos desde 00:00 (formato do banco). */
export interface IntervaloMin {
  diaSemana: number;
  inicioMin: number;
  fimMin: number;
}

/**
 * Valida e normaliza a jornada semanal:
 * - início antes do fim;
 * - intervalos do mesmo dia não podem se sobrepor;
 * - resultado ordenado por dia e horário.
 */
export function normalizarJornada(intervalos: IntervaloJornada[]): IntervaloMin[] {
  const emMinutos = intervalos
    .map((i) => ({
      diaSemana: i.diaSemana,
      inicioMin: horaParaMinutos(i.inicio),
      fimMin: horaParaMinutos(i.fim),
    }))
    .sort((a, b) => a.diaSemana - b.diaSemana || a.inicioMin - b.inicioMin);

  emMinutos.forEach((atual, indice) => {
    if (atual.inicioMin >= atual.fimMin) {
      throw new RegraDeNegocioError(
        'JORNADA_INVALIDA',
        `Horário inválido: ${minutosParaHora(atual.inicioMin)}–${minutosParaHora(atual.fimMin)}. O início deve ser antes do fim.`,
      );
    }
    const anterior = emMinutos[indice - 1];
    if (anterior && anterior.diaSemana === atual.diaSemana && atual.inicioMin < anterior.fimMin) {
      throw new RegraDeNegocioError(
        'JORNADA_SOBREPOSTA',
        `Há horários sobrepostos no mesmo dia (${minutosParaHora(anterior.inicioMin)}–${minutosParaHora(anterior.fimMin)} e ${minutosParaHora(atual.inicioMin)}–${minutosParaHora(atual.fimMin)}).`,
      );
    }
  });

  return emMinutos;
}

export function paraIntervaloJornada(i: IntervaloMin): IntervaloJornada {
  return {
    diaSemana: i.diaSemana,
    inicio: minutosParaHora(i.inicioMin),
    fim: minutosParaHora(i.fimMin),
  };
}
