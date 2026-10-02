/**
 * Conferência do caixa. Função pura: recebe o que entrou e saiu e diz quanto
 * deveria haver em dinheiro na gaveta.
 */

export interface PagamentoDoCaixa {
  forma: string;
  valorCentavos: number;
}

export interface MovimentoDoCaixa {
  tipo: 'SANGRIA' | 'REFORCO';
  valorCentavos: number;
}

export interface ResumoCaixa {
  trocoInicialCentavos: number;
  /** Recebido por forma de pagamento (DINHEIRO, PIX, ...). */
  totaisPorForma: Record<string, number>;
  totalRecebidoCentavos: number;
  sangriasCentavos: number;
  reforcosCentavos: number;
  /** Troco + dinheiro recebido + reforços − sangrias. */
  esperadoDinheiroCentavos: number;
}

export function resumoDoCaixa(
  trocoInicialCentavos: number,
  pagamentos: PagamentoDoCaixa[],
  movimentos: MovimentoDoCaixa[],
): ResumoCaixa {
  const totaisPorForma: Record<string, number> = {};
  for (const p of pagamentos) {
    totaisPorForma[p.forma] = (totaisPorForma[p.forma] ?? 0) + p.valorCentavos;
  }
  const soma = (tipo: MovimentoDoCaixa['tipo']) =>
    movimentos.filter((m) => m.tipo === tipo).reduce((s, m) => s + m.valorCentavos, 0);
  const sangriasCentavos = soma('SANGRIA');
  const reforcosCentavos = soma('REFORCO');

  return {
    trocoInicialCentavos,
    totaisPorForma,
    totalRecebidoCentavos: pagamentos.reduce((s, p) => s + p.valorCentavos, 0),
    sangriasCentavos,
    reforcosCentavos,
    esperadoDinheiroCentavos:
      trocoInicialCentavos + (totaisPorForma.DINHEIRO ?? 0) + reforcosCentavos - sangriasCentavos,
  };
}
