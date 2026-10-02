import { RegraDeNegocioError } from '../../../shared/errors/domain.error.js';
import { normalizarJornada, paraIntervaloJornada } from './jornada.js';

describe('normalizarJornada', () => {
  it('converte para minutos e ordena por dia e horário', () => {
    const resultado = normalizarJornada([
      { diaSemana: 2, inicio: '13:00', fim: '18:00' },
      { diaSemana: 1, inicio: '09:00', fim: '12:00' },
      { diaSemana: 2, inicio: '09:00', fim: '12:00' },
    ]);
    expect(resultado).toEqual([
      { diaSemana: 1, inicioMin: 540, fimMin: 720 },
      { diaSemana: 2, inicioMin: 540, fimMin: 720 },
      { diaSemana: 2, inicioMin: 780, fimMin: 1080 },
    ]);
  });

  it('aceita intervalos encostados (fim de um = início do outro)', () => {
    expect(() =>
      normalizarJornada([
        { diaSemana: 1, inicio: '09:00', fim: '12:00' },
        { diaSemana: 1, inicio: '12:00', fim: '18:00' },
      ]),
    ).not.toThrow();
  });

  it('aceita jornada vazia (profissional sem horário fixo)', () => {
    expect(normalizarJornada([])).toEqual([]);
  });

  it('rejeita início depois do fim', () => {
    expect(() => normalizarJornada([{ diaSemana: 1, inicio: '18:00', fim: '09:00' }])).toThrow(
      RegraDeNegocioError,
    );
  });

  it('rejeita sobreposição no mesmo dia', () => {
    expect(() =>
      normalizarJornada([
        { diaSemana: 3, inicio: '09:00', fim: '13:00' },
        { diaSemana: 3, inicio: '12:00', fim: '18:00' },
      ]),
    ).toThrow(/sobrepostos/);
  });

  it('permite o mesmo horário em dias diferentes', () => {
    expect(
      normalizarJornada([
        { diaSemana: 1, inicio: '09:00', fim: '18:00' },
        { diaSemana: 2, inicio: '09:00', fim: '18:00' },
      ]),
    ).toHaveLength(2);
  });
});

describe('paraIntervaloJornada', () => {
  it('volta para HH:MM', () => {
    expect(paraIntervaloJornada({ diaSemana: 5, inicioMin: 540, fimMin: 1440 })).toEqual({
      diaSemana: 5,
      inicio: '09:00',
      fim: '24:00',
    });
  });
});
