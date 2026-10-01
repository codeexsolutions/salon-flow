import { Controller, Get } from '@nestjs/common';
import { UsuarioAtual } from '../../shared/auth/decorators.js';
import type { UsuarioAutenticado } from '../../shared/auth/usuario-autenticado.js';
import { UsuariosService } from './usuarios.service.js';

@Controller('me')
export class UsuariosController {
  constructor(private readonly service: UsuariosService) {}

  @Get()
  perfil(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.service.perfil(usuario);
  }
}
