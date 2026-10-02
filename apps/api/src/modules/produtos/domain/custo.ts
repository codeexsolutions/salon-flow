/**
 * Custos de produtos. O estoque é medido na unidade de consumo (ml, g, un) e o custo
 * vem da embalagem: frasco de 1000 ml a R$ 50,00 -> 30 ml custam R$ 1,50.
 */

export interface CustoEmbalagem {
  tamanhoEmbalagem: number;
  custoEmbalagemCentavos: number;
}

/** Custo, em centavos, de consumir `quantidade` unidades do produto. */
export function custoDeConsumo(quantidade: number, produto: CustoEmbalagem): number {
  if (produto.tamanhoEmbalagem <= 0) return 0;
  return Math.round((quantidade * produto.custoEmbalagemCentavos) / produto.tamanhoEmbalagem);
}

export interface ItemDeFicha {
  produtoId: string;
  quantidade: number;
  produto: CustoEmbalagem;
}

/** Custo total de uma ficha técnica (soma dos itens arredondados individualmente). */
export function custoDaFicha(ficha: ItemDeFicha[]): number {
  return ficha.reduce((soma, item) => soma + custoDeConsumo(item.quantidade, item.produto), 0);
}

/** Estoque no mínimo ou abaixo dele (sem mínimo definido = nunca baixo). */
export function estoqueBaixo(estoqueAtual: number, estoqueMinimo: number | null): boolean {
  return estoqueMinimo !== null && estoqueAtual <= estoqueMinimo;
}
