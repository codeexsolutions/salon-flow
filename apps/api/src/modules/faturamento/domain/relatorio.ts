import type {
  FaturamentoDia,
  FaturamentoForma,
  FaturamentoItemRanking,
  FaturamentoProfissional,
  FormaPagamento,
  TotaisFaturamento,
} from '@salonflow/shared';
import { proximoDia, utcParaLocal } from '../../../shared/domain/data-hora.js';

/** Comanda fechada como vem do banco (só o necessário para o relatório). */
export interface ComandaFaturada {
  fechadaEm: Date;
  subtotalCentavos: number | null;
  descontoCentavos: number;
  totalCentavos: number | null;
  itens: {
    tipo: 'SERVICO' | 'PRODUTO';
    servicoId: string | null;
    produtoId: string | null;
    profissionalId: string | null;
    profissionalNome: string | null;
    descricao: string;
    quantidade: number;
    valorCentavos: number;
    comissaoCentavos: number | null;
    custoProdutosCentavos: number | null;
  }[];
  pagamentos: { forma: FormaPagamento; valorCentavos: number; taxaCentavos: number }[];
}

const DIA_MS = 24 * 3600_000;
const paraUtc = (data: string) => {
  const [a, m, d] = data.split('-').map(Number);
  return Date.UTC(a, m - 1, d);
};
const deUtc = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** Quantidade de dias do período (datas inclusivas). */
export function diasDoPeriodo(de: string, ate: string): number {
  return Math.round((paraUtc(ate) - paraUtc(de)) / DIA_MS) + 1;
}

/** Período de mesmo tamanho imediatamente antes de `de`. */
export function periodoAnterior(de: string, ate: string): { de: string; ate: string } {
  const dias = diasDoPeriodo(de, ate);
  return {
    de: deUtc(paraUtc(de) - dias * DIA_MS),
    ate: deUtc(paraUtc(de) - DIA_MS),
  };
}

export function totaisDe(comandas: ComandaFaturada[]): TotaisFaturamento {
  let bruto = 0;
  let descontos = 0;
  let cobrado = 0;
  let taxas = 0;
  let comissoes = 0;
  let custo = 0;
  for (const c of comandas) {
    const total = c.totalCentavos ?? 0;
    cobrado += total;
    descontos += c.descontoCentavos;
    bruto += c.subtotalCentavos ?? total + c.descontoCentavos;
    for (const p of c.pagamentos) taxas += p.taxaCentavos;
    for (const i of c.itens) {
      comissoes += i.comissaoCentavos ?? 0;
      custo += i.custoProdutosCentavos ?? 0;
    }
  }
  const liquido = cobrado - taxas;
  return {
    brutoCentavos: bruto,
    descontosCentavos: descontos,
    cobradoCentavos: cobrado,
    taxasCentavos: taxas,
    liquidoCentavos: liquido,
    comissoesCentavos: comissoes,
    custoProdutosCentavos: custo,
    resultadoCentavos: liquido - comissoes - custo,
    comandas: comandas.length,
    ticketMedioCentavos: comandas.length ? Math.round(cobrado / comandas.length) : 0,
  };
}

/** Um ponto por dia do período (dias sem movimento ficam com zero). */
export function porDia(
  comandas: ComandaFaturada[],
  de: string,
  ate: string,
  fuso: string,
): FaturamentoDia[] {
  const dias = new Map<string, FaturamentoDia>();
  for (let d = de; d <= ate; d = proximoDia(d)) {
    dias.set(d, { data: d, cobradoCentavos: 0, comandas: 0 });
  }
  for (const c of comandas) {
    const dia = dias.get(utcParaLocal(c.fechadaEm, fuso).slice(0, 10));
    if (!dia) continue;
    dia.cobradoCentavos += c.totalCentavos ?? 0;
    dia.comandas += 1;
  }
  return [...dias.values()];
}

export function porForma(comandas: ComandaFaturada[]): FaturamentoForma[] {
  const formas = new Map<FormaPagamento, FaturamentoForma>();
  for (const c of comandas) {
    for (const p of c.pagamentos) {
      const f = formas.get(p.forma) ?? { forma: p.forma, valorCentavos: 0, taxasCentavos: 0 };
      f.valorCentavos += p.valorCentavos;
      f.taxasCentavos += p.taxaCentavos;
      formas.set(p.forma, f);
    }
  }
  return [...formas.values()].sort((a, b) => b.valorCentavos - a.valorCentavos);
}

export function porProfissional(comandas: ComandaFaturada[]): FaturamentoProfissional[] {
  const grupos = new Map<string, FaturamentoProfissional>();
  for (const c of comandas) {
    for (const i of c.itens) {
      if (i.tipo !== 'SERVICO' || !i.profissionalId) continue;
      const g = grupos.get(i.profissionalId) ?? {
        profissionalId: i.profissionalId,
        nome: i.profissionalNome ?? 'Profissional',
        servicos: 0,
        valorCentavos: 0,
        comissaoCentavos: 0,
      };
      g.servicos += 1;
      g.valorCentavos += i.valorCentavos;
      g.comissaoCentavos += i.comissaoCentavos ?? 0;
      grupos.set(i.profissionalId, g);
    }
  }
  return [...grupos.values()].sort((a, b) => b.valorCentavos - a.valorCentavos);
}

/** Serviços ou produtos que mais faturaram (até `limite`). */
export function ranking(
  comandas: ComandaFaturada[],
  tipo: 'SERVICO' | 'PRODUTO',
  limite = 10,
): FaturamentoItemRanking[] {
  const grupos = new Map<string, FaturamentoItemRanking>();
  for (const c of comandas) {
    for (const i of c.itens) {
      if (i.tipo !== tipo) continue;
      const id = (tipo === 'SERVICO' ? i.servicoId : i.produtoId) ?? i.descricao;
      const g = grupos.get(id) ?? { id, nome: i.descricao, quantidade: 0, valorCentavos: 0 };
      g.quantidade += tipo === 'SERVICO' ? 1 : i.quantidade;
      g.valorCentavos += i.valorCentavos;
      grupos.set(id, g);
    }
  }
  return [...grupos.values()].sort((a, b) => b.valorCentavos - a.valorCentavos).slice(0, limite);
}
