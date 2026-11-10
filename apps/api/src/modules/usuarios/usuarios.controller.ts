import { Body, Controller, Get, Put } from '@nestjs/common';
import { perfilClienteSchema, type PerfilClienteInput } from '@salonflow/shared';
import { UsuarioAtual } from '../../shared/auth/decorators.js';
import type { UsuarioAutenticado } from '../../shared/auth/usuario-autenticado.js';
import { ZodValidationPipe } from '../../shared/http/zod-validation.pipe.js';
import { UsuariosService } from './usuarios.service.js';

@Controller('me')
export class UsuariosController {
  constructor(private readonly service: UsuariosService) {}

  @Get()
  perfil(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.service.perfil(usuario);
  }

  /** Cadastro opcional do cliente, usado na ficha de todos os salões em que agenda. */
  @Get('perfil-cliente')
  perfilCliente(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.service.perfilCliente(usuario);
  }

  @Put('perfil-cliente')
  salvarPerfilCliente(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Body(new ZodValidationPipe(perfilClienteSchema)) dados: PerfilClienteInput,
  ) {
    return this.service.salvarPerfilCliente(usuario, dados);
  }
}
