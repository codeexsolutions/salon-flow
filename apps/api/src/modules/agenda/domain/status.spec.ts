import { podeMudarStatus, podeRemarcar } from './status.js';

describe('podeMudarStatus', () => {
  it('segue o fluxo agendado -> confirmado -> concluído', () => {
    expect(podeMudarStatus('AGENDADO', 'CONFIRMADO')).toBe(true);
    expect(podeMudarStatus('CONFIRMADO', 'CONCLUIDO')).toBe(true);
    expect(podeMudarStatus('AGENDADO', 'CONCLUIDO')).toBe(true);
  });

  it('permite cancelar ou marcar falta enquanto está em aberto', () => {
    expect(podeMudarStatus('AGENDADO', 'CANCELADO')).toBe(true);
    expect(podeMudarStatus('CONFIRMADO', 'FALTOU')).toBe(true);
  });

  it('não volta atrás nem altera status finais', () => {
    expect(podeMudarStatus('CONFIRMADO', 'CONFIRMADO')).toBe(false);
    expect(podeMudarStatus('CONCLUIDO', 'CANCELADO')).toBe(false);
    expect(podeMudarStatus('CANCELADO', 'CONFIRMADO')).toBe(false);
    expect(podeMudarStatus('FALTOU', 'CONCLUIDO')).toBe(false);
  });
});

describe('podeRemarcar', () => {
  it('só remarca agendamentos em aberto', () => {
    expect(podeRemarcar('AGENDADO')).toBe(true);
    expect(podeRemarcar('CONFIRMADO')).toBe(true);
    expect(podeRemarcar('CONCLUIDO')).toBe(false);
    expect(podeRemarcar('CANCELADO')).toBe(false);
  });
});
