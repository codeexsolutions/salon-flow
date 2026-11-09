import { z } from 'zod';
import type { Papel } from '../enums.js';
import { nomeUsuarioSchema } from '../login.js';
import { PERMISSOES, type Permissao } from '../permissoes.js';

const permissoesSchema = z.array(z.enum(PERMISSOES)).max(PERMISSOES.length);

/** Dono libera o painel para alguém da recepção (pelo usuário de login). */
export const convidarRecepcaoSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  usuario: nomeUsuarioSchema,
  /** Sem = padrão da recepção. */
  permissoes: permissoesSchema.optional(),
});
export type ConvidarRecepcaoInput = z.infer<typeof convidarRecepcaoSchema>;

export const alterarAcessoSchema = z.object({ ativo: z.boolean() });
export type AlterarAcessoInput = z.infer<typeof alterarAcessoSchema>;

/** O dono marca o que está liberado para a pessoa. */
export const definirPermissoesSchema = z.object({ permissoes: permissoesSchema });
export type DefinirPermissoesInput = z.infer<typeof definirPermissoesSchema>;

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
  /** Liberadas para a pessoa (dono = tudo). */
  permissoes: Permissao[];
  /** O dono já personalizou (senão vale o padrão do papel). */
  personalizadas: boolean;
  criadoEm: string;
}

/** Acesso liberado para um usuário que ainda não entrou no SalonFlow. */
export interface ConviteAcessoPendente {
  id: string;
  nome: string | null;
  usuario: string;
  papel: Papel;
  permissoes: Permissao[];
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
