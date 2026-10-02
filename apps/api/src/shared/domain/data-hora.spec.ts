import { horaParaMinutos, localParaUtc, minutosParaHora } from './data-hora.js';

describe('localParaUtc', () => {
  it('converte horário de São Paulo (UTC-3) para UTC', () => {
    expect(localParaUtc('2026-10-02T09:30', 'America/Sao_Paulo').toISOString()).toBe(
      '2026-10-02T12:30:00.000Z',
    );
  });

  it('respeita a virada de dia', () => {
    expect(localParaUtc('2026-12-31T22:00', 'America/Sao_Paulo').toISOString()).toBe(
      '2027-01-01T01:00:00.000Z',
    );
  });

  it('considera horário de verão em fusos que o adotam', () => {
    // Nova York: inverno UTC-5, verão UTC-4
    expect(localParaUtc('2026-01-15T10:00', 'America/New_York').toISOString()).toBe(
      '2026-01-15T15:00:00.000Z',
    );
    expect(localParaUtc('2026-07-15T10:00', 'America/New_York').toISOString()).toBe(
      '2026-07-15T14:00:00.000Z',
    );
  });

  it('funciona em fusos sem deslocamento e com meia hora', () => {
    expect(localParaUtc('2026-03-01T08:00', 'UTC').toISOString()).toBe('2026-03-01T08:00:00.000Z');
    expect(localParaUtc('2026-03-01T08:00', 'Asia/Kolkata').toISOString()).toBe(
      '2026-03-01T02:30:00.000Z',
    );
  });
});

describe('horaParaMinutos / minutosParaHora', () => {
  it('converte nos dois sentidos', () => {
    expect(horaParaMinutos('09:30')).toBe(570);
    expect(horaParaMinutos('24:00')).toBe(1440);
    expect(minutosParaHora(570)).toBe('09:30');
    expect(minutosParaHora(0)).toBe('00:00');
  });
});
