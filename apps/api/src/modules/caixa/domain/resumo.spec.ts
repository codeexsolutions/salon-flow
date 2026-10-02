import { resumoDoCaixa } from './resumo.js';

describe('resumoDoCaixa', () => {
  it('soma por forma de pagamento e calcula o dinheiro esperado na gaveta', () => {
    const r = resumoDoCaixa(
      10000,
      [
        { forma: 'DINHEIRO', valorCentavos: 5000 },
        { forma: 'PIX', valorCentavos: 8000 },
        { forma: 'DINHEIRO', valorCentavos: 3000 },
        { forma: 'CREDITO', valorCentavos: 12000 },
      ],
      [
        { tipo: 'SANGRIA', valorCentavos: 4000 },
        { tipo: 'REFORCO', valorCentavos: 2000 },
      ],
    );
    expect(r.totaisPorForma).toEqual({ DINHEIRO: 8000, PIX: 8000, CREDITO: 12000 });
    expect(r.totalRecebidoCentavos).toBe(28000);
    // 100 de troco + 80 em dinheiro + 20 de reforço − 40 de sangria = 160
    expect(r.esperadoDinheiroCentavos).toBe(16000);
  });

  it('caixa sem movimento: esperado é o troco', () => {
    expect(resumoDoCaixa(5000, [], []).esperadoDinheiroCentavos).toBe(5000);
  });

  it('pagamentos só em cartão/pix não mudam o dinheiro esperado', () => {
    const r = resumoDoCaixa(0, [{ forma: 'PIX', valorCentavos: 9000 }], []);
    expect(r.esperadoDinheiroCentavos).toBe(0);
    expect(r.totalRecebidoCentavos).toBe(9000);
  });
});
