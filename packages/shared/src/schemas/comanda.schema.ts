import { z } from 'zod';

export const FORMAS_PAGAMENTO = ['DINHEIRO', 'PIX', 'DEBITO', 'CREDITO', 'OUTRO'] as const;
export type FormaPagamento = (typeof FORMAS_PAGAMENTO)[number];

export const ROTULO_FORMA_PAGAMENTO: Record<FormaPagamento, string> = {
  DINHEIRO: 'Dinheiro',
  PIX: 'Pix',
  DEBITO: 'Débito',
  CREDITO: 'Crédito',
  OUTRO: 'Outro',
};

export type StatusComanda = 'ABERTA' | 'FECHADA' | 'CANCELADA';

/** Crédito parcelado: até 12x. */
export const PARCELAS_MAXIMAS = 12;

const centavos = z.number().int().min(0).max(100_000_000);
const bps = z.number().int().min(0, 'Mínimo 0%').max(10_000, 'Máximo 100%');

// ---------- Configuração e regras de comissão ----------

export const configuracaoComissaoSchema = z.object({
  comissaoPadraoBps: bps,
  comissaoSobreLiquido: z.boolean(),
  /** Desconta o custo dos produtos da ficha técnica antes do percentual. */
  comissaoDescontaProdutos: z.boolean(),
  taxas: z
    .array(z.object({ forma: z.enum(FORMAS_PAGAMENTO), taxaBps: bps }))
    .max(FORMAS_PAGAMENTO.length),
});
export type ConfiguracaoComissao = z.infer<typeof configuracaoComissaoSchema>;

export const definirRegrasComissaoSchema = z.object({
  regras: z
    .array(
      z
        .object({
          profissionalId: z.uuid().nullable(),
          servicoId: z.uuid().nullable(),
          percentualBps: bps,
        })
        .refine(
          (r) => r.profissionalId || r.servicoId,
          'A regra precisa de profissional ou serviço',
        ),
    )
    .max(500)
    .refine(
      (lista) =>
        new Set(lista.map((r) => `${r.profissionalId}|${r.servicoId}`)).size === lista.length,
      'Há regras repetidas para a mesma combinação',
    ),
});
export type DefinirRegrasComissaoInput = z.infer<typeof definirRegrasComissaoSchema>;

export interface RegraComissaoDto {
  profissionalId: string | null;
  servicoId: string | null;
  percentualBps: number;
}

// ---------- Comandas ----------

export const criarComandaSchema = z.object({
  clienteId: z.uuid().optional(),
  /** Abre já com os serviços destes agendamentos. */
  agendamentoIds: z.array(z.uuid()).max(10).default([]),
});
export type CriarComandaInput = z.infer<typeof criarComandaSchema>;

export const adicionarItemComandaSchema = z.discriminatedUnion('tipo', [
  z.object({
    tipo: z.literal('SERVICO'),
    servicoId: z.uuid('Escolha o serviço'),
    profissionalId: z.uuid('Escolha o profissional'),
    /** Sem valor = preço do profissional para o serviço. */
    valorCentavos: centavos.optional(),
  }),
  z.object({
    tipo: z.literal('PRODUTO'),
    produtoId: z.uuid('Escolha o produto'),
    /** Quantas embalagens. */
    quantidade: z.number().int().min(1).max(100),
    /** Preço de UMA embalagem; sem valor = preço de venda do produto. */
    valorUnitarioCentavos: centavos.optional(),
  }),
]);
export type AdicionarItemComandaInput = z.infer<typeof adicionarItemComandaSchema>;

/** Corrige um item da comanda aberta: valor cobrado e/ou profissional (só serviço). */
export const atualizarItemComandaSchema = z
  .object({
    /** Serviço: valor cobrado. Produto: valor total da linha. */
    valorCentavos: centavos.optional(),
    profissionalId: z.uuid('Escolha o profissional').optional(),
  })
  .refine(
    (d) => d.valorCentavos !== undefined || d.profissionalId !== undefined,
    'Informe o valor ou o profissional',
  );
export type AtualizarItemComandaInput = z.infer<typeof atualizarItemComandaSchema>;

export const atualizarComandaSchema = z.object({
  descontoCentavos: centavos.optional(),
  observacoes: z.string().trim().max(500).nullable().optional(),
  clienteId: z.uuid().nullable().optional(),
});
export type AtualizarComandaInput = z.infer<typeof atualizarComandaSchema>;

/** Data do atendimento (lançamento atrasado). null = hoje. Só o dono. */
export const dataAtendimentoComandaSchema = z.object({
  data: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD')
    .nullable(),
});
export type DataAtendimentoComandaInput = z.infer<typeof dataAtendimentoComandaSchema>;

/** Reabrir comanda fechada para correção (só o dono). */
export const reabrirComandaSchema = z.object({
  motivo: z.string().trim().min(3, 'Informe o motivo da reabertura').max(300),
});
export type ReabrirComandaInput = z.infer<typeof reabrirComandaSchema>;

export const fecharComandaSchema = z.object({
  /** Confirma lançar os pagamentos num caixa (de outro dia) que já foi fechado. */
  confirmarCaixaFechado: z.boolean().optional(),
  pagamentos: z
    .array(
      z.object({
        forma: z.enum(FORMAS_PAGAMENTO),
        valorCentavos: centavos.min(1, 'Valor do pagamento deve ser maior que zero'),
        /** Cartão: maquininha usada (a taxa vem da tabela dela). */
        maquininhaId: z.uuid().optional(),
        /** Crédito: número de parcelas (1 a 12). */
        parcelas: z.number().int().min(1).max(PARCELAS_MAXIMAS).optional(),
      }),
    )
    .max(10),
});
export type FecharComandaInput = z.infer<typeof fecharComandaSchema>;

export interface ComandaResumo {
  id: string;
  numero: number;
  status: StatusComanda;
  cliente: { id: string; nome: string } | null;
  quantidadeItens: number;
  /** Subtotal menos desconto (na aberta é a previsão; na fechada, o total cobrado). */
  totalCentavos: number;
  abertaEm: string;
  /** Data do atendimento (na lançada depois/reaberta, a data em que aconteceu). */
  fechadaEm: string | null;
  /** Quando foi realmente fechada no sistema (difere de fechadaEm se lançada depois). */
  lancadaEm: string | null;
  /** Aberta com data anterior: ao fechar, vale esta data. */
  competenciaEm: string | null;
}

export interface ItemComanda {
  id: string;
  tipo: 'SERVICO' | 'PRODUTO';
  descricao: string;
  servicoId: string | null;
  produtoId: string | null;
  quantidade: number;
  /** null em venda de produto. */
  profissional: { id: string; nome: string } | null;
  agendamentoId: string | null;
  valorCentavos: number;
  /** Serviço com preço "a partir de": conferir o valor cobrado. */
  precoAPartirDe: boolean;
  /** Preenchidos quando a comanda é fechada. */
  descontoRateadoCentavos: number | null;
  taxaRateadaCentavos: number | null;
  baseComissaoCentavos: number | null;
  comissaoBps: number | null;
  comissaoCentavos: number | null;
  /** Custo dos produtos consumidos (ficha técnica), gravado ao fechar. */
  custoProdutosCentavos: number | null;
}

export interface PagamentoComanda {
  id: string;
  forma: FormaPagamento;
  valorCentavos: number;
  taxaBps: number;
  taxaCentavos: number;
  maquininha: { id: string; nome: string } | null;
  parcelas: number | null;
}

// ---------- Maquininhas (taxas por parcela) ----------

export const maquininhaSchema = z.object({
  nome: z.string().trim().min(2, 'Informe o nome da maquininha').max(60),
  taxaDebitoBps: bps,
  /** Crédito 1x ... 12x. */
  taxasCreditoBps: z.array(bps).length(PARCELAS_MAXIMAS),
  ativo: z.boolean().default(true),
});
export type MaquininhaInput = z.infer<typeof maquininhaSchema>;

export interface MaquininhaDto {
  id: string;
  nome: string;
  taxaDebitoBps: number;
  taxasCreditoBps: number[];
  ativo: boolean;
}

export interface ComandaDetalhe extends ComandaResumo {
  descontoCentavos: number;
  subtotalCentavos: number;
  observacoes: string | null;
  itens: ItemComanda[];
  pagamentos: PagamentoComanda[];
  reaberturas: { reabertaEm: string; motivo: string; totalAnteriorCentavos: number }[];
}

// ---------- Extrato de comissões ----------

export interface ItemExtrato {
  itemId: string;
  comandaNumero: number;
  fechadaEm: string;
  descricao: string;
  cliente: string | null;
  valorCentavos: number;
  baseComissaoCentavos: number;
  comissaoBps: number;
  comissaoCentavos: number;
  custoProdutosCentavos: number;
  /** Repasse em que foi pago (null = pendente). */
  repasseId: string | null;
}

export interface ExtratoProfissional {
  profissionalId: string;
  nome: string;
  quantidade: number;
  totalServicosCentavos: number;
  totalComissaoCentavos: number;
  /** Comissões do período ainda não incluídas em repasse. */
  pendenteCentavos: number;
  itens: ItemExtrato[];
}

export interface ExtratoComissoes {
  /** Período (datas locais do salão, inclusivas). */
  de: string;
  ate: string;
  profissionais: ExtratoProfissional[];
  totalServicosCentavos: number;
  totalComissaoCentavos: number;
}
