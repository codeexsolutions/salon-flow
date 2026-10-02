import { Module } from '@nestjs/common';
import { ProfissionaisModule } from '../profissionais/profissionais.module.js';
import { ServicosModule } from '../servicos/servicos.module.js';
import { ComissoesController, ProComissoesController } from './comissoes.controller.js';
import { ComissoesRepository } from './comissoes.repository.js';
import { ComissoesService } from './comissoes.service.js';

@Module({
  imports: [ProfissionaisModule, ServicosModule],
  controllers: [ComissoesController, ProComissoesController],
  providers: [ComissoesService, ComissoesRepository],
  exports: [ComissoesService],
})
export class ComissoesModule {}
