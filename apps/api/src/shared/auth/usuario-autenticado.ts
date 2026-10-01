/** Usuário extraído do token do Supabase Auth. */
export interface UsuarioAutenticado {
  /** Mesmo id do Supabase Auth (`sub` do token) e de `Usuario.id` no banco. */
  id: string;
  email: string;
  nome?: string;
  avatarUrl?: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      usuario?: UsuarioAutenticado;
    }
  }
}
