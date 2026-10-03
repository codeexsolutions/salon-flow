import { Module } from '@nestjs/common';
import { EquipeController } from './equipe.controller.js';
import { EquipeRepository } from './equipe.repository.js';
import { EquipeService } from './equipe.service.js';

@Module({
  controllers: [EquipeController],
  providers: [EquipeService, EquipeRepository],
  exports: [EquipeService],
})
export class EquipeModule {}
