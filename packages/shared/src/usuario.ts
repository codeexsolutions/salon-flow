import type { Papel } from './enums.js';

/** Salão em que o usuário atua e o papel dele lá. */
export interface VinculoSalao {
  id: string;
  nome: string;
  slug: string;
  /** Fuso IANA do salão (ex.: America/Sao_Paulo), para exibir horários. */
  fusoHorario: string;
  papel: Papel;
  /** Também atende como profissional neste salão (pode usar o app do profissional). */
  ehProfissional: boolean;
}

/** Resposta de GET /me. Sem salões = usuário apenas cliente. */
export interface PerfilUsuario {
  id: string;
  /** Usuário de login. */
  usuario: string;
  email: string;
  nome: string | null;
  avatarUrl: string | null;
  /** Já tem código de recuperação de senha. */
  temRecuperacao: boolean;
  saloes: VinculoSalao[];
}
