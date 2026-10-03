import { z } from 'zod';

/** Variáveis de ambiente da API, validadas na inicialização. A API não sobe se algo estiver faltando. */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3333),

  /** Conexão usada pela aplicação. No Supabase: pooler em modo sessão (porta 5432). */
  DATABASE_URL: z.url(),

  /** URL do projeto Supabase, usada para validar os tokens de login (JWKS). */
  SUPABASE_URL: z.url(),

  /**
   * Chave SECRETA do Supabase (sb_secret_...). Só para o salão redefinir a senha
   * da equipe. Opcional: sem ela a API sobe e só essa função fica indisponível.
   */
  SUPABASE_SECRET_KEY: z.string().min(1).optional(),

  /** Origens liberadas no CORS, separadas por vírgula. */
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform((v) =>
      v
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean),
    ),
});

export type Env = z.infer<typeof envSchema>;

export function validarEnv(config: Record<string, unknown>): Env {
  const resultado = envSchema.safeParse(config);
  if (!resultado.success) {
    throw new Error(`Variáveis de ambiente inválidas:\n${z.prettifyError(resultado.error)}`);
  }
  return resultado.data;
}
