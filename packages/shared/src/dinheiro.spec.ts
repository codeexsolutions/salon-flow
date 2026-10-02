import { describe, expect, it } from 'vitest';
import {
  centavosParaTexto,
  formatarDuracao,
  formatarPreco,
  textoParaCentavos,
} from './dinheiro.js';

describe('textoParaCentavos', () => {
  it.each([
    ['45', 4500],
    ['45,9', 4590],
    ['45,90', 4590],
    ['45.90', 4590],
    ['0,99', 99],
    ['1.234,50', 123450],
    ['1.234', 123400],
    ['R$ 45,90', 4590],
    [' 30 ', 3000],
  ])('"%s" -> %i', (texto, esperado) => {
    expect(textoParaCentavos(texto)).toBe(esperado);
  });

  it.each(['', 'abc', '45,999', '-10', '4,5,6', ',50'])('rejeita "%s"', (texto) => {
    expect(textoParaCentavos(texto)).toBeNull();
  });
});

describe('formatação', () => {
  it('formata preço em reais', () => {
    expect(formatarPreco(4590).replace(/\s/g, ' ')).toBe('R$ 45,90');
    expect(centavosParaTexto(4590)).toBe('45,90');
    expect(centavosParaTexto(4500)).toBe('45,00');
  });

  it('formata duração', () => {
    expect(formatarDuracao(45)).toBe('45 min');
    expect(formatarDuracao(60)).toBe('1h');
    expect(formatarDuracao(90)).toBe('1h30');
    expect(formatarDuracao(125)).toBe('2h05');
  });
});
