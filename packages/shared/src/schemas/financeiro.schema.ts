import { z } from 'zod';
import { dataLocalSchema } from './comum.schema.js';
import { FORMAS_PAGAMENTO, type FormaPagamento } from './comanda.schema.js';

const centavos = z.number().int().min(0).max(100_000_000);

// ---------- Repasse (salão-parceiro) ----------

export const gerarRepasseSchema = z
  .object({
    profissionalId: z.uuid(),
    de: dataLocalSchema,
    ate: dataLocalSchema,
    /** Vales/adiantamentos a descontar. */
    descontosCentavos: centavos.default(0),
    formaPagamento: z.enum(FORMAS_PAGAMENTO).optional(),
    observacoes: z.string().trim().max(500).optional(),
  })
  .refine((r) => r.ate >= r.de, 'A data final é antes da inicial');
export type GerarRepasseInput = z.infer<typeof gerarRepasseSchema>;

export type StatusRepasse = 'PAGO' | 'CANCELADO';

export interface RepasseResumo {
  id: string;
  profissional: { id: string; nome: string };
  de: string;
  ate: string;
  status: StatusRepasse;
  totalServicosCentavos: number;
  totalComissaoCentavos: number;
  descontosCentavos: number;
  valorPagoCentavos: number;
  formaPagamento: FormaPagamento | null;
  pagoEm: string;
}

export interface ItemRepasse {
  fechadaEm: string;
  comandaNumero: number;
  descricao: string;
  cliente: string | null;
  valorCentavos: number;
  /** Cota-parte do profissional. */
  comissaoCentavos: number;
  /** Cota-parte do salão. */
  cotaSalaoCentavos: number;
}

/** Comprovante de repasse no formato salão-parceiro (Lei 13.352/2016). */
export interface RepasseDetalhe extends RepasseResumo {
  observacoes: string | null;
  cotaSalaoCentavos: number;
  salao: { nome: string; cidade: string | null; uf: string | null; fusoHorario: string };
  itens: ItemRepasse[];
}

// ---------- Caixa ----------

export const abrirCaixaSchema = z.object({ trocoInicialCentavos: centavos });
export type AbrirCaixaInput = z.infer<typeof abrirCaixaSchema>;

export const movimentoCaixaSchema = z.object({
  tipo: z.enum(['SANGRIA', 'REFORCO']),
  valorCentavos: centavos.min(1, 'Informe o valor'),
  motivo: z.string().trim().min(2, 'Informe o motivo').max(200),
});
export type MovimentoCaixaInput = z.infer<typeof movimentoCaixaSchema>;

export const fecharCaixaSchema = z.object({
  contadoDinheiroCentavos: centavos,
  observacoes: z.string().trim().max(500).optional(),
});
export type FecharCaixaInput = z.infer<typeof fecharCaixaSchema>;

export const historicoCaixaSchema = z.object({ de: dataLocalSchema, ate: dataLocalSchema });

export type StatusCaixa = 'ABERTO' | 'FECHADO';

export interface MovimentoCaixaDto {
  id: string;
  tipo: 'SANGRIA' | 'REFORCO';
  valorCentavos: number;
  motivo: string;
  criadoEm: string;
}

export interface CaixaResumo {
  id: string;
  status: StatusCaixa;
  abertoEm: string;
  fechadoEm: string | null;
  trocoInicialCentavos: number;
  totalRecebidoCentavos: number;
  esperadoDinheiroCentavos: number;
  contadoDinheiroCentavos: number | null;
  diferencaCentavos: number | null;
}

export interface CaixaDetalhe extends CaixaResumo {
  totaisPorForma: Partial<Record<FormaPagamento, number>>;
  sangriasCentavos: number;
  reforcosCentavos: number;
  quantidadePagamentos: number;
  movimentos: MovimentoCaixaDto[];
  observacoes: string | null;
}
