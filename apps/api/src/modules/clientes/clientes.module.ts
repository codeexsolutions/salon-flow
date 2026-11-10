import { Module } from '@nestjs/common';
import { ProfissionaisModule } from '../profissionais/profissionais.module.js';
import { ClientesController, ProClientesController } from './clientes.controller.js';
import { ClientesRepository } from './clientes.repository.js';
import { ClientesService } from './clientes.service.js';

@Module({
  imports: [ProfissionaisModule],
  controllers: [ClientesController, ProClientesController],
  providers: [ClientesService, ClientesRepository],
  exports: [ClientesService],
})
export class ClientesModule {}
