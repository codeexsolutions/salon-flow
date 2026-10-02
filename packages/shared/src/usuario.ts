import type { Papel } from './enums.js';

/** Salão em que o usuário atua e o papel dele lá. */
export interface VinculoSalao {
  id: string;
  nome: string;
  slug: string;
  papel: Papel;
}

/** Resposta de GET /me. Sem salões = usuário apenas cliente. */
export interface PerfilUsuario {
  id: string;
  email: string;
  nome: string | null;
  avatarUrl: string | null;
  saloes: VinculoSalao[];
}
