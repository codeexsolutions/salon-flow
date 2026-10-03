/** Senha provisória legível (sem 0/O, 1/l), entregue pelo salão a quem ele dá acesso. */
export function gerarSenhaProvisoria() {
  const letras = 'abcdefghjkmnpqrstuvwxyz';
  const numeros = '23456789';
  const aleatorio = (s: string) => s[crypto.getRandomValues(new Uint32Array(1))[0] % s.length];
  return (
    Array.from({ length: 4 }, () => aleatorio(letras)).join('') +
    Array.from({ length: 4 }, () => aleatorio(numeros)).join('')
  );
}
