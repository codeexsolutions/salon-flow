import { z } from 'zod';

/**
 * Login por USUÁRIO e senha. O Supabase Auth exige e-mail, então cada usuário
 * vira um e-mail interno `usuario@salonflow.invalid` — o domínio `.invalid` é
 * reservado (RFC 2606) e nunca recebe mensagens. Ninguém vê esse e-mail.
 */
export const DOMINIO_LOGIN = 'salonflow.invalid';

export const nomeUsuarioSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, 'Use pelo menos 3 caracteres')
  .max(30, 'Use no máximo 30 caracteres')
  .regex(
    /^[a-z0-9](?:[a-z0-9._]*[a-z0-9])?$/,
    'Use só letras, números, ponto ou _ (sem espaços nem acentos)',
  );

/** E-mail interno usado no Supabase Auth para este usuário. */
export function emailDeLogin(usuario: string): string {
  return `${usuario.trim().toLowerCase()}@${DOMINIO_LOGIN}`;
}

/** Usuário a partir do e-mail interno (contas antigas com e-mail real ficam como estão). */
export function usuarioDeLogin(email: string): string {
  const sufixo = `@${DOMINIO_LOGIN}`;
  return email.endsWith(sufixo) ? email.slice(0, -sufixo.length) : email;
}

/** Senha nova definida pelo salão para alguém da equipe que esqueceu a dele. */
export const redefinirSenhaSchema = z.object({
  senha: z.string().min(6, 'Mínimo de 6 caracteres').max(72),
});
export type RedefinirSenhaInput = z.infer<typeof redefinirSenhaSchema>;

/** Celular com DDD; guardado só com dígitos. */
export const telefoneSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ''))
  .pipe(z.string().min(10, 'Informe o celular com DDD').max(13, 'Celular inválido'));

/** Código de recuperação: 8 caracteres (aceita com ou sem hífen, maiúsculas ou não). */
export const codigoRecuperacaoSchema = z
  .string()
  .transform((v) => v.replace(/[\s-]/g, '').toUpperCase())
  .pipe(z.string().length(8, 'O código tem 8 caracteres'));

/** Gera um novo código para a conta logada (no cadastro ou em Conta > Senha). */
export const definirRecuperacaoSchema = z.object({ telefone: telefoneSchema });
export type DefinirRecuperacaoInput = z.infer<typeof definirRecuperacaoSchema>;

/** "Esqueci minha senha": usuário + celular + código provam que a conta é sua. */
export const recuperarSenhaSchema = z.object({
  usuario: nomeUsuarioSchema,
  telefone: telefoneSchema,
  codigo: codigoRecuperacaoSchema,
  senha: z.string().min(6, 'Mínimo de 6 caracteres').max(72),
});
export type RecuperarSenhaInput = z.infer<typeof recuperarSenhaSchema>;

/** Código mostrado UMA vez (ex.: K7QF-29MX). Depois de usado, outro é gerado. */
export interface CodigoRecuperacao {
  codigo: string;
}
