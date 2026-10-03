import { randomBytes, randomInt, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt) as (
  senha: string,
  sal: Buffer,
  tamanho: number,
) => Promise<Buffer>;

const TAMANHO = 32;

/** Inteiro aleatório seguro em [0, n). */
export const aleatorioSeguro = (n: number) => randomInt(n);

/** Hash de um código secreto (ex.: recuperação de senha): `scrypt$<sal>$<hash>`. */
export async function hashCodigo(codigo: string): Promise<string> {
  const sal = randomBytes(16);
  const hash = await scryptAsync(codigo, sal, TAMANHO);
  return `scrypt$${sal.toString('hex')}$${hash.toString('hex')}`;
}

/** Confere o código com o hash guardado, em tempo constante. */
export async function conferirCodigo(codigo: string, guardado: string): Promise<boolean> {
  const [algoritmo, salHex, hashHex] = guardado.split('$');
  if (algoritmo !== 'scrypt' || !salHex || !hashHex) return false;
  const esperado = Buffer.from(hashHex, 'hex');
  const obtido = await scryptAsync(codigo, Buffer.from(salHex, 'hex'), esperado.length);
  return timingSafeEqual(esperado, obtido);
}
