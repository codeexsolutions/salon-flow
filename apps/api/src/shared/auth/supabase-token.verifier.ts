import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import type { Env } from '../../config/env.js';
import type { UsuarioAutenticado } from './usuario-autenticado.js';

interface SupabaseClaims extends JWTPayload {
  email?: string;
  user_metadata?: { full_name?: string; name?: string; avatar_url?: string };
}

/**
 * Valida o access token emitido pelo Supabase Auth usando as chaves públicas (JWKS) do projeto.
 * Não há segredo compartilhado: a API só confere a assinatura.
 */
@Injectable()
export class SupabaseTokenVerifier {
  private readonly issuer: string;
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor(config: ConfigService<Env, true>) {
    const supabaseUrl = config.get('SUPABASE_URL', { infer: true }).replace(/\/$/, '');
    this.issuer = `${supabaseUrl}/auth/v1`;
    this.jwks = createRemoteJWKSet(new URL(`${this.issuer}/.well-known/jwks.json`));
  }

  async verificar(token: string): Promise<UsuarioAutenticado> {
    const { payload } = await jwtVerify<SupabaseClaims>(token, this.jwks, {
      issuer: this.issuer,
      audience: 'authenticated',
    });

    if (!payload.sub || !payload.email) {
      throw new Error('Token sem sub/email');
    }

    return {
      id: payload.sub,
      email: payload.email,
      nome: payload.user_metadata?.full_name ?? payload.user_metadata?.name,
      avatarUrl: payload.user_metadata?.avatar_url,
    };
  }
}
