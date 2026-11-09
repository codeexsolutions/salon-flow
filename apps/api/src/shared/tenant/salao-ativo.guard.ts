import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { z } from 'zod';
import { HEADER_SALAO_ID, type Papel, type Permissao } from '@salonflow/shared';
import { AcessoNegadoError } from '../errors/domain.error.js';
import { ContextoSalao } from './contexto-salao.js';
import { PAPEIS_PERMITIDOS, PERMISSOES_EXIGIDAS } from './tenant.constants.js';
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

    const vinculo = await this.vinculos.buscarVinculoAtivo(req.usuario.id, salaoId.data);
    if (!vinculo) throw new AcessoNegadoError('Você não faz parte deste salão');
    const { papel, fusoHorario, permissoes } = vinculo;

    const permitidos = this.reflector.getAllAndOverride<Papel[]>(PAPEIS_PERMITIDOS, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (permitidos?.length && !permitidos.includes(papel)) {
      throw new AcessoNegadoError();
    }

    const exigidas = this.reflector.getAllAndOverride<Permissao[]>(PERMISSOES_EXIGIDAS, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (papel !== 'DONO' && exigidas?.length && !exigidas.some((p) => permissoes.includes(p))) {
      throw new AcessoNegadoError('Esta área não está liberada para você.');
    }

    this.contexto.definir(salaoId.data, papel, fusoHorario, permissoes);
    return true;
  }
}
