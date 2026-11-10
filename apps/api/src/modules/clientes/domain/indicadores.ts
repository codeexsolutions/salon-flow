import type { IndicadoresCliente } from '@salonflow/shared';

/** Totais do cliente como vêm do banco (comandas fechadas e agendamentos). */
export interface TotaisCliente {
  totalCentavos: number;
  visitas: number;
  /** Datas do atendimento já no fuso do salão (AAAA-MM-DD). */
  primeiraVisita: string | null;
  ultimaVisita: string | null;
  faltas: number;
  cancelamentos: number;
}

export const TOTAIS_VAZIOS: TotaisCliente = {
  totalCentavos: 0,
  visitas: 0,
  primeiraVisita: null,
  ultimaVisita: null,
  faltas: 0,
  cancelamentos: 0,
};

/** Dias corridos de `de` até `ate` (datas AAAA-MM-DD). */
export function diasEntre(de: string, ate: string): number {
  const utc = (d: string) => {
    const [a, m, dia] = d.split('-').map(Number);
    return Date.UTC(a, m - 1, dia);
  };
  return Math.round((utc(ate) - utc(de)) / 86_400_000);
}

export function indicadoresDe(t: TotaisCliente, hoje: string): IndicadoresCliente {
  return {
    totalGastoCentavos: t.totalCentavos,
    visitas: t.visitas,
    ticketMedioCentavos: t.visitas > 0 ? Math.round(t.totalCentavos / t.visitas) : 0,
    primeiraVisita: t.primeiraVisita,
    ultimaVisita: t.ultimaVisita,
    diasSemVir: t.ultimaVisita ? Math.max(0, diasEntre(t.ultimaVisita, hoje)) : null,
    faltas: t.faltas,
    cancelamentos: t.cancelamentos,
  };
}

/** Os nomes que mais aparecem (empate: o que apareceu primeiro, ou seja, o mais recente). */
export function maisFrequentes(
  nomes: (string | null | undefined)[],
  limite = 3,
): { nome: string; vezes: number }[] {
  const contagem = new Map<string, number>();
  for (const nome of nomes) if (nome) contagem.set(nome, (contagem.get(nome) ?? 0) + 1);
  return [...contagem.entries()]
    .map(([nome, vezes]) => ({ nome, vezes }))
    .sort((a, b) => b.vezes - a.vezes)
    .slice(0, limite);
}
