import { Module } from '@nestjs/common';
import { UsuariosModule } from '../usuarios/usuarios.module.js';
import { SaloesController } from './saloes.controller.js';
import { SaloesRepository } from './saloes.repository.js';
import { SaloesService } from './saloes.service.js';

@Module({
  imports: [UsuariosModule],
  controllers: [SaloesController],
  providers: [SaloesService, SaloesRepository],
  exports: [SaloesService],
})
export class SaloesModule {}
