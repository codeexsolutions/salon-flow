import {
  BLOQUEIO_MS,
  MAX_TENTATIVAS,
  estaBloqueada,
  formatarCodigo,
  gerarCodigo,
  registrarFalha,
} from './recuperacao.js';

describe('gerarCodigo', () => {
  it('gera 8 caracteres do alfabeto sem símbolos ambíguos', () => {
    let i = 0;
    const codigo = gerarCodigo(() => i++);
    expect(codigo).toBe('ABCDEFGH');
    expect(gerarCodigo(() => 30)).toBe('99999999');
  });

  it('formata com hífen no meio', () => {
    expect(formatarCodigo('K7QF29MX')).toBe('K7QF-29MX');
  });
});

describe('tentativas de recuperação', () => {
  const agora = new Date('2026-10-03T12:00:00Z');

  it('conta as falhas abaixo do limite sem bloquear', () => {
    expect(registrarFalha({ tentativas: 0, bloqueadaAte: null }, agora)).toEqual({
      tentativas: 1,
      bloqueadaAte: null,
    });
  });

  it('bloqueia por 30 minutos ao atingir o limite e zera o contador', () => {
    const estado = registrarFalha({ tentativas: MAX_TENTATIVAS - 1, bloqueadaAte: null }, agora);
    expect(estado.tentativas).toBe(0);
    expect(estado.bloqueadaAte?.getTime()).toBe(agora.getTime() + BLOQUEIO_MS);
    expect(estaBloqueada(estado, agora)).toBe(true);
    expect(estaBloqueada(estado, new Date(agora.getTime() + BLOQUEIO_MS + 1))).toBe(false);
  });
});
