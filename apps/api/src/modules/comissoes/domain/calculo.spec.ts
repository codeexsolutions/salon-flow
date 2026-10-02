import { RegraDeNegocioError } from '../../../shared/errors/domain.error.js';
import {
  aplicarBps,
  calcularFechamento,
  percentualAplicavel,
  ratear,
  type EntradaFechamento,
} from './calculo.js';

describe('ratear', () => {
  it('divide proporcionalmente e a soma bate exatamente', () => {
    expect(ratear(1000, [1, 1, 1])).toEqual([334, 333, 333]);
    expect(ratear(1000, [5000, 3000, 2000])).toEqual([500, 300, 200]);
    const partes = ratear(997, [3333, 3333, 3334]);
    expect(partes.reduce((a, b) => a + b, 0)).toBe(997);
  });

  it('lida com zero e pesos zerados', () => {
    expect(ratear(0, [100, 200])).toEqual([0, 0]);
    expect(ratear(50, [0, 0])).toEqual([50, 0]);
    expect(ratear(10, [])).toEqual([]);
  });
});

describe('aplicarBps', () => {
  it('calcula percentual em pontos-base com arredondamento ao centavo', () => {
    expect(aplicarBps(10000, 5000)).toBe(5000);
    expect(aplicarBps(4590, 3750)).toBe(1721); // 1721,25
    expect(aplicarBps(999, 299)).toBe(30); // 29,87
  });
});

describe('percentualAplicavel', () => {
  const regras = [
    { profissionalId: 'ana', servicoId: 'corte', percentualBps: 6000 },
    { profissionalId: null, servicoId: 'quimica', percentualBps: 4000 },
    { profissionalId: 'bia', servicoId: null, percentualBps: 5500 },
  ];

  it('segue a prioridade profissional+serviço > serviço > profissional > padrão', () => {
    expect(percentualAplicavel(regras, 'ana', 'corte', 5000)).toBe(6000);
    expect(percentualAplicavel(regras, 'ana', 'quimica', 5000)).toBe(4000);
    expect(percentualAplicavel(regras, 'bia', 'quimica', 5000)).toBe(4000);
    expect(percentualAplicavel(regras, 'bia', 'corte', 5000)).toBe(5500);
    expect(percentualAplicavel(regras, 'caio', 'corte', 5000)).toBe(5000);
  });
});

describe('calcularFechamento', () => {
  const base: EntradaFechamento = {
    itens: [
      {
        id: 'i1',
        profissionalId: 'ana',
        servicoId: 'corte',
        valorCentavos: 6000,
        custoProdutosCentavos: 500,
      },
      {
        id: 'i2',
        profissionalId: 'bia',
        servicoId: 'escova',
        valorCentavos: 4000,
        custoProdutosCentavos: 400,
      },
    ],
    descontoCentavos: 0,
    pagamentos: [{ forma: 'PIX', valorCentavos: 10000 }],
    taxas: { CREDITO: 300 },
    regras: [],
    padraoBps: 5000,
    sobreLiquido: false,
    descontaProdutos: false,
  };

  it('fecha sem desconto nem taxa: comissão sobre o valor cheio', () => {
    const f = calcularFechamento(base);
    expect(f.subtotalCentavos).toBe(10000);
    expect(f.totalCentavos).toBe(10000);
    expect(f.itens.map((i) => i.comissaoCentavos)).toEqual([3000, 2000]);
  });

  it('rateia o desconto proporcionalmente entre os itens', () => {
    const f = calcularFechamento({
      ...base,
      descontoCentavos: 1000,
      pagamentos: [{ forma: 'PIX', valorCentavos: 9000 }],
    });
    expect(f.totalCentavos).toBe(9000);
    expect(f.itens.map((i) => i.descontoRateadoCentavos)).toEqual([600, 400]);
    expect(f.itens.map((i) => i.baseComissaoCentavos)).toEqual([5400, 3600]);
    expect(f.itens.map((i) => i.comissaoCentavos)).toEqual([2700, 1800]);
  });

  it('com "sobre o líquido", desconta a taxa do cartão rateada da base', () => {
    const f = calcularFechamento({
      ...base,
      sobreLiquido: true,
      pagamentos: [
        { forma: 'PIX', valorCentavos: 5000 },
        { forma: 'CREDITO', valorCentavos: 5000 },
      ],
    });
    expect(f.pagamentos.map((p) => p.taxaCentavos)).toEqual([0, 150]);
    expect(f.itens.map((i) => i.taxaRateadaCentavos)).toEqual([90, 60]);
    expect(f.itens.map((i) => i.baseComissaoCentavos)).toEqual([5910, 3940]);
    expect(f.itens.map((i) => i.comissaoCentavos)).toEqual([2955, 1970]);
  });

  it('sem "sobre o líquido", a taxa é registrada mas não reduz a comissão', () => {
    const f = calcularFechamento({
      ...base,
      pagamentos: [{ forma: 'CREDITO', valorCentavos: 10000 }],
    });
    expect(f.itens.map((i) => i.taxaRateadaCentavos)).toEqual([180, 120]);
    expect(f.itens.map((i) => i.comissaoCentavos)).toEqual([3000, 2000]);
  });

  it('aplica a regra de comissão de cada item', () => {
    const f = calcularFechamento({
      ...base,
      regras: [{ profissionalId: 'ana', servicoId: null, percentualBps: 7000 }],
    });
    expect(f.itens.map((i) => i.comissaoBps)).toEqual([7000, 5000]);
    expect(f.itens.map((i) => i.comissaoCentavos)).toEqual([4200, 2000]);
  });

  it('aceita cortesia (desconto de 100%) sem pagamento', () => {
    const f = calcularFechamento({ ...base, descontoCentavos: 10000, pagamentos: [] });
    expect(f.totalCentavos).toBe(0);
    expect(f.itens.every((i) => i.comissaoCentavos === 0)).toBe(true);
  });

  it('recusa pagamento diferente do total', () => {
    expect(() =>
      calcularFechamento({ ...base, pagamentos: [{ forma: 'PIX', valorCentavos: 9999 }] }),
    ).toThrow(/total/);
  });

  it('recusa comanda vazia e desconto maior que o subtotal', () => {
    expect(() => calcularFechamento({ ...base, itens: [] })).toThrow(RegraDeNegocioError);
    expect(() => calcularFechamento({ ...base, descontoCentavos: 10001 })).toThrow(/desconto/);
  });

  it('com "descontar produtos", o custo da ficha técnica sai da base', () => {
    const f = calcularFechamento({ ...base, descontaProdutos: true });
    expect(f.itens.map((i) => i.baseComissaoCentavos)).toEqual([5500, 3600]);
    expect(f.itens.map((i) => i.comissaoCentavos)).toEqual([2750, 1800]);
    expect(f.itens.map((i) => i.custoProdutosCentavos)).toEqual([500, 400]);
  });

  it('combina desconto, taxa e produtos na base', () => {
    const f = calcularFechamento({
      ...base,
      descontaProdutos: true,
      sobreLiquido: true,
      descontoCentavos: 1000,
      pagamentos: [{ forma: 'CREDITO', valorCentavos: 9000 }],
    });
    // taxa 3% de 9000 = 270 -> rateada 162/108 sobre 5400/3600
    expect(f.itens.map((i) => i.baseComissaoCentavos)).toEqual([
      5400 - 162 - 500,
      3600 - 108 - 400,
    ]);
  });

  it('venda de produto não gera comissão, mas entra no total e no rateio', () => {
    const f = calcularFechamento({
      ...base,
      itens: [
        ...base.itens,
        {
          id: 'p1',
          profissionalId: null,
          servicoId: null,
          valorCentavos: 5000,
          custoProdutosCentavos: 0,
        },
      ],
      descontoCentavos: 1500,
      pagamentos: [{ forma: 'PIX', valorCentavos: 13500 }],
    });
    expect(f.totalCentavos).toBe(13500);
    expect(f.itens.map((i) => i.descontoRateadoCentavos)).toEqual([600, 400, 500]);
    expect(f.itens[2]).toMatchObject({ comissaoBps: 0, comissaoCentavos: 0 });
  });
});
