import { z } from 'zod';

export const TIPOS_MOVIMENTO_PONTOS = ['GANHO', 'RESGATE', 'AJUSTE'] as const;
export type TipoMovimentoPontos = (typeof TIPOS_MOVIMENTO_PONTOS)[number];

export const ROTULO_MOVIMENTO_PONTOS: Record<TipoMovimentoPontos, string> = {
  GANHO: 'Atendimento',
  RESGATE: 'Resgate',
  AJUSTE: 'Ajuste',
};

export const programaFidelidadeSchema = z.object({
  ativo: z.boolean(),
  /** A cada X centavos gastos = 1 ponto (ex.: 100 = 1 ponto por real). */
  centavosPorPonto: z.number().int().min(1, 'Informe quanto vale 1 ponto').max(100_000_00),
  /** Meses até vencer (null = não vence). */
  validadeMeses: z.number().int().min(1).max(60).nullable(),
  regras: z
    .string()
    .trim()
    .max(1000)
    .transform((v) => v || null)
    .nullable(),
});
export type ProgramaFidelidadeInput = z.infer<typeof programaFidelidadeSchema>;

export const premioFidelidadeSchema = z.object({
  nome: z.string().trim().min(2, 'Dê um nome ao prêmio').max(120),
  descricao: z
    .string()
    .trim()
    .max(300)
    .transform((v) => v || null)
    .nullable(),
  pontos: z.number().int().min(1, 'Quantos pontos o prêmio custa?').max(1_000_000),
  ativo: z.boolean(),
});
export type PremioFidelidadeInput = z.infer<typeof premioFidelidadeSchema>;

export const resgatarPremioSchema = z.object({ premioId: z.uuid() });
export type ResgatarPremioInput = z.infer<typeof resgatarPremioSchema>;

export const ajustePontosSchema = z.object({
  pontos: z
    .number()
    .int()
    .refine((n) => n !== 0, 'Informe os pontos (negativo para tirar)'),
  motivo: z.string().trim().min(3, 'Explique o motivo do ajuste').max(200),
});
export type AjustePontosInput = z.infer<typeof ajustePontosSchema>;

export interface ProgramaFidelidade {
  ativo: boolean;
  centavosPorPonto: number;
  validadeMeses: number | null;
  regras: string | null;
}

export interface PremioFidelidade {
  id: string;
  nome: string;
  descricao: string | null;
  pontos: number;
  ativo: boolean;
}

/** Programa do salão (null = ainda não configurado) e prêmios. */
export interface ConfigFidelidade {
  programa: ProgramaFidelidade | null;
  premios: PremioFidelidade[];
}

export interface SaldoPontos {
  saldo: number;
  /** Próximos pontos a vencer (null = nada vencendo). */
  aVencer: { pontos: number; em: string } | null;
}

export interface MovimentoPontosDto {
  id: string;
  tipo: TipoMovimentoPontos;
  pontos: number;
  descricao: string;
  data: string;
  expiraEm: string | null;
  comandaId: string | null;
  /** Quem da equipe fez o resgate/ajuste (só no painel; null no app do cliente). */
  feitoPor: string | null;
}

export interface PontosCliente extends SaldoPontos {
  programa: ProgramaFidelidade | null;
  /** Prêmios ativos do salão (podeResgatar = saldo suficiente). */
  premios: (PremioFidelidade & { podeResgatar: boolean })[];
  extrato: MovimentoPontosDto[];
}

/** App do cliente: pontos em cada salão onde tem cadastro com programa ativo. */
export interface MeusPontosSalao extends SaldoPontos {
  salao: { nome: string; slug: string };
  programa: ProgramaFidelidade;
  premios: PremioFidelidade[];
  extrato: MovimentoPontosDto[];
}

/** Pontos que um valor gera (arredonda para baixo). */
export function pontosPorValor(totalCentavos: number, centavosPorPonto: number): number {
  if (totalCentavos <= 0 || centavosPorPonto <= 0) return 0;
  return Math.floor(totalCentavos / centavosPorPonto);
}
