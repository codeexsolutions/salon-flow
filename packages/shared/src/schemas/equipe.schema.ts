import { z } from 'zod';
import type { Papel } from '../enums.js';

/** Dono libera o painel para alguém da recepção (pelo e-mail). */
export const convidarRecepcaoSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  email: z.email('E-mail inválido').trim().toLowerCase().max(160),
});
export type ConvidarRecepcaoInput = z.infer<typeof convidarRecepcaoSchema>;

export const alterarAcessoSchema = z.object({ ativo: z.boolean() });
export type AlterarAcessoInput = z.infer<typeof alterarAcessoSchema>;

/** Pessoa com acesso ao salão (painel ou app do profissional). */
export interface MembroEquipe {
  id: string;
  nome: string | null;
  email: string;
  papel: Papel;
  ativo: boolean;
  /** Também atende como profissional (tem o app do profissional). */
  ehProfissional: boolean;
  /** É o próprio usuário logado. */
  ehVoce: boolean;
  criadoEm: string;
}

/** Acesso liberado para um e-mail que ainda não entrou no SalonFlow. */
export interface ConviteAcessoPendente {
  id: string;
  nome: string | null;
  email: string;
  papel: Papel;
  criadoEm: string;
}

export interface EquipeSalao {
  membros: MembroEquipe[];
  convites: ConviteAcessoPendente[];
}

/**
 * Resultado do convite: `LIBERADO` = a pessoa já tem conta e já tem acesso;
 * `PENDENTE` = falta criar a conta dela (e-mail + senha provisória).
 */
export interface ResultadoConvite {
  situacao: 'LIBERADO' | 'PENDENTE';
}
