/** Sem 0/O, 1/I/L: fácil de ler e anotar. 31 símbolos ^ 8 ≈ 850 bilhões de códigos. */
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export const TAMANHO_CODIGO = 8;

export const MAX_TENTATIVAS = 5;
export const BLOQUEIO_MS = 30 * 60 * 1000;

/** Código novo; `aleatorio(n)` devolve um inteiro em [0, n) (crypto em produção). */
export function gerarCodigo(aleatorio: (n: number) => number): string {
  return Array.from({ length: TAMANHO_CODIGO }, () => ALFABETO[aleatorio(ALFABETO.length)]).join('');
}

/** Exibição: K7QF29MX -> K7QF-29MX. */
export function formatarCodigo(codigo: string): string {
  return `${codigo.slice(0, 4)}-${codigo.slice(4)}`;
}

export interface EstadoTentativas {
  tentativas: number;
  bloqueadaAte: Date | null;
}

export function estaBloqueada({ bloqueadaAte }: EstadoTentativas, agora: Date): boolean {
  return !!bloqueadaAte && bloqueadaAte > agora;
}

/** Depois de errar: conta a tentativa e bloqueia ao chegar no limite. */
export function registrarFalha({ tentativas }: EstadoTentativas, agora: Date): EstadoTentativas {
  const total = tentativas + 1;
  return total >= MAX_TENTATIVAS
    ? { tentativas: 0, bloqueadaAte: new Date(agora.getTime() + BLOQUEIO_MS) }
    : { tentativas: total, bloqueadaAte: null };
}
