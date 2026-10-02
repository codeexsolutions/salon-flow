import type { ComandaDetalhe, ComandaResumo } from '@salonflow/shared';
import type { Comanda, ComandaItem, Pagamento } from '../../generated/prisma/client.js';

type ComandaCompleta = Comanda & {
  cliente: { id: string; nome: string } | null;
  itens: (ComandaItem & { profissional: { id: string; nome: string } | null })[];
  pagamentos: Pagamento[];
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
      profissional: i.profissional,
      agendamentoId: i.agendamentoId,
      valorCentavos: i.valorCentavos,
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
    })),
  };
}
