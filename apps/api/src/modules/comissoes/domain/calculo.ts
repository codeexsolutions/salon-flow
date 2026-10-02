import { RegraDeNegocioError } from '../../../shared/errors/domain.error.js';

/**
 * Cálculo do fechamento da comanda e das comissões. Funções puras, em centavos
 * e pontos-base (10000 = 100%), sem arredondamentos perdidos: rateios somam exato.
 */

const CEM_POR_CENTO = 10_000;

/**
 * Divide `total` proporcionalmente aos `pesos`, em inteiros, pelo método do maior resto:
 * a soma do resultado é SEMPRE igual a `total`.
 */
export function ratear(total: number, pesos: number[]): number[] {
  if (pesos.length === 0) return [];
  const somaPesos = pesos.reduce((s, p) => s + p, 0);
  if (somaPesos === 0) return pesos.map((_, i) => (i === 0 ? total : 0));

  const exatos = pesos.map((p) => (total * p) / somaPesos);
  const partes = exatos.map(Math.floor);
  let sobra = total - partes.reduce((s, p) => s + p, 0);

  const porResto = exatos
    .map((valor, indice) => ({ indice, resto: valor - Math.floor(valor) }))
    .sort((a, b) => b.resto - a.resto || a.indice - b.indice);
  for (const { indice } of porResto) {
    if (sobra <= 0) break;
    partes[indice] += 1;
    sobra -= 1;
  }
  return partes;
}

/** Percentual de um valor em pontos-base, arredondado ao centavo. */
export function aplicarBps(valorCentavos: number, bps: number): number {
  return Math.round((valorCentavos * bps) / CEM_POR_CENTO);
}

export interface Regra {
  profissionalId: string | null;
  servicoId: string | null;
  percentualBps: number;
}

/** Prioridade: profissional+serviço > serviço > profissional > padrão do salão. */
export function percentualAplicavel(
  regras: Regra[],
  profissionalId: string,
  servicoId: string,
  padraoBps: number,
): number {
  const busca = (p: string | null, s: string | null) =>
    regras.find((r) => r.profissionalId === p && r.servicoId === s)?.percentualBps;
  return (
    busca(profissionalId, servicoId) ??
    busca(null, servicoId) ??
    busca(profissionalId, null) ??
    padraoBps
  );
}

export interface ItemParaFechar {
  id: string;
  profissionalId: string;
  servicoId: string;
  valorCentavos: number;
}

export interface PagamentoParaFechar {
  forma: string;
  valorCentavos: number;
}

export interface EntradaFechamento {
  itens: ItemParaFechar[];
  descontoCentavos: number;
  pagamentos: PagamentoParaFechar[];
  /** Taxa em bps por forma de pagamento (forma ausente = sem taxa). */
  taxas: Record<string, number>;
  regras: Regra[];
  padraoBps: number;
  /** Comissão sobre o valor líquido das taxas de pagamento. */
  sobreLiquido: boolean;
}

export interface ItemFechado {
  id: string;
  descontoRateadoCentavos: number;
  taxaRateadaCentavos: number;
  baseComissaoCentavos: number;
  comissaoBps: number;
  comissaoCentavos: number;
}

export interface Fechamento {
  subtotalCentavos: number;
  totalCentavos: number;
  pagamentos: (PagamentoParaFechar & { taxaBps: number; taxaCentavos: number })[];
  itens: ItemFechado[];
}

export function calcularFechamento(entrada: EntradaFechamento): Fechamento {
  const { itens, descontoCentavos, pagamentos } = entrada;
  if (itens.length === 0) {
    throw new RegraDeNegocioError('COMANDA_VAZIA', 'Adicione pelo menos um serviço à comanda.');
  }

  const subtotalCentavos = itens.reduce((s, i) => s + i.valorCentavos, 0);
  if (descontoCentavos < 0 || descontoCentavos > subtotalCentavos) {
    throw new RegraDeNegocioError('DESCONTO_INVALIDO', 'O desconto não pode passar do subtotal.');
  }
  const totalCentavos = subtotalCentavos - descontoCentavos;

  const pago = pagamentos.reduce((s, p) => s + p.valorCentavos, 0);
  if (pago !== totalCentavos) {
    throw new RegraDeNegocioError(
      'PAGAMENTO_DIFERENTE_DO_TOTAL',
      `Os pagamentos somam ${(pago / 100).toFixed(2)}, mas o total é ${(totalCentavos / 100).toFixed(2)}.`,
      { pagoCentavos: pago, totalCentavos },
    );
  }

  const pagamentosComTaxa = pagamentos.map((p) => {
    const taxaBps = entrada.taxas[p.forma] ?? 0;
    return { ...p, taxaBps, taxaCentavos: aplicarBps(p.valorCentavos, taxaBps) };
  });
  const taxaTotal = pagamentosComTaxa.reduce((s, p) => s + p.taxaCentavos, 0);

  const descontos = ratear(
    descontoCentavos,
    itens.map((i) => i.valorCentavos),
  );
  const liquidosDoDesconto = itens.map((i, k) => i.valorCentavos - descontos[k]);
  const taxas = ratear(taxaTotal, liquidosDoDesconto);

  return {
    subtotalCentavos,
    totalCentavos,
    pagamentos: pagamentosComTaxa,
    itens: itens.map((item, k) => {
      const base = liquidosDoDesconto[k] - (entrada.sobreLiquido ? taxas[k] : 0);
      const comissaoBps = percentualAplicavel(
        entrada.regras,
        item.profissionalId,
        item.servicoId,
        entrada.padraoBps,
      );
      return {
        id: item.id,
        descontoRateadoCentavos: descontos[k],
        taxaRateadaCentavos: taxas[k],
        baseComissaoCentavos: Math.max(0, base),
        comissaoBps,
        comissaoCentavos: aplicarBps(Math.max(0, base), comissaoBps),
      };
    }),
  };
}
