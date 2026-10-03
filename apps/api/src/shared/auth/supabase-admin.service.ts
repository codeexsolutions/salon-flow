import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.js';
import { RegraDeNegocioError } from '../errors/domain.error.js';

/**
 * Operações administrativas no Supabase Auth (precisam da chave SECRETA, só no servidor).
 * Hoje: senha nova para quem esqueceu (definida pelo salão ou pelo código de recuperação).
 */
@Injectable()
export class SupabaseAdminService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  /**
   * Troca a senha. `provisoria` (padrão): senha dada pelo salão, a pessoa cria a
   * dela ao entrar; false: a própria pessoa escolheu (recuperação com código).
   */
  async redefinirSenha(
    usuarioId: string,
    senha: string,
    { provisoria = true }: { provisoria?: boolean } = {},
  ): Promise<void> {
    const chave = this.config.get('SUPABASE_SECRET_KEY', { infer: true });
    if (!chave) {
      throw new RegraDeNegocioError(
        'SEM_CHAVE_SECRETA',
        'Redefinir senha ainda não está disponível (falta SUPABASE_SECRET_KEY na API).',
      );
    }

    const url = this.config.get('SUPABASE_URL', { infer: true });
    const resposta = await fetch(`${url}/auth/v1/admin/users/${usuarioId}`, {
      method: 'PUT',
      headers: {
        apikey: chave,
        Authorization: `Bearer ${chave}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password: senha, user_metadata: { senha_provisoria: provisoria } }),
    });

    if (!resposta.ok) {
      const corpo = (await resposta.json().catch(() => null)) as { msg?: string } | null;
      throw new RegraDeNegocioError(
        'FALHA_REDEFINIR_SENHA',
        `Não foi possível redefinir a senha${corpo?.msg ? ` (${corpo.msg})` : ''}.`,
      );
    }
  }
}
