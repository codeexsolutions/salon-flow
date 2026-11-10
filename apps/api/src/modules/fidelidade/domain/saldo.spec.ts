import { describe, expect, it } from 'vitest';
import { calcularSaldo, somarMeses } from './saldo.js';

const d = (s: string) => new Date(`${s}T12:00:00Z`);
const credito = (pontos: number, data: string, expira: string | null = null) => ({
  pontos,
  data: d(data),
  expiraEm: expira ? d(expira) : null,
});
const debito = (pontos: number, data: string) => ({
  pontos: -pontos,
  data: d(data),
  expiraEm: null,
});

describe('saldo de pontos', () => {
  it('sem validade: soma créditos e débitos', () => {
    const r = calcularSaldo(
      [credito(100, '2026-01-10'), debito(30, '2026-02-01')],
      d('2026-11-10'),
    );
    expect(r).toEqual({ saldo: 70, aVencer: null, vencidos: 0 });
  });

  it('pontos vencidos saem do saldo', () => {
    const r = calcularSaldo(
      [credito(100, '2026-01-10', '2026-07-10'), credito(50, '2026-09-01', '2027-03-01')],
      d('2026-11-10'),
    );
    expect(r.saldo).toBe(50);
    expect(r.vencidos).toBe(100);
    expect(r.aVencer).toEqual({ pontos: 50, em: d('2027-03-01') });
  });

  it('resgate usa primeiro os pontos que vencem antes', () => {
    const r = calcularSaldo(
      [
        credito(100, '2026-01-10', '2026-07-10'),
        credito(100, '2026-03-01', '2026-09-01'),
        debito(150, '2026-04-01'),
      ],
      d('2026-08-01'),
    );
    // Sobram 50 do segundo lote, que vence em 01/09.
    expect(r.saldo).toBe(50);
    expect(r.vencidos).toBe(0);
    expect(r.aVencer).toEqual({ pontos: 50, em: d('2026-09-01') });
  });

  it('débito maior que o saldo fica negativo e é coberto pelo próximo crédito', () => {
    const negativo = calcularSaldo(
      [credito(20, '2026-01-10'), debito(50, '2026-01-11')],
      d('2026-01-12'),
    );
    expect(negativo.saldo).toBe(-30);
    const coberto = calcularSaldo(
      [credito(20, '2026-01-10'), debito(50, '2026-01-11'), credito(100, '2026-02-01')],
      d('2026-02-02'),
    );
    expect(coberto.saldo).toBe(70);
  });

  it('crédito e débito no mesmo instante: crédito primeiro', () => {
    const r = calcularSaldo([debito(10, '2026-01-10'), credito(10, '2026-01-10')], d('2026-01-11'));
    expect(r.saldo).toBe(0);
  });

  it('somar meses ajusta o fim do mês', () => {
    expect(somarMeses(new Date('2026-01-31T12:00:00Z'), 1).toISOString()).toBe(
      '2026-02-28T12:00:00.000Z',
    );
    expect(somarMeses(new Date('2026-11-10T03:00:00Z'), 6).toISOString()).toBe(
      '2027-05-10T03:00:00.000Z',
    );
  });
});
