import { z } from 'zod';

const slug = z
  .string()
  .trim()
  .min(3)
  .max(60)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use apenas letras minúsculas, números e hífens');

export const criarSalaoSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  slug,
  telefone: z.string().trim().max(20).optional(),
  cidade: z.string().trim().max(80).optional(),
  uf: z.string().trim().length(2).toUpperCase().optional(),
  visivelNoMarketplace: z.boolean().default(true),
});
export type CriarSalaoInput = z.infer<typeof criarSalaoSchema>;

/** Texto opcional: vazio vira null (limpa o campo). */
const textoOpcional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .optional();

/** Configurações do salão (só o dono). `null` limpa o campo. */
export const atualizarSalaoSchema = z.object({
  nome: z.string().trim().min(2).max(120).optional(),
  slug: slug.optional(),
  telefone: textoOpcional(20),
  cidade: textoOpcional(80),
  uf: z
    .string()
    .trim()
    .toUpperCase()
    .refine((v) => v === '' || v.length === 2, 'Use a sigla com 2 letras')
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .optional(),
  endereco: textoOpcional(160),
  bairro: textoOpcional(80),
  descricao: textoOpcional(600),
  instagram: z
    .string()
    .trim()
    .transform((v) =>
      v
        .replace(/^@/, '')
        .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
        .replace(/\/$/, ''),
    )
    .refine((v) => v === '' || /^[a-zA-Z0-9._]{1,30}$/.test(v), 'Usuário do Instagram inválido')
    .transform((v) => (v === '' ? null : v))
    .nullable()
    .optional(),
  logoUrl: z.url().max(500).nullable().optional(),
  capaUrl: z.url().max(500).nullable().optional(),
  visivelNoMarketplace: z.boolean().optional(),
});
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
  endereco: string | null;
  bairro: string | null;
  descricao: string | null;
  instagram: string | null;
  logoUrl: string | null;
  capaUrl: string | null;
}

/** Salão na busca do marketplace. */
export interface SalaoMarketplace extends SalaoPublico {
  /** Serviços disponíveis para agendamento online. */
  totalServicos: number;
}

/** Configurações completas do salão (painel do dono). */
export interface SalaoConfiguracao extends SalaoPublico {
  visivelNoMarketplace: boolean;
}

/** Bucket do Supabase Storage com as imagens dos salões (pasta = id do salão). */
export const BUCKET_IMAGENS_SALAO = 'saloes';
