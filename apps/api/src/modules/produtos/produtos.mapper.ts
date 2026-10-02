import type { MovimentoEstoqueDto, ProdutoResumo } from '@salonflow/shared';
import type { MovimentoEstoque, Produto } from '../../generated/prisma/client.js';
import { estoqueBaixo } from './domain/custo.js';

export function paraProdutoResumo(p: Produto): ProdutoResumo {
  return {
    id: p.id,
    nome: p.nome,
    marca: p.marca,
    unidade: p.unidade,
    tamanhoEmbalagem: p.tamanhoEmbalagem,
    custoEmbalagemCentavos: p.custoEmbalagemCentavos,
    precoVendaCentavos: p.precoVendaCentavos,
    estoqueAtual: p.estoqueAtual,
    estoqueMinimo: p.estoqueMinimo,
    ativo: p.ativo,
    estoqueBaixo: p.ativo && estoqueBaixo(p.estoqueAtual, p.estoqueMinimo),
  };
}

export function paraMovimento(
  m: MovimentoEstoque & { comandaItem: { comanda: { numero: number } } | null },
): MovimentoEstoqueDto {
  return {
    id: m.id,
    tipo: m.tipo,
    quantidade: m.quantidade,
    observacao: m.observacao,
    criadoEm: m.criadoEm.toISOString(),
    comandaNumero: m.comandaItem?.comanda.numero ?? null,
  };
}
