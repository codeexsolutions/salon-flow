import { Module } from '@nestjs/common';
import { EquipeModule } from '../equipe/equipe.module.js';
import { ProfissionaisModule } from '../profissionais/profissionais.module.js';
import { UsuariosController } from './usuarios.controller.js';
import { UsuariosRepository } from './usuarios.repository.js';
import { UsuariosService } from './usuarios.service.js';

@Module({
  imports: [ProfissionaisModule, EquipeModule],
  controllers: [UsuariosController],
  providers: [UsuariosService, UsuariosRepository],
  exports: [UsuariosService],
})
export class UsuariosModule {}
