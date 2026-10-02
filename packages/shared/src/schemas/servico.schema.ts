import { z } from 'zod';

const precoCentavos = z
  .number('Informe o preço')
  .int()
  .min(0, 'O preço não pode ser negativo')
  .max(10_000_000, 'Preço muito alto');

const duracaoMin = z
  .number('Informe a duração')
  .int()
  .min(5, 'Mínimo de 5 minutos')
  .max(720, 'Máximo de 12 horas')
  .multipleOf(5, 'Use múltiplos de 5 minutos');

export const criarServicoSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  descricao: z.string().trim().max(500).optional(),
  categoria: z.string().trim().max(60).optional(),
  precoCentavos,
  duracaoMin,
  visivelOnline: z.boolean().default(true),
});
export type CriarServicoInput = z.infer<typeof criarServicoSchema>;

/** Na edição, `null` limpa descrição/categoria. */
export const atualizarServicoSchema = z.object({
  nome: z.string().trim().min(2).max(120).optional(),
  descricao: z.string().trim().max(500).nullable().optional(),
  categoria: z.string().trim().max(60).nullable().optional(),
  precoCentavos: precoCentavos.optional(),
  duracaoMin: duracaoMin.optional(),
  visivelOnline: z.boolean().optional(),
  ativo: z.boolean().optional(),
});
export type AtualizarServicoInput = z.infer<typeof atualizarServicoSchema>;

export const definirProfissionaisServicoSchema = z.object({
  profissionais: z
    .array(
      z.object({
        profissionalId: z.uuid(),
        /** null = usa o preço do serviço */
        precoCentavos: precoCentavos.nullable().default(null),
        /** null = usa a duração do serviço */
        duracaoMin: duracaoMin.nullable().default(null),
      }),
    )
    .max(100)
    .refine(
      (lista) => new Set(lista.map((p) => p.profissionalId)).size === lista.length,
      'Profissional repetido na lista',
    ),
});
export type DefinirProfissionaisServicoInput = z.infer<typeof definirProfissionaisServicoSchema>;

export interface ServicoResumo {
  id: string;
  nome: string;
  descricao: string | null;
  categoria: string | null;
  precoCentavos: number;
  duracaoMin: number;
  visivelOnline: boolean;
  ativo: boolean;
  /** Quantos profissionais ATIVOS fazem o serviço. */
  totalProfissionais: number;
}

export interface ProfissionalDoServico {
  profissionalId: string;
  nome: string;
  corAgenda: string;
  ativo: boolean;
  /** Preço/duração próprios do profissional (null = usa o do serviço). */
  precoCentavos: number | null;
  duracaoMin: number | null;
}

export interface ServicoDetalhe extends ServicoResumo {
  profissionais: ProfissionalDoServico[];
}
