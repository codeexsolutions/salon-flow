import { describe, expect, it } from 'vitest';
import { decidirLembrete, quandoPedirAvaliacao } from './lembretes.js';

const t = (iso: string) => new Date(`${iso}:00Z`);

describe('lembrete de horário', () => {
  const base = { id: 'a', inicio: t('2026-11-15T14:00'), criadoEm: t('2026-11-01T10:00') };

  it('aguarda até faltar o tempo configurado (padrão 24 h)', () => {
    expect(decidirLembrete({ ...base, horasAntes: undefined }, t('2026-11-14T13:00'))).toBe(
      'AGUARDAR',
    );
    expect(decidirLembrete({ ...base, horasAntes: undefined }, t('2026-11-14T14:00'))).toBe(
      'ENVIAR',
    );
  });

  it('respeita as horas do salão', () => {
    expect(decidirLembrete({ ...base, horasAntes: 2 }, t('2026-11-15T11:00'))).toBe('AGUARDAR');
    expect(decidirLembrete({ ...base, horasAntes: 2 }, t('2026-11-15T12:30'))).toBe('ENVIAR');
  });

  it('dispensa: lembrete desligado, horário já passou ou marcado dentro da janela', () => {
    expect(decidirLembrete({ ...base, horasAntes: null }, t('2026-11-15T12:00'))).toBe('DISPENSAR');
    expect(decidirLembrete({ ...base, horasAntes: 24 }, t('2026-11-15T14:01'))).toBe('DISPENSAR');
    expect(
      decidirLembrete(
        { ...base, criadoEm: t('2026-11-15T09:00'), horasAntes: 24 },
        t('2026-11-15T09:05'),
      ),
    ).toBe('DISPENSAR');
  });
});

describe('pedido de avaliação', () => {
  it('padrão 2 h depois; desligado = não pede por push', () => {
    const agora = t('2026-11-10T15:00');
    expect(quandoPedirAvaliacao(undefined, agora)).toEqual(t('2026-11-10T17:00'));
    expect(quandoPedirAvaliacao(4, agora)).toEqual(t('2026-11-10T19:00'));
    expect(quandoPedirAvaliacao(null, agora)).toBeNull();
  });
});
