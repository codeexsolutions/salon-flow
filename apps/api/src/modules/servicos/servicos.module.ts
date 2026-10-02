import { Module } from '@nestjs/common';
import { ProfissionaisModule } from '../profissionais/profissionais.module.js';
import { ServicosController } from './servicos.controller.js';
import { ServicosRepository } from './servicos.repository.js';
import { ServicosService } from './servicos.service.js';

@Module({
  imports: [ProfissionaisModule],
  controllers: [ServicosController],
  providers: [ServicosService, ServicosRepository],
  exports: [ServicosService],
})
export class ServicosModule {}
