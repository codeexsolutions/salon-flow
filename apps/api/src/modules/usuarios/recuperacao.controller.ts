import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  definirRecuperacaoSchema,
  recuperarSenhaSchema,
  type CodigoRecuperacao,
  type DefinirRecuperacaoInput,
  type RecuperarSenhaInput,
} from '@salonflow/shared';
import { Publica, UsuarioAtual } from '../../shared/auth/decorators.js';
import type { UsuarioAutenticado } from '../../shared/auth/usuario-autenticado.js';
import { ZodValidationPipe } from '../../shared/http/zod-validation.pipe.js';
import { RecuperacaoService } from './recuperacao.service.js';

@Controller()
export class RecuperacaoController {
  constructor(private readonly service: RecuperacaoService) {}

  /** Conta logada: salva o celular e gera um código de recuperação novo. */
  @Post('me/recuperacao')
  definir(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Body(new ZodValidationPipe(definirRecuperacaoSchema)) { telefone }: DefinirRecuperacaoInput,
  ): Promise<CodigoRecuperacao> {
    return this.service.definir(usuario, telefone);
  }

  /** Público: usuário + celular + código definem uma senha nova. */
  @Publica()
  @Post('recuperacao-senha')
  @HttpCode(200)
  recuperar(
    @Body(new ZodValidationPipe(recuperarSenhaSchema)) dados: RecuperarSenhaInput,
  ): Promise<CodigoRecuperacao> {
    return this.service.recuperar(dados);
  }
}
