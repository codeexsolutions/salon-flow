/** Mensagens do Supabase Auth em português, sem detalhes técnicos. */
export function traduzirErroAuth(mensagem: string): string {
  if (/invalid login credentials/i.test(mensagem)) return 'E-mail ou senha incorretos.';
  if (/already registered|already exists/i.test(mensagem)) {
    return 'Este e-mail já tem conta. Entre ou use "Esqueci minha senha".';
  }
  if (/email not confirmed/i.test(mensagem)) return 'Confirme seu e-mail pelo link que enviamos.';
  if (/rate limit|too many/i.test(mensagem)) return 'Muitas tentativas. Aguarde alguns minutos.';
  if (/password/i.test(mensagem)) return 'Senha inválida: use pelo menos 6 caracteres.';
  return 'Não foi possível concluir. Tente novamente.';
}
