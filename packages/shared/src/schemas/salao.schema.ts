import { z } from 'zod';

export const criarSalaoSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  slug: z
    .string()
    .trim()
    .min(3)
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use apenas letras minúsculas, números e hífens'),
  telefone: z.string().trim().max(20).optional(),
  cidade: z.string().trim().max(80).optional(),
  uf: z.string().trim().length(2).toUpperCase().optional(),
  visivelNoMarketplace: z.boolean().default(true),
});
export type CriarSalaoInput = z.infer<typeof criarSalaoSchema>;

export const atualizarSalaoSchema = criarSalaoSchema.partial();
export type AtualizarSalaoInput = z.infer<typeof atualizarSalaoSchema>;

/** Dados públicos de um salão (marketplace / página do salão). */
export interface SalaoPublico {
  id: string;
  nome: string;
  slug: string;
  cidade: string | null;
  uf: string | null;
  telefone: string | null;
  fusoHorario: string;
}
