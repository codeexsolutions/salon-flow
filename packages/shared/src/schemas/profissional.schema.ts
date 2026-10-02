import { z } from 'zod';

const hora = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$|^24:00$/, 'Use o formato HH:MM');

/** Data e hora locais do salão, como vem de <input type="datetime-local">. */
const dataHoraLocal = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, 'Use o formato AAAA-MM-DDTHH:MM');

export const criarProfissionalSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  email: z.email('E-mail inválido').trim().toLowerCase().optional(),
  telefone: z.string().trim().max(20).optional(),
  corAgenda: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Cor inválida')
    .optional(),
});
export type CriarProfissionalInput = z.infer<typeof criarProfissionalSchema>;

/** Na edição, `null` limpa o e-mail/telefone. */
export const atualizarProfissionalSchema = criarProfissionalSchema.partial().extend({
  email: z.email('E-mail inválido').trim().toLowerCase().nullable().optional(),
  telefone: z.string().trim().max(20).nullable().optional(),
  ativo: z.boolean().optional(),
});
export type AtualizarProfissionalInput = z.infer<typeof atualizarProfissionalSchema>;

export const intervaloJornadaSchema = z.object({
  /** 0 = domingo ... 6 = sábado */
  diaSemana: z.number().int().min(0).max(6),
  inicio: hora,
  fim: hora,
});
export type IntervaloJornada = z.infer<typeof intervaloJornadaSchema>;

export const definirJornadaSchema = z.object({
  intervalos: z.array(intervaloJornadaSchema).max(42),
});
export type DefinirJornadaInput = z.infer<typeof definirJornadaSchema>;

export const criarBloqueioSchema = z.object({
  inicio: dataHoraLocal,
  fim: dataHoraLocal,
  motivo: z.string().trim().max(120).optional(),
});
export type CriarBloqueioInput = z.infer<typeof criarBloqueioSchema>;

/**
 * Acesso do profissional ao app:
 * - ATIVO: já entrou com o e-mail cadastrado e está vinculado
 * - PENDENTE: tem e-mail, mas ainda não entrou no app
 * - SEM_ACESSO: sem e-mail cadastrado
 */
export type AcessoApp = 'ATIVO' | 'PENDENTE' | 'SEM_ACESSO';

export interface ProfissionalResumo {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  corAgenda: string;
  ativo: boolean;
  acessoApp: AcessoApp;
}

export interface ProfissionalDetalhe extends ProfissionalResumo {
  jornada: IntervaloJornada[];
}

export interface BloqueioAgenda {
  id: string;
  /** ISO 8601 (UTC) */
  inicio: string;
  /** ISO 8601 (UTC) */
  fim: string;
  motivo: string | null;
}

export const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
