/**
 * Regras do lançamento atrasado (comanda com data anterior) e da reabertura.
 * Funções puras: sem Nest/Prisma.
 */

/** Quantos dias para trás o dono pode lançar ou reabrir. */
export const LIMITE_DIAS_RETROATIVOS = 30;

/** Diferença em dias entre duas datas locais "AAAA-MM-DD" (b − a). */
export function diasEntre(a: string, b: string): number {
  const utc = (d: string) => {
    const [ano, mes, dia] = d.split('-').map(Number);
    return Date.UTC(ano, mes - 1, dia);
  };
  return Math.round((utc(b) - utc(a)) / 86_400_000);
}

/** Mensagem de erro, ou null se a data do atendimento é permitida. */
export function validarDataAtendimento(data: string, hoje: string): string | null {
  const dias = diasEntre(data, hoje);
  if (dias < 0) return 'A data do atendimento não pode ser no futuro.';
  if (dias > LIMITE_DIAS_RETROATIVOS) {
    return `Só é possível lançar até ${LIMITE_DIAS_RETROATIVOS} dias para trás.`;
  }
  return null;
}

export interface CaixaDoDia {
  id: string;
  status: 'ABERTO' | 'FECHADO';
  lancadoDepois: boolean;
}

export type PlanoCaixa =
  /** Pagamentos entram neste caixa (se fechado, a conferência é recalculada). */
  | { tipo: 'USAR'; caixaId: string; fechado: boolean; exigeConfirmacao: boolean }
  /** Dia sem caixa: cria um caixa "lançado depois" para aquela data. */
  | { tipo: 'CRIAR' }
  /** Hoje, sem caixa aberto: pagamentos ficam sem caixa (como sempre foi). */
  | { tipo: 'NENHUM' };

/**
 * Em qual caixa entram os pagamentos de uma comanda.
 * - Sem data anterior: o caixa aberto agora (ou nenhum).
 * - Com data: o caixa daquele dia. Fechado pede confirmação (exceto o "lançado
 *   depois", criado pelo próprio sistema). Dia passado sem caixa: cria um.
 */
export function planoDeCaixa(p: {
  /** Data local do atendimento; null = comanda normal (agora). */
  dataAtendimento: string | null;
  hoje: string;
  caixaAbertoAgora: string | null;
  caixaDoDia: CaixaDoDia | null;
}): PlanoCaixa {
  const usar = (caixaId: string): PlanoCaixa => ({
    tipo: 'USAR',
    caixaId,
    fechado: false,
    exigeConfirmacao: false,
  });
  if (p.dataAtendimento === null) {
    return p.caixaAbertoAgora ? usar(p.caixaAbertoAgora) : { tipo: 'NENHUM' };
  }
  const ehHoje = p.dataAtendimento === p.hoje;
  if (ehHoje && p.caixaAbertoAgora) return usar(p.caixaAbertoAgora);
  if (p.caixaDoDia) {
    if (p.caixaDoDia.status === 'ABERTO') return usar(p.caixaDoDia.id);
    return {
      tipo: 'USAR',
      caixaId: p.caixaDoDia.id,
      fechado: true,
      exigeConfirmacao: !p.caixaDoDia.lancadoDepois,
    };
  }
  return ehHoje ? { tipo: 'NENHUM' } : { tipo: 'CRIAR' };
}

/**
 * Recalcula a conferência de um caixa FECHADO quando entra (+) ou sai (−) dinheiro
 * depois do fechamento. No caixa "lançado depois" não houve contagem: o contado
 * acompanha o esperado (diferença zero).
 */
export function ajustarConferencia(
  caixa: { esperadoCentavos: number; contadoCentavos: number; lancadoDepois: boolean },
  deltaDinheiroCentavos: number,
) {
  const esperado = caixa.esperadoCentavos + deltaDinheiroCentavos;
  const contado = caixa.lancadoDepois
    ? caixa.contadoCentavos + deltaDinheiroCentavos
    : caixa.contadoCentavos;
  return {
    esperadoDinheiroCentavos: esperado,
    contadoDinheiroCentavos: contado,
    diferencaCentavos: contado - esperado,
  };
}
