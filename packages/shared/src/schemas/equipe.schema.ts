import { z } from 'zod';
import type { Papel } from '../enums.js';
import { nomeUsuarioSchema } from '../login.js';

/** Dono libera o painel para alguém da recepção (pelo usuário de login). */
export const convidarRecepcaoSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  usuario: nomeUsuarioSchema,
});
export type ConvidarRecepcaoInput = z.infer<typeof convidarRecepcaoSchema>;

export const alterarAcessoSchema = z.object({ ativo: z.boolean() });
export type AlterarAcessoInput = z.infer<typeof alterarAcessoSchema>;

/** Pessoa com acesso ao salão (painel ou app do profissional). */
export interface MembroEquipe {
  id: string;
  nome: string | null;
  usuario: string;
  papel: Papel;
  ativo: boolean;
  /** Também atende como profissional (tem o app do profissional). */
  ehProfissional: boolean;
  /** É o próprio usuário logado. */
  ehVoce: boolean;
  criadoEm: string;
}

/** Acesso liberado para um usuário que ainda não entrou no SalonFlow. */
export interface ConviteAcessoPendente {
  id: string;
  nome: string | null;
  usuario: string;
  papel: Papel;
  criadoEm: string;
}

export interface EquipeSalao {
  membros: MembroEquipe[];
  convites: ConviteAcessoPendente[];
}

/**
 * Resultado do convite: `LIBERADO` = a pessoa já é do salão e agora vê o painel;
 * `PENDENTE` = falta criar a conta dela (e-mail + senha provisória).
 */
export type ResultadoConvite =
  | { situacao: 'LIBERADO' }
  /** `conviteId` permite desfazer se a conta não puder ser criada. */
  | { situacao: 'PENDENTE'; conviteId: string };
