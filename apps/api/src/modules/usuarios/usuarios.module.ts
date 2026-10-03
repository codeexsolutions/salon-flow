import { Module } from '@nestjs/common';
import { EquipeModule } from '../equipe/equipe.module.js';
import { ProfissionaisModule } from '../profissionais/profissionais.module.js';
import { RecuperacaoController } from './recuperacao.controller.js';
import { RecuperacaoService } from './recuperacao.service.js';
import { UsuariosController } from './usuarios.controller.js';
import { UsuariosRepository } from './usuarios.repository.js';
import { UsuariosService } from './usuarios.service.js';

@Module({
  imports: [ProfissionaisModule, EquipeModule],
  controllers: [UsuariosController, RecuperacaoController],
  providers: [UsuariosService, UsuariosRepository, RecuperacaoService],
  exports: [UsuariosService],
})
export class UsuariosModule {}
