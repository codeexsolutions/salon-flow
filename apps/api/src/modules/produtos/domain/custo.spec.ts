import { custoDaFicha, custoDeConsumo, estoqueBaixo } from './custo.js';

const shampoo = { tamanhoEmbalagem: 1000, custoEmbalagemCentavos: 5000 }; // 1 L a R$ 50
const tintura = { tamanhoEmbalagem: 60, custoEmbalagemCentavos: 3290 }; // 60 g a R$ 32,90

describe('custoDeConsumo', () => {
  it('calcula proporcional à embalagem', () => {
    expect(custoDeConsumo(30, shampoo)).toBe(150);
    expect(custoDeConsumo(1000, shampoo)).toBe(5000);
    expect(custoDeConsumo(20, tintura)).toBe(1097); // 1096,67
  });

  it('arredonda ao centavo e protege contra embalagem zerada', () => {
    expect(custoDeConsumo(1, shampoo)).toBe(5);
    expect(custoDeConsumo(10, { tamanhoEmbalagem: 0, custoEmbalagemCentavos: 100 })).toBe(0);
  });
});

describe('custoDaFicha', () => {
  it('soma os itens da ficha técnica', () => {
    expect(
      custoDaFicha([
        { produtoId: 'a', quantidade: 30, produto: shampoo },
        { produtoId: 'b', quantidade: 20, produto: tintura },
      ]),
    ).toBe(150 + 1097);
    expect(custoDaFicha([])).toBe(0);
  });
});

describe('estoqueBaixo', () => {
  it('compara com o mínimo, se houver', () => {
    expect(estoqueBaixo(100, 200)).toBe(true);
    expect(estoqueBaixo(200, 200)).toBe(true);
    expect(estoqueBaixo(201, 200)).toBe(false);
    expect(estoqueBaixo(-10, null)).toBe(false);
  });
});
