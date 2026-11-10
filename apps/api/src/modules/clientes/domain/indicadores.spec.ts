import { describe, expect, it } from 'vitest';
import { diasEntre, indicadoresDe, maisFrequentes, TOTAIS_VAZIOS } from './indicadores.js';

describe('indicadores do cliente', () => {
  it('cliente que nunca veio: tudo zerado', () => {
    expect(indicadoresDe(TOTAIS_VAZIOS, '2026-11-10')).toEqual({
      totalGastoCentavos: 0,
      visitas: 0,
      ticketMedioCentavos: 0,
      primeiraVisita: null,
      ultimaVisita: null,
      diasSemVir: null,
      faltas: 0,
      cancelamentos: 0,
    });
  });

  it('ticket médio e dias sem vir', () => {
    const r = indicadoresDe(
      {
        ...TOTAIS_VAZIOS,
        totalCentavos: 100_00,
        visitas: 3,
        primeiraVisita: '2026-01-05',
        ultimaVisita: '2026-10-11',
      },
      '2026-11-10',
    );
    expect(r.ticketMedioCentavos).toBe(3333);
    expect(r.diasSemVir).toBe(30);
  });

  it('dias entre datas, inclusive na virada do ano', () => {
    expect(diasEntre('2026-12-31', '2027-01-01')).toBe(1);
    expect(diasEntre('2026-11-10', '2026-11-10')).toBe(0);
  });

  it('mais frequentes: ordena por vezes e mantém o mais recente no empate', () => {
    expect(maisFrequentes(['Corte', 'Escova', null, 'Corte', 'Escova', 'Mãos'], 2)).toEqual([
      { nome: 'Corte', vezes: 2 },
      { nome: 'Escova', vezes: 2 },
    ]);
  });
});
