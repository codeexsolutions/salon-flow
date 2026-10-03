import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  alterarAcessoSchema,
  convidarRecepcaoSchema,
  type AlterarAcessoInput,
  type ConvidarRecepcaoInput,
  type EquipeSalao,
  type ResultadoConvite,
} from '@salonflow/shared';
import { UsuarioAtual } from '../../shared/auth/decorators.js';
import type { UsuarioAutenticado } from '../../shared/auth/usuario-autenticado.js';
import { ZodValidationPipe } from '../../shared/http/zod-validation.pipe.js';
import { RotaDoSalao } from '../../shared/tenant/rota-do-salao.decorator.js';
import { paraEquipeSalao } from './equipe.mapper.js';
import { EquipeService } from './equipe.service.js';

/** Equipe e acessos: quem entra no painel/app do salão. Só o dono. */
@RotaDoSalao('DONO')
@Controller('equipe')
export class EquipeController {
  constructor(private readonly service: EquipeService) {}

  @Get()
  async listar(@UsuarioAtual() usuario: UsuarioAutenticado): Promise<EquipeSalao> {
    return paraEquipeSalao(await this.service.listar(), usuario.id);
  }

  @Post('convites')
  convidar(
    @Body(new ZodValidationPipe(convidarRecepcaoSchema)) dados: ConvidarRecepcaoInput,
  ): Promise<ResultadoConvite> {
    return this.service.convidarRecepcao(dados);
  }

  @Delete('convites/:id')
  @HttpCode(204)
  cancelarConvite(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.cancelarConvite(id);
  }

  @Patch('membros/:id')
  @HttpCode(204)
  alterarAcesso(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(alterarAcessoSchema)) { ativo }: AlterarAcessoInput,
  ) {
    return this.service.alterarAcesso(id, ativo, usuario.id);
  }
}
