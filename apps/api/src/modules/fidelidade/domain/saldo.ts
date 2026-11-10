/** Movimento do extrato: positivo = crédito (pode vencer), negativo = débito. */
export interface MovimentoSaldo {
  pontos: number;
  data: Date;
  expiraEm: Date | null;
}

export interface ResultadoSaldo {
  saldo: number;
  /** Lote de pontos que vence primeiro (null = nada vencendo). */
  aVencer: { pontos: number; em: Date } | null;
  /** Pontos que venceram sem ser usados. */
  vencidos: number;
}

interface Lote {
  restante: number;
  expiraEm: Date | null;
}

/** Lotes que vencem antes ficam na frente; sem validade, no fim. */
const porVencimento = (a: Lote, b: Lote) =>
  (a.expiraEm?.getTime() ?? Infinity) - (b.expiraEm?.getTime() ?? Infinity);

/**
 * Saldo de pontos em `agora`. Cada crédito vira um lote com validade; cada débito
 * consome primeiro os pontos que vencem antes. Débito maior que o saldo (ex.:
 * comanda reaberta depois do resgate) vira saldo negativo, coberto pelos próximos
 * créditos.
 */
export function calcularSaldo(movimentos: MovimentoSaldo[], agora: Date): ResultadoSaldo {
  const ordem = [...movimentos].sort(
    (a, b) => a.data.getTime() - b.data.getTime() || b.pontos - a.pontos,
  );
  let lotes: Lote[] = [];
  let devendo = 0;
  let vencidos = 0;

  const vencerAte = (momento: Date) => {
    lotes = lotes.filter((l) => {
      if (l.expiraEm && l.expiraEm.getTime() <= momento.getTime()) {
        vencidos += l.restante;
        return false;
      }
      return true;
    });
  };

  for (const m of ordem) {
    vencerAte(m.data);
    if (m.pontos > 0) {
      const abate = Math.min(devendo, m.pontos);
      devendo -= abate;
      if (m.pontos > abate) lotes.push({ restante: m.pontos - abate, expiraEm: m.expiraEm });
      continue;
    }
    let falta = -m.pontos;
    lotes.sort(porVencimento);
    for (const lote of lotes) {
      if (falta === 0) break;
      const usa = Math.min(lote.restante, falta);
      lote.restante -= usa;
      falta -= usa;
    }
    lotes = lotes.filter((l) => l.restante > 0);
    devendo += falta;
  }
  vencerAte(agora);

  const saldo = lotes.reduce((s, l) => s + l.restante, 0) - devendo;
  const proximo = lotes.filter((l) => l.expiraEm).sort(porVencimento)[0];
  return {
    saldo,
    aVencer:
      proximo && saldo > 0
        ? { pontos: Math.min(proximo.restante, saldo), em: proximo.expiraEm! }
        : null,
    vencidos,
  };
}

/** Data + N meses (fim de mês ajustado: 31/01 + 1 mês = 28 ou 29/02). */
export function somarMeses(data: Date, meses: number): Date {
  const r = new Date(data);
  const dia = r.getUTCDate();
  r.setUTCDate(1);
  r.setUTCMonth(r.getUTCMonth() + meses);
  const ultimo = new Date(Date.UTC(r.getUTCFullYear(), r.getUTCMonth() + 1, 0)).getUTCDate();
  r.setUTCDate(Math.min(dia, ultimo));
  return r;
}
