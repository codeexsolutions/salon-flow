import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import {
  abrirCaixaSchema,
  fecharCaixaSchema,
  historicoCaixaSchema,
  movimentoCaixaSchema,
  type AbrirCaixaInput,
  type FecharCaixaInput,
  type MovimentoCaixaInput,
} from '@salonflow/shared';
import { UsuarioAtual } from '../../shared/auth/decorators.js';
import type { UsuarioAutenticado } from '../../shared/auth/usuario-autenticado.js';
import { ZodValidationPipe } from '../../shared/http/zod-validation.pipe.js';
import { RotaDoSalao } from '../../shared/tenant/rota-do-salao.decorator.js';
import { CaixaService } from './caixa.service.js';

/** Caixa diário: abertura, sangrias/reforços e fechamento com conferência. */
@RotaDoSalao('DONO', 'RECEPCAO')
@Controller('caixa')
export class CaixaController {
  constructor(private readonly service: CaixaService) {}

  /** Caixa aberto (ou null). */
  @Get('atual')
  async atual() {
    return { caixa: await this.service.atual() };
  }

  @Post('abrir')
  abrir(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Body(new ZodValidationPipe(abrirCaixaSchema)) dados: AbrirCaixaInput,
  ) {
    return this.service.abrir(dados, usuario.id);
  }

  @Post('movimentos')
  movimentar(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Body(new ZodValidationPipe(movimentoCaixaSchema)) dados: MovimentoCaixaInput,
  ) {
    return this.service.movimentar(dados, usuario.id);
  }

  @Post('fechar')
  fechar(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Body(new ZodValidationPipe(fecharCaixaSchema)) dados: FecharCaixaInput,
  ) {
    return this.service.fechar(dados, usuario.id);
  }

  /** GET /caixa/historico?de=AAAA-MM-DD&ate=AAAA-MM-DD */
  @Get('historico')
  historico(
    @Query(new ZodValidationPipe(historicoCaixaSchema)) { de, ate }: { de: string; ate: string },
  ) {
    return this.service.historico(de, ate);
  }

  @Get(':id')
  detalhe(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.detalhe(id);
  }
}
