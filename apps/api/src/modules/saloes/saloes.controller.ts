import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import {
  atualizarSalaoSchema,
  criarSalaoSchema,
  type AtualizarSalaoInput,
  type CriarSalaoInput,
} from '@salonflow/shared';
import { Publica, UsuarioAtual } from '../../shared/auth/decorators.js';
import type { UsuarioAutenticado } from '../../shared/auth/usuario-autenticado.js';
import { ZodValidationPipe } from '../../shared/http/zod-validation.pipe.js';
import { RotaDoSalao } from '../../shared/tenant/rota-do-salao.decorator.js';
import { paraSalaoPublico } from './saloes.mapper.js';
import { SaloesService } from './saloes.service.js';

/**
 * Camada de APRESENTAÇÃO: recebe HTTP, valida a entrada e devolve a resposta.
 * Nenhuma regra de negócio aqui.
 */
@Controller('saloes')
export class SaloesController {
  constructor(private readonly service: SaloesService) {}

  /** Qualquer usuário logado pode cadastrar um salão (vira DONO dele). */
  @Post()
  criar(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Body(new ZodValidationPipe(criarSalaoSchema)) dados: CriarSalaoInput,
  ) {
    return this.service.criar(usuario, dados);
  }

  /** Salão ativo (header x-salao-id). Declarado antes de ':slug' para não conflitar. */
  @RotaDoSalao()
  @Get('atual')
  atual() {
    return this.service.atual();
  }

  @RotaDoSalao('DONO')
  @Patch('atual')
  atualizar(@Body(new ZodValidationPipe(atualizarSalaoSchema)) dados: AtualizarSalaoInput) {
    return this.service.atualizar(dados);
  }

  /** Página pública do salão (app do cliente / marketplace). */
  @Publica()
  @Get(':slug')
  async buscarPublico(@Param('slug') slug: string) {
    return paraSalaoPublico(await this.service.buscarPublico(slug));
  }
}
