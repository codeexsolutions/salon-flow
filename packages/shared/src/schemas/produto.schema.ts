import { z } from 'zod';

export const UNIDADES_PRODUTO = ['UN', 'ML', 'G'] as const;
export type UnidadeProduto = (typeof UNIDADES_PRODUTO)[number];

export const ROTULO_UNIDADE: Record<UnidadeProduto, string> = { UN: 'un', ML: 'ml', G: 'g' };

const centavos = z.number().int().min(0).max(100_000_000);
const quantidade = z.number().int().min(1).max(1_000_000);

export const criarProdutoSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  marca: z.string().trim().max(60).optional(),
  unidade: z.enum(UNIDADES_PRODUTO),
  /** Quantas unidades (ml, g, un) vêm numa embalagem. */
  tamanhoEmbalagem: quantidade,
  custoEmbalagemCentavos: centavos,
  /** Preço de venda da embalagem; sem preço = só uso interno. */
  precoVendaCentavos: centavos.optional(),
  estoqueMinimo: z.number().int().min(0).max(1_000_000).optional(),
});
export type CriarProdutoInput = z.infer<typeof criarProdutoSchema>;

export const atualizarProdutoSchema = criarProdutoSchema.partial().extend({
  marca: z.string().trim().max(60).nullable().optional(),
  precoVendaCentavos: centavos.nullable().optional(),
  estoqueMinimo: z.number().int().min(0).max(1_000_000).nullable().optional(),
  ativo: z.boolean().optional(),
});
export type AtualizarProdutoInput = z.infer<typeof atualizarProdutoSchema>;

/** Entrada (compra) ou ajuste manual, na unidade de consumo do produto. */
export const movimentarEstoqueSchema = z
  .object({
    tipo: z.enum(['ENTRADA', 'AJUSTE']),
    /** Entrada: positiva. Ajuste: positivo ou negativo (perda, vencimento, contagem). */
    quantidade: z.number().int().min(-1_000_000).max(1_000_000),
    observacao: z.string().trim().max(200).optional(),
  })
  .refine((m) => m.quantidade !== 0, 'Informe uma quantidade diferente de zero')
  .refine((m) => m.tipo !== 'ENTRADA' || m.quantidade > 0, 'Entrada deve ser positiva');
export type MovimentarEstoqueInput = z.infer<typeof movimentarEstoqueSchema>;

export const definirFichaTecnicaSchema = z.object({
  itens: z
    .array(z.object({ produtoId: z.uuid(), quantidade }))
    .max(50)
    .refine(
      (l) => new Set(l.map((i) => i.produtoId)).size === l.length,
      'Produto repetido na ficha técnica',
    ),
});
export type DefinirFichaTecnicaInput = z.infer<typeof definirFichaTecnicaSchema>;

export interface ProdutoResumo {
  id: string;
  nome: string;
  marca: string | null;
  unidade: UnidadeProduto;
  tamanhoEmbalagem: number;
  custoEmbalagemCentavos: number;
  precoVendaCentavos: number | null;
  estoqueAtual: number;
  estoqueMinimo: number | null;
  ativo: boolean;
  /** Estoque abaixo (ou igual) ao mínimo definido. */
  estoqueBaixo: boolean;
}

export type TipoMovimentoEstoque = 'ENTRADA' | 'AJUSTE' | 'CONSUMO' | 'VENDA';

export interface MovimentoEstoqueDto {
  id: string;
  tipo: TipoMovimentoEstoque;
  quantidade: number;
  observacao: string | null;
  criadoEm: string;
  /** Comanda que gerou a saída (consumo/venda). */
  comandaNumero: number | null;
}

export interface ItemFichaTecnica {
  produtoId: string;
  nome: string;
  unidade: UnidadeProduto;
  quantidade: number;
  /** Custo dessa quantidade (pelo custo atual da embalagem). */
  custoCentavos: number;
}

export interface FichaTecnica {
  servicoId: string;
  itens: ItemFichaTecnica[];
  custoTotalCentavos: number;
}
