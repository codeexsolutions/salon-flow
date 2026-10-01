import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ROTA_PUBLICA } from './decorators.js';
import { SupabaseTokenVerifier } from './supabase-token.verifier.js';

/**
 * Guard global: toda rota exige login, exceto as marcadas com @Publica().
 * Em rotas públicas, se vier um token válido, o usuário é identificado mesmo assim.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly verifier: SupabaseTokenVerifier,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const publica = this.reflector.getAllAndOverride<boolean>(ROTA_PUBLICA, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    const req = ctx.switchToHttp().getRequest<Request>();
    const token = this.extrairToken(req);

    if (!token) {
      if (publica) return true;
      throw new UnauthorizedException({ codigo: 'NAO_AUTENTICADO', mensagem: 'Faça login' });
    }

    try {
      req.usuario = await this.verifier.verificar(token);
    } catch {
      if (publica) return true;
      throw new UnauthorizedException({
        codigo: 'TOKEN_INVALIDO',
        mensagem: 'Sessão inválida ou expirada',
      });
    }
    return true;
  }

  private extrairToken(req: Request): string | undefined {
    const [tipo, token] = req.headers.authorization?.split(' ') ?? [];
    return tipo === 'Bearer' ? token : undefined;
  }
}
