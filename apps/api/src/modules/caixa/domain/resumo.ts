/**
 * Conferência do caixa. Função pura: recebe o que entrou e saiu e diz quanto
 * deveria haver em dinheiro na gaveta.
 */

export interface PagamentoDoCaixa {
  forma: string;
  valorCentavos: number;
}

export interface MovimentoDoCaixa {
  /** SANGRIA = saída; REFORCO = entrada. */
  tipo: 'SANGRIA' | 'REFORCO';
  /** DINHEIRO, PIX, CREDITO, DEBITO, VALE. Só DINHEIRO mexe na gaveta. */
  forma: string;
  valorCentavos: number;
}

export interface ResumoCaixa {
  trocoInicialCentavos: number;
  /** Recebido por forma de pagamento (DINHEIRO, PIX, ...). */
  totaisPorForma: Record<string, number>;
  totalRecebidoCentavos: number;
  /** Saídas/entradas em dinheiro (as que mexem na gaveta). */
  sangriasCentavos: number;
  reforcosCentavos: number;
  /** Entradas e saídas avulsas por forma. */
  movimentosPorForma: Record<string, { entradasCentavos: number; saidasCentavos: number }>;
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
  const movimentosPorForma: ResumoCaixa['movimentosPorForma'] = {};
  for (const m of movimentos) {
    const linha = (movimentosPorForma[m.forma] ??= { entradasCentavos: 0, saidasCentavos: 0 });
    if (m.tipo === 'REFORCO') linha.entradasCentavos += m.valorCentavos;
    else linha.saidasCentavos += m.valorCentavos;
  }
  const soma = (tipo: MovimentoDoCaixa['tipo']) =>
    movimentos
      .filter((m) => m.tipo === tipo && m.forma === 'DINHEIRO')
      .reduce((s, m) => s + m.valorCentavos, 0);
  const sangriasCentavos = soma('SANGRIA');
  const reforcosCentavos = soma('REFORCO');

  return {
    trocoInicialCentavos,
    totaisPorForma,
    totalRecebidoCentavos: pagamentos.reduce((s, p) => s + p.valorCentavos, 0),
    sangriasCentavos,
    reforcosCentavos,
    movimentosPorForma,
    esperadoDinheiroCentavos:
      trocoInicialCentavos + (totaisPorForma.DINHEIRO ?? 0) + reforcosCentavos - sangriasCentavos,
  };
}
