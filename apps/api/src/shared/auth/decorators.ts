import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import type { Request } from 'express';
import type { UsuarioAutenticado } from './usuario-autenticado.js';

export const ROTA_PUBLICA = 'rotaPublica';

/** Libera a rota sem login (ex.: busca de salões no marketplace, health check). */
export const Publica = () => SetMetadata(ROTA_PUBLICA, true);

/** Injeta o usuário logado no parâmetro do controller. */
export const UsuarioAtual = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): UsuarioAutenticado => {
    const req = ctx.switchToHttp().getRequest<Request>();
    return req.usuario!;
  },
);
