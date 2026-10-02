/**
 * Variáveis públicas do front. Precisam do prefixo NEXT_PUBLIC_ e são lidas
 * de forma literal (process.env.X) para o Next conseguir embuti-las no bundle.
 */
export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333',
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  supabasePublishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
  /** Login com e-mail e senha — SÓ para desenvolvimento/testes. Nunca ativar em produção. */
  loginComSenha: process.env.NEXT_PUBLIC_LOGIN_SENHA === 'true',
};
