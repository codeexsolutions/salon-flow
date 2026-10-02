import { avaliarHorarioApp, clientePodeCancelar, primeiroHorarioApp } from './regras-cliente.js';

const agora = new Date('2026-10-05T12:00:00Z');
const daqui = (min: number) => new Date(agora.getTime() + min * 60_000);

describe('avaliarHorarioApp', () => {
  it('aceita horários com antecedência mínima de 30 min', () => {
    expect(avaliarHorarioApp(daqui(30), agora)).toBeNull();
    expect(avaliarHorarioApp(daqui(24 * 60), agora)).toBeNull();
  });

  it('recusa horários em cima da hora ou no passado', () => {
    expect(avaliarHorarioApp(daqui(29), agora)).toBe('ANTECEDENCIA_MINIMA');
    expect(avaliarHorarioApp(daqui(-60), agora)).toBe('ANTECEDENCIA_MINIMA');
  });

  it('recusa horários além de 60 dias', () => {
    expect(avaliarHorarioApp(daqui(60 * 24 * 60), agora)).toBeNull();
    expect(avaliarHorarioApp(daqui(60 * 24 * 60 + 1), agora)).toBe('FORA_DA_JANELA');
  });

  it('primeiro horário possível é agora + 30 min', () => {
    expect(primeiroHorarioApp(agora)).toEqual(daqui(30));
  });
});

describe('clientePodeCancelar', () => {
  it('permite até 2 horas antes', () => {
    expect(clientePodeCancelar('AGENDADO', daqui(120), agora)).toBe(true);
    expect(clientePodeCancelar('CONFIRMADO', daqui(3 * 60), agora)).toBe(true);
  });

  it('não permite com menos de 2 horas', () => {
    expect(clientePodeCancelar('AGENDADO', daqui(119), agora)).toBe(false);
  });

  it('não permite cancelar o que já terminou ou foi cancelado', () => {
    expect(clientePodeCancelar('CONCLUIDO', daqui(300), agora)).toBe(false);
    expect(clientePodeCancelar('CANCELADO', daqui(300), agora)).toBe(false);
  });
});
