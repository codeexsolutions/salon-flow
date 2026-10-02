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

const centavos = z.number().int().min(0).max(100_000_000);
const bps = z.number().int().min(0, 'Mínimo 0%').max(10_000, 'Máximo 100%');

// ---------- Configuração e regras de comissão ----------

export const configuracaoComissaoSchema = z.object({
  comissaoPadraoBps: bps,
  comissaoSobreLiquido: z.boolean(),
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

export const adicionarItemComandaSchema = z.object({
  servicoId: z.uuid('Escolha o serviço'),
  profissionalId: z.uuid('Escolha o profissional'),
  /** Sem valor = preço do profissional para o serviço. */
  valorCentavos: centavos.optional(),
});
export type AdicionarItemComandaInput = z.infer<typeof adicionarItemComandaSchema>;

export const atualizarComandaSchema = z.object({
  descontoCentavos: centavos.optional(),
  observacoes: z.string().trim().max(500).nullable().optional(),
  clienteId: z.uuid().nullable().optional(),
});
export type AtualizarComandaInput = z.infer<typeof atualizarComandaSchema>;

export const fecharComandaSchema = z.object({
  pagamentos: z
    .array(
      z.object({
        forma: z.enum(FORMAS_PAGAMENTO),
        valorCentavos: centavos.min(1, 'Valor do pagamento deve ser maior que zero'),
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
  fechadaEm: string | null;
}

export interface ItemComanda {
  id: string;
  descricao: string;
  servicoId: string;
  profissional: { id: string; nome: string };
  agendamentoId: string | null;
  valorCentavos: number;
  /** Preenchidos quando a comanda é fechada. */
  descontoRateadoCentavos: number | null;
  taxaRateadaCentavos: number | null;
  baseComissaoCentavos: number | null;
  comissaoBps: number | null;
  comissaoCentavos: number | null;
}

export interface PagamentoComanda {
  id: string;
  forma: FormaPagamento;
  valorCentavos: number;
  taxaBps: number;
  taxaCentavos: number;
}

export interface ComandaDetalhe extends ComandaResumo {
  descontoCentavos: number;
  subtotalCentavos: number;
  observacoes: string | null;
  itens: ItemComanda[];
  pagamentos: PagamentoComanda[];
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
}

export interface ExtratoProfissional {
  profissionalId: string;
  nome: string;
  quantidade: number;
  totalServicosCentavos: number;
  totalComissaoCentavos: number;
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
