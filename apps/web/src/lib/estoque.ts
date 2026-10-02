import { ROTULO_UNIDADE, type TipoMovimentoEstoque, type UnidadeProduto } from '@salonflow/shared';

/** 1970, 'ML' -> "1.970 ml" */
export function formatarQuantidade(quantidade: number, unidade: UnidadeProduto): string {
  return `${quantidade.toLocaleString('pt-BR')} ${ROTULO_UNIDADE[unidade]}`;
}

/** Saldo também em embalagens, quando ajuda: 1970 ml de frascos de 1000 -> "≈ 1,97 emb." */
export function emEmbalagens(quantidade: number, tamanhoEmbalagem: number): string | null {
  if (tamanhoEmbalagem <= 1) return null;
  return `≈ ${(quantidade / tamanhoEmbalagem).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} emb.`;
}

export const ROTULO_MOVIMENTO: Record<TipoMovimentoEstoque, string> = {
  ENTRADA: 'Entrada',
  AJUSTE: 'Ajuste',
  CONSUMO: 'Consumo em serviço',
  VENDA: 'Venda',
};
