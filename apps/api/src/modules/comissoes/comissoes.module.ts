import { Module } from '@nestjs/common';
import { ProfissionaisModule } from '../profissionais/profissionais.module.js';
import { ServicosModule } from '../servicos/servicos.module.js';
import {
  ComissoesController,
  MaquininhasController,
  ProComissoesController,
} from './comissoes.controller.js';
import { ComissoesRepository } from './comissoes.repository.js';
import { ComissoesService } from './comissoes.service.js';
import { MaquininhasRepository } from './maquininhas.repository.js';
import { MaquininhasService } from './maquininhas.service.js';

@Module({
  imports: [ProfissionaisModule, ServicosModule],
  controllers: [ComissoesController, ProComissoesController, MaquininhasController],
  providers: [ComissoesService, ComissoesRepository, MaquininhasService, MaquininhasRepository],
  exports: [ComissoesService, MaquininhasService],
})
export class ComissoesModule {}
