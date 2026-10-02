import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Put, Query } from '@nestjs/common';
import {
  configuracaoComissaoSchema,
  dataLocalSchema,
  definirRegrasComissaoSchema,
  gerarRepasseSchema,
  type ConfiguracaoComissao,
  type DefinirRegrasComissaoInput,
  type GerarRepasseInput,
} from '@salonflow/shared';
import { z } from 'zod';
import { UsuarioAtual } from '../../shared/auth/decorators.js';
import type { UsuarioAutenticado } from '../../shared/auth/usuario-autenticado.js';
import { ZodValidationPipe } from '../../shared/http/zod-validation.pipe.js';
import { RotaDoSalao } from '../../shared/tenant/rota-do-salao.decorator.js';
import { ComissoesService } from './comissoes.service.js';

const periodoSchema = z.object({
  de: dataLocalSchema,
  ate: dataLocalSchema,
  profissionalId: z.uuid().optional(),
});
type Periodo = z.infer<typeof periodoSchema>;

/** Configuração, regras e extrato de comissões — só o dono. */
@RotaDoSalao('DONO')
@Controller('comissoes')
export class ComissoesController {
  constructor(private readonly service: ComissoesService) {}

  @Get('configuracao')
  configuracao() {
    return this.service.configuracao();
  }

  @Put('configuracao')
  salvarConfiguracao(
    @Body(new ZodValidationPipe(configuracaoComissaoSchema)) dados: ConfiguracaoComissao,
  ) {
    return this.service.salvarConfiguracao(dados);
  }

  @Get('regras')
  regras() {
    return this.service.regras();
  }

  /** Substitui todas as regras do salão. */
  @Put('regras')
  definirRegras(
    @Body(new ZodValidationPipe(definirRegrasComissaoSchema)) dados: DefinirRegrasComissaoInput,
  ) {
    return this.service.definirRegras(dados);
  }

  /** GET /comissoes/extrato?de=AAAA-MM-DD&ate=AAAA-MM-DD[&profissionalId=] */
  @Get('extrato')
  extrato(@Query(new ZodValidationPipe(periodoSchema)) { de, ate, profissionalId }: Periodo) {
    return this.service.extrato(de, ate, profissionalId);
  }

  /** Paga as comissões pendentes do período a um profissional. */
  @Post('repasses')
  async gerarRepasse(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Body(new ZodValidationPipe(gerarRepasseSchema)) dados: GerarRepasseInput,
  ) {
    const repasse = await this.service.gerarRepasse(dados, usuario.id);
    return this.service.repasse(repasse.id);
  }

  @Get('repasses')
  repasses(
    @Query('profissionalId', new ZodValidationPipe(z.uuid().optional())) profissionalId?: string,
  ) {
    return this.service.repasses(profissionalId);
  }

  /** Comprovante no formato salão-parceiro. */
  @Get('repasses/:id')
  repasse(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.repasse(id);
  }

  @Post('repasses/:id/cancelar')
  cancelarRepasse(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.cancelarRepasse(id);
  }
}

/** App do profissional: o próprio extrato. */
@RotaDoSalao()
@Controller('pro/comissoes')
export class ProComissoesController {
  constructor(private readonly service: ComissoesService) {}

  @Get()
  extrato(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Query(new ZodValidationPipe(periodoSchema.omit({ profissionalId: true })))
    { de, ate }: Omit<Periodo, 'profissionalId'>,
  ) {
    return this.service.extratoDoUsuario(usuario.id, de, ate);
  }

  @Get('repasses')
  repasses(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.service.repassesDoUsuario(usuario.id);
  }

  @Get('repasses/:id')
  repasse(@UsuarioAtual() usuario: UsuarioAutenticado, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.repasseDoUsuario(usuario.id, id);
  }
}
