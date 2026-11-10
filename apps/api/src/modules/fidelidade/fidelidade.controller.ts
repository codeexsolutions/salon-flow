import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put } from '@nestjs/common';
import {
  ajustePontosSchema,
  premioFidelidadeSchema,
  programaFidelidadeSchema,
  resgatarPremioSchema,
  type AjustePontosInput,
  type PremioFidelidadeInput,
  type ProgramaFidelidadeInput,
  type ResgatarPremioInput,
} from '@salonflow/shared';
import { UsuarioAtual } from '../../shared/auth/decorators.js';
import type { UsuarioAutenticado } from '../../shared/auth/usuario-autenticado.js';
import { ZodValidationPipe } from '../../shared/http/zod-validation.pipe.js';
import {
  ExigePermissao,
  RotaDoSalao,
  SomentePapeis,
} from '../../shared/tenant/rota-do-salao.decorator.js';
import { FidelidadeService } from './fidelidade.service.js';

const uuid = new ParseUUIDPipe();

/** Programa de pontos: configuração (dono) e pontos/resgates dos clientes. */
@RotaDoSalao()
@ExigePermissao('COMANDAS', 'CLIENTES')
@Controller('fidelidade')
export class FidelidadeController {
  constructor(private readonly service: FidelidadeService) {}

  @Get('config')
  @SomentePapeis('DONO')
  config() {
    return this.service.config();
  }

  @Put('programa')
  @SomentePapeis('DONO')
  salvarPrograma(
    @Body(new ZodValidationPipe(programaFidelidadeSchema)) dados: ProgramaFidelidadeInput,
  ) {
    return this.service.salvarPrograma(dados);
  }

  @Post('premios')
  @SomentePapeis('DONO')
  criarPremio(@Body(new ZodValidationPipe(premioFidelidadeSchema)) dados: PremioFidelidadeInput) {
    return this.service.criarPremio(dados);
  }

  @Put('premios/:id')
  @SomentePapeis('DONO')
  atualizarPremio(
    @Param('id', uuid) id: string,
    @Body(new ZodValidationPipe(premioFidelidadeSchema)) dados: PremioFidelidadeInput,
  ) {
    return this.service.atualizarPremio(id, dados);
  }

  @Get('clientes/:id')
  pontos(@Param('id', uuid) id: string) {
    return this.service.pontosDoCliente(id);
  }

  @Post('clientes/:id/resgates')
  resgatar(
    @Param('id', uuid) id: string,
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Body(new ZodValidationPipe(resgatarPremioSchema)) { premioId }: ResgatarPremioInput,
  ) {
    return this.service.resgatar(id, premioId, usuario.id);
  }

  @Post('clientes/:id/ajustes')
  @SomentePapeis('DONO')
  ajustar(
    @Param('id', uuid) id: string,
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Body(new ZodValidationPipe(ajustePontosSchema)) dados: AjustePontosInput,
  ) {
    return this.service.ajustar(id, dados, usuario.id);
  }
}

/** App do cliente: meus pontos em todos os salões. */
@Controller('me/pontos')
export class MeusPontosController {
  constructor(private readonly service: FidelidadeService) {}

  @Get()
  listar(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.service.meusPontos(usuario.id);
  }
}
