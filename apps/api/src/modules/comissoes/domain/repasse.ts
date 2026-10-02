import { RegraDeNegocioError } from '../../../shared/errors/domain.error.js';

export interface ItemDoRepasse {
  valorCentavos: number;
  comissaoCentavos: number;
}

export interface TotaisRepasse {
  totalServicosCentavos: number;
  /** Cota-parte do profissional (comissões). */
  totalComissaoCentavos: number;
  /** Cota-parte do salão (valor dos serviços menos a do profissional). */
  cotaSalaoCentavos: number;
  descontosCentavos: number;
  /** O que de fato é pago ao profissional. */
  valorPagoCentavos: number;
}

/**
 * Totais do repasse no modelo salão-parceiro. Descontos (vales, adiantamentos)
 * reduzem o valor pago, nunca abaixo de zero.
 */
export function calcularRepasse(itens: ItemDoRepasse[], descontosCentavos: number): TotaisRepasse {
  if (itens.length === 0) {
    throw new RegraDeNegocioError(
      'SEM_COMISSOES_PENDENTES',
      'Não há comissões pendentes para este profissional no período.',
    );
  }
  const totalServicosCentavos = itens.reduce((s, i) => s + i.valorCentavos, 0);
  const totalComissaoCentavos = itens.reduce((s, i) => s + i.comissaoCentavos, 0);

  if (descontosCentavos < 0 || descontosCentavos > totalComissaoCentavos) {
    throw new RegraDeNegocioError(
      'DESCONTO_INVALIDO',
      'Os descontos (vales) não podem passar do total de comissões.',
    );
  }

  return {
    totalServicosCentavos,
    totalComissaoCentavos,
    cotaSalaoCentavos: totalServicosCentavos - totalComissaoCentavos,
    descontosCentavos,
    valorPagoCentavos: totalComissaoCentavos - descontosCentavos,
  };
}
