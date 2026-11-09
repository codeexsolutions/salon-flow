import type { FormaPagamento } from './comanda.schema.js';
import type { FormaMovimentoCaixa } from './financeiro.schema.js';

/** Totais de um período (só comandas fechadas, pela data do atendimento). */
export interface TotaisFaturamento {
  /** Soma dos itens antes do desconto. */
  brutoCentavos: number;
  descontosCentavos: number;
  /** Total cobrado dos clientes (bruto − descontos). */
  cobradoCentavos: number;
  /** Taxas das maquininhas. */
  taxasCentavos: number;
  /** Cobrado − taxas. */
  liquidoCentavos: number;
  comissoesCentavos: number;
  /** Custo dos produtos usados nos serviços (ficha técnica). */
  custoProdutosCentavos: number;
  /** Líquido − comissões − custo de produtos: o que fica para o salão. */
  resultadoCentavos: number;
  comandas: number;
  /** Cobrado ÷ comandas (0 sem comandas). */
  ticketMedioCentavos: number;
}

export interface FaturamentoDia {
  /** AAAA-MM-DD (local do salão). */
  data: string;
  cobradoCentavos: number;
  comandas: number;
}

export interface FaturamentoForma {
  forma: FormaPagamento;
  valorCentavos: number;
  taxasCentavos: number;
}

export interface FaturamentoProfissional {
  profissionalId: string;
  nome: string;
  servicos: number;
  /** Valor dos serviços (antes do desconto da comanda). */
  valorCentavos: number;
  comissaoCentavos: number;
}

export interface FaturamentoItemRanking {
  id: string;
  nome: string;
  quantidade: number;
  valorCentavos: number;
}

/** Entradas e saídas avulsas do caixa (fora das comandas). */
export interface MovimentosFaturamento {
  entradasCentavos: number;
  saidasCentavos: number;
  entradasPorForma: Partial<Record<FormaMovimentoCaixa, number>>;
  saidasPorForma: Partial<Record<FormaMovimentoCaixa, number>>;
  /** Resultado do salão + entradas − saídas: o que sobrou no período. */
  saldoCentavos: number;
  /** Mais recentes primeiro (até 200). */
  lista: {
    data: string;
    tipo: 'ENTRADA' | 'SAIDA';
    forma: FormaMovimentoCaixa;
    valorCentavos: number;
    motivo: string;
  }[];
}

export interface RelatorioFaturamento {
  de: string;
  ate: string;
  totais: TotaisFaturamento;
  /** Período anterior de mesmo tamanho, para comparação. */
  anterior: { de: string; ate: string; totais: TotaisFaturamento };
  porDia: FaturamentoDia[];
  porForma: FaturamentoForma[];
  porProfissional: FaturamentoProfissional[];
  servicos: FaturamentoItemRanking[];
  produtos: FaturamentoItemRanking[];
  /** API antiga não envia. */
  movimentos?: MovimentosFaturamento;
}
