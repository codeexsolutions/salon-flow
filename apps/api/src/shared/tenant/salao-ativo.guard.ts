import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { z } from 'zod';
import { HEADER_SALAO_ID, type Papel } from '@salonflow/shared';
import { AcessoNegadoError } from '../errors/domain.error.js';
import { ContextoSalao } from './contexto-salao.js';
import { PAPEIS_PERMITIDOS } from './tenant.constants.js';
import { VinculosRepository } from './vinculos.repository.js';

/**
 * Lê o salão ativo do header `x-salao-id`, confere se o usuário logado tem vínculo
 * com ele e se o papel é permitido na rota. Depois grava salão e papel no ContextoSalao.
 */
@Injectable()
export class SalaoAtivoGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly vinculos: VinculosRepository,
    private readonly contexto: ContextoSalao,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request>();
    const salaoId = z.uuid().safeParse(req.headers[HEADER_SALAO_ID]);
    if (!req.usuario || !salaoId.success) {
      throw new AcessoNegadoError('Salão não informado');
    }

    const papel = await this.vinculos.buscarPapelAtivo(req.usuario.id, salaoId.data);
    if (!papel) throw new AcessoNegadoError('Você não faz parte deste salão');

    const permitidos = this.reflector.getAllAndOverride<Papel[]>(PAPEIS_PERMITIDOS, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (permitidos?.length && !permitidos.includes(papel)) {
      throw new AcessoNegadoError();
    }

    this.contexto.definir(salaoId.data, papel);
    return true;
  }
}
