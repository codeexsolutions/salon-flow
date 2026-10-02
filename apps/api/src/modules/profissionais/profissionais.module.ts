import { Module } from '@nestjs/common';
import { ProfissionaisController } from './profissionais.controller.js';
import { ProfissionaisRepository } from './profissionais.repository.js';
import { ProfissionaisService } from './profissionais.service.js';

@Module({
  controllers: [ProfissionaisController],
  providers: [ProfissionaisService, ProfissionaisRepository],
  exports: [ProfissionaisService],
})
export class ProfissionaisModule {}
