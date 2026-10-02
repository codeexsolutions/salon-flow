import { z } from 'zod';

export const criarClienteSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  telefone: z.string().trim().max(20).optional(),
  email: z.email('E-mail inválido').trim().toLowerCase().optional(),
  observacoes: z.string().trim().max(500).optional(),
});
export type CriarClienteInput = z.infer<typeof criarClienteSchema>;

export interface ClienteResumo {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  /** Cliente tem conta no app (agenda sozinho). */
  usaApp: boolean;
}
