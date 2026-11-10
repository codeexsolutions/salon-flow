import type { ComandaDetalhe, ComandaResumo } from '@salonflow/shared';
import type {
  Comanda,
  ComandaItem,
  Pagamento,
  ReaberturaComanda,
} from '../../generated/prisma/client.js';

type ComandaCompleta = Comanda & {
  cliente: { id: string; nome: string; telefone?: string | null } | null;
  itens: (ComandaItem & {
    profissional: { id: string; nome: string; contratos?: { servicoIds: string[] }[] } | null;
    servico?: { precoAPartirDe: boolean } | null;
  })[];
  pagamentos: (Pagamento & { maquininha?: { id: string; nome: string } | null })[];
  reaberturas?: ReaberturaComanda[];
};

function subtotal(c: ComandaCompleta) {
  return c.subtotalCentavos ?? c.itens.reduce((s, i) => s + i.valorCentavos, 0);
}

export function paraComandaResumo(c: ComandaCompleta): ComandaResumo {
  return {
    id: c.id,
    numero: c.numero,
    status: c.status,
    cliente: c.cliente,
    quantidadeItens: c.itens.length,
    totalCentavos: c.totalCentavos ?? Math.max(0, subtotal(c) - c.descontoCentavos),
    abertaEm: c.abertaEm.toISOString(),
    fechadaEm: c.fechadaEm?.toISOString() ?? null,
    lancadaEm: c.lancadaEm?.toISOString() ?? null,
    competenciaEm: c.competenciaEm?.toISOString() ?? null,
  };
}

export function paraComandaDetalhe(c: ComandaCompleta): ComandaDetalhe {
  return {
    ...paraComandaResumo(c),
    descontoCentavos: c.descontoCentavos,
    subtotalCentavos: subtotal(c),
    observacoes: c.observacoes,
    itens: c.itens.map((i) => ({
      id: i.id,
      tipo: i.tipo,
      descricao: i.descricao,
      servicoId: i.servicoId,
      produtoId: i.produtoId,
      quantidade: i.quantidade,
      profissional: i.profissional && { id: i.profissional.id, nome: i.profissional.nome },
      agendamentoId: i.agendamentoId,
      valorCentavos: i.valorCentavos,
      precoAPartirDe: i.servico?.precoAPartirDe ?? false,
      foraDoContrato: foraDoContrato(i),
      descontoRateadoCentavos: i.descontoRateadoCentavos,
      taxaRateadaCentavos: i.taxaRateadaCentavos,
      baseComissaoCentavos: i.baseComissaoCentavos,
      comissaoBps: i.comissaoBps,
      comissaoCentavos: i.comissaoCentavos,
      custoProdutosCentavos: i.custoProdutosCentavos,
    })),
    pagamentos: c.pagamentos.map((p) => ({
      id: p.id,
      forma: p.forma,
      valorCentavos: p.valorCentavos,
      taxaBps: p.taxaBps,
      taxaCentavos: p.taxaCentavos,
      maquininha: p.maquininha ?? null,
      parcelas: p.parcelas,
    })),
    reaberturas: (c.reaberturas ?? []).map((r) => ({
      reabertaEm: r.reabertaEm.toISOString(),
      motivo: r.motivo,
      totalAnteriorCentavos: r.totalAnteriorCentavos,
    })),
  };
}

/** Serviço que não está no contrato de parceria ativo do profissional. */
function foraDoContrato(i: {
  tipo: string;
  servicoId: string | null;
  profissional: { contratos?: { servicoIds: string[] }[] } | null;
}): boolean {
  const contrato = i.profissional?.contratos?.[0];
  return (
    !!contrato &&
    i.tipo === 'SERVICO' &&
    !!i.servicoId &&
    !contrato.servicoIds.includes(i.servicoId)
  );
}
