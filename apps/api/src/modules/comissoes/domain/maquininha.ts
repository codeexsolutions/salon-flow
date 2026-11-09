import { RegraDeNegocioError } from '../../../shared/errors/domain.error.js';

export interface TabelaMaquininha {
  nome: string;
  taxaDebitoBps: number;
  /** Crédito: posição 0 = 1x ... posição 11 = 12x. */
  taxasCreditoBps: number[];
}

/**
 * Taxa (bps) de um pagamento no cartão pela tabela da maquininha.
 * Débito: taxa única. Crédito: taxa do número de parcelas (padrão 1x).
 * Outras formas (dinheiro, pix…) não usam maquininha: devolve null.
 */
export function taxaDaMaquininha(
  maquininha: TabelaMaquininha,
  forma: string,
  parcelas = 1,
): number | null {
  if (forma === 'DEBITO') return maquininha.taxaDebitoBps;
  if (forma !== 'CREDITO') return null;
  const taxa = maquininha.taxasCreditoBps[parcelas - 1];
  if (taxa === undefined) {
    throw new RegraDeNegocioError(
      'PARCELAS_INVALIDAS',
      `A maquininha ${maquininha.nome} não tem taxa para ${parcelas}x.`,
    );
  }
  return taxa;
}
