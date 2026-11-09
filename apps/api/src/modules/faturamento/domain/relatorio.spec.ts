import {
  diasDoPeriodo,
  periodoAnterior,
  porDia,
  porForma,
  porProfissional,
  ranking,
  totaisDe,
  type ComandaFaturada,
} from './relatorio.js';

const FUSO = 'America/Sao_Paulo';

const servico = (
  profissionalId: string,
  valor: number,
  comissao: number,
  custo = 0,
): ComandaFaturada['itens'][number] => ({
  tipo: 'SERVICO',
  servicoId: 'corte',
  produtoId: null,
  profissionalId,
  profissionalNome: profissionalId.toUpperCase(),
  descricao: 'Corte',
  quantidade: 1,
  valorCentavos: valor,
  comissaoCentavos: comissao,
  custoProdutosCentavos: custo,
});

const comandas: ComandaFaturada[] = [
  {
    // 10/11 às 22:00 em São Paulo (01:00Z do dia 11)
    fechadaEm: new Date('2026-11-11T01:00:00Z'),
    subtotalCentavos: 10000,
    descontoCentavos: 1000,
    totalCentavos: 9000,
    itens: [servico('ana', 6000, 3000, 500), servico('bia', 4000, 2000)],
    pagamentos: [
      { forma: 'CREDITO', valorCentavos: 5000, taxaCentavos: 150 },
      { forma: 'DINHEIRO', valorCentavos: 4000, taxaCentavos: 0 },
    ],
  },
  {
    fechadaEm: new Date('2026-11-12T15:00:00Z'),
    subtotalCentavos: 7000,
    descontoCentavos: 0,
    totalCentavos: 7000,
    itens: [
      servico('ana', 5000, 2500),
      {
        tipo: 'PRODUTO',
        servicoId: null,
        produtoId: 'shampoo',
        profissionalId: null,
        profissionalNome: null,
        descricao: 'Shampoo',
        quantidade: 2,
        valorCentavos: 2000,
        comissaoCentavos: null,
        custoProdutosCentavos: null,
      },
    ],
    pagamentos: [{ forma: 'PIX', valorCentavos: 7000, taxaCentavos: 0 }],
  },
];

describe('relatório de faturamento', () => {
  it('soma os totais e calcula líquido, resultado e ticket médio', () => {
    expect(totaisDe(comandas)).toEqual({
      brutoCentavos: 17000,
      descontosCentavos: 1000,
      cobradoCentavos: 16000,
      taxasCentavos: 150,
      liquidoCentavos: 15850,
      comissoesCentavos: 7500,
      custoProdutosCentavos: 500,
      resultadoCentavos: 7850,
      comandas: 2,
      ticketMedioCentavos: 8000,
    });
  });

  it('sem comandas tudo é zero', () => {
    const t = totaisDe([]);
    expect(t.ticketMedioCentavos).toBe(0);
    expect(t.resultadoCentavos).toBe(0);
  });

  it('agrupa por dia local do salão, preenchendo dias vazios', () => {
    expect(porDia(comandas, '2026-11-10', '2026-11-13', FUSO)).toEqual([
      { data: '2026-11-10', cobradoCentavos: 9000, comandas: 1 },
      { data: '2026-11-11', cobradoCentavos: 0, comandas: 0 },
      { data: '2026-11-12', cobradoCentavos: 7000, comandas: 1 },
      { data: '2026-11-13', cobradoCentavos: 0, comandas: 0 },
    ]);
  });

  it('agrupa por forma de pagamento, do maior para o menor', () => {
    expect(porForma(comandas)).toEqual([
      { forma: 'PIX', valorCentavos: 7000, taxasCentavos: 0 },
      { forma: 'CREDITO', valorCentavos: 5000, taxasCentavos: 150 },
      { forma: 'DINHEIRO', valorCentavos: 4000, taxasCentavos: 0 },
    ]);
  });

  it('agrupa por profissional', () => {
    expect(porProfissional(comandas)).toEqual([
      {
        profissionalId: 'ana',
        nome: 'ANA',
        servicos: 2,
        valorCentavos: 11000,
        comissaoCentavos: 5500,
      },
      {
        profissionalId: 'bia',
        nome: 'BIA',
        servicos: 1,
        valorCentavos: 4000,
        comissaoCentavos: 2000,
      },
    ]);
  });

  it('monta o ranking de serviços e de produtos', () => {
    expect(ranking(comandas, 'SERVICO')).toEqual([
      { id: 'corte', nome: 'Corte', quantidade: 3, valorCentavos: 15000 },
    ]);
    expect(ranking(comandas, 'PRODUTO')).toEqual([
      { id: 'shampoo', nome: 'Shampoo', quantidade: 2, valorCentavos: 2000 },
    ]);
  });

  it('calcula o período anterior de mesmo tamanho', () => {
    expect(diasDoPeriodo('2026-11-01', '2026-11-30')).toBe(30);
    expect(periodoAnterior('2026-11-01', '2026-11-30')).toEqual({
      de: '2026-10-02',
      ate: '2026-10-31',
    });
    expect(periodoAnterior('2026-11-09', '2026-11-09')).toEqual({
      de: '2026-11-08',
      ate: '2026-11-08',
    });
  });
});
