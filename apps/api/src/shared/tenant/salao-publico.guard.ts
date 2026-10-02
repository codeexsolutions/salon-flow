import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { NaoEncontradoError } from '../errors/domain.error.js';
import { ContextoSalao } from './contexto-salao.js';
import { VinculosRepository } from './vinculos.repository.js';

/**
 * Rotas do cliente sob /publico/saloes/:slug: identifica o salão pelo endereço
 * (sem exigir vínculo de equipe) e grava salão e fuso no ContextoSalao.
 */
@Injectable()
export class SalaoPublicoGuard implements CanActivate {
  constructor(
    private readonly vinculos: VinculosRepository,
    private readonly contexto: ContextoSalao,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest<Request>();
    const slug = String(req.params.slug ?? '');
    const salao = await this.vinculos.buscarSalaoAtivoPorSlug(slug);
    if (!salao) throw new NaoEncontradoError('Salão');

    this.contexto.definirPublico(salao.id, salao.fusoHorario);
    return true;
  }
}
