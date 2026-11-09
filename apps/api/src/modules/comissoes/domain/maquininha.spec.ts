import { taxaDaMaquininha } from './maquininha.js';

const stone = {
  nome: 'Stone',
  taxaDebitoBps: 140,
  taxasCreditoBps: [310, 420, 490, 560, 630, 700, 770, 840, 910, 980, 1050, 1120],
};

describe('taxaDaMaquininha', () => {
  it('débito usa a taxa única', () => {
    expect(taxaDaMaquininha(stone, 'DEBITO')).toBe(140);
  });

  it('crédito usa a taxa do número de parcelas (padrão 1x)', () => {
    expect(taxaDaMaquininha(stone, 'CREDITO')).toBe(310);
    expect(taxaDaMaquininha(stone, 'CREDITO', 3)).toBe(490);
    expect(taxaDaMaquininha(stone, 'CREDITO', 12)).toBe(1120);
  });

  it('dinheiro e pix não usam maquininha', () => {
    expect(taxaDaMaquininha(stone, 'PIX')).toBeNull();
    expect(taxaDaMaquininha(stone, 'DINHEIRO')).toBeNull();
  });

  it('recusa parcelas sem taxa na tabela', () => {
    expect(() => taxaDaMaquininha(stone, 'CREDITO', 13)).toThrow(/13x/);
  });
});
