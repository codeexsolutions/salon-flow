/**
 * Valores em dinheiro trafegam SEMPRE como inteiros em centavos.
 * Estas funções convertem para/desde o que o usuário digita e vê.
 */

const formatadorBRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/** 4590 -> "R$ 45,90" */
export function formatarPreco(centavos: number): string {
  return formatadorBRL.format(centavos / 100);
}

/** 4590 -> "45,90" (para preencher um campo de texto) */
export function centavosParaTexto(centavos: number): string {
  return (centavos / 100).toFixed(2).replace('.', ',');
}

/**
 * Texto digitado -> centavos. Aceita "45", "45,9", "45,90", "1.234,50", "R$ 45,90" e "45.90".
 * Devolve null se não for um valor válido.
 */
export function textoParaCentavos(texto: string): number | null {
  let limpo = texto.replace(/R\$|\s/g, '');
  if (!/^\d[\d.,]*$/.test(limpo)) return null;

  const virgula = limpo.lastIndexOf(',');
  if (virgula >= 0) {
    // Formato brasileiro: ponto = milhar, vírgula = decimal
    limpo = limpo.slice(0, virgula).replace(/\./g, '') + '.' + limpo.slice(virgula + 1);
  } else if (/\.\d{3}(\.|$)/.test(limpo)) {
    // "1.234" sem vírgula: ponto como separador de milhar
    limpo = limpo.replace(/\./g, '');
  }

  if (!/^\d+(\.\d{1,2})?$/.test(limpo)) return null;
  const [inteiro, decimal = ''] = limpo.split('.');
  return Number(inteiro) * 100 + Number(decimal.padEnd(2, '0'));
}

/** 90 -> "1h30", 45 -> "45 min", 120 -> "2h" */
export function formatarDuracao(minutos: number): string {
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`;
}

/** 5000 -> "50%", 3750 -> "37,5%" (pontos-base: 10000 = 100%) */
export function formatarPercentual(bps: number): string {
  return `${(bps / 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
}

/** "37,5" ou "37.5" -> 3750; null se inválido ou fora de 0–100. */
export function textoParaBps(texto: string): number | null {
  const limpo = texto.replace('%', '').trim().replace(',', '.');
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(limpo)) return null;
  const bps = Math.round(Number(limpo) * 100);
  return bps <= 10_000 ? bps : null;
}
