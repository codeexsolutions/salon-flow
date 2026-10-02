/**
 * Mensagens do Supabase Auth em português. Só traduz casos conhecidos; os demais
 * mostram o texto original entre parênteses, para facilitar o diagnóstico.
 */
export function traduzirErroAuth(mensagem: string): string {
  if (/invalid login credentials/i.test(mensagem)) return 'E-mail ou senha incorretos.';
  if (/already registered|already exists/i.test(mensagem)) {
    return 'Este e-mail já tem conta. Entre ou use "Esqueci minha senha".';
  }
  if (/email not confirmed/i.test(mensagem)) return 'Confirme seu e-mail pelo link que enviamos.';
  if (/rate limit|too many/i.test(mensagem)) return 'Muitas tentativas. Aguarde alguns minutos.';
  if (/password should be at least|password.*(short|length)/i.test(mensagem)) {
    return 'Senha muito curta: use pelo menos 6 caracteres.';
  }
  if (/same.*password|different from the old/i.test(mensagem)) {
    return 'A nova senha precisa ser diferente da atual.';
  }
  if (/fetch|network/i.test(mensagem)) return 'Sem conexão com o servidor. Tente de novo.';
  return `Não foi possível concluir. (${mensagem})`;
}
