import { calcularRepasse } from './repasse.js';

const itens = [
  { valorCentavos: 6000, comissaoCentavos: 3186 },
  { valorCentavos: 5000, comissaoCentavos: 2325 },
];

describe('calcularRepasse', () => {
  it('soma serviços e comissões e calcula as cotas-parte', () => {
    expect(calcularRepasse(itens, 0)).toEqual({
      totalServicosCentavos: 11000,
      totalComissaoCentavos: 5511,
      cotaSalaoCentavos: 5489,
      descontosCentavos: 0,
      valorPagoCentavos: 5511,
    });
  });

  it('desconta vales do valor pago', () => {
    expect(calcularRepasse(itens, 1000).valorPagoCentavos).toBe(4511);
    expect(calcularRepasse(itens, 5511).valorPagoCentavos).toBe(0);
  });

  it('recusa período sem comissões e desconto maior que as comissões', () => {
    expect(() => calcularRepasse([], 0)).toThrow(/pendentes/);
    expect(() => calcularRepasse(itens, 5512)).toThrow(/vales/);
    expect(() => calcularRepasse(itens, -1)).toThrow(/vales/);
  });
});
