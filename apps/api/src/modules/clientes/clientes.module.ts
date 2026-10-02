import { Module } from '@nestjs/common';
import { ClientesController } from './clientes.controller.js';
import { ClientesRepository } from './clientes.repository.js';
import { ClientesService } from './clientes.service.js';

@Module({
  controllers: [ClientesController],
  providers: [ClientesService, ClientesRepository],
  exports: [ClientesService],
})
export class ClientesModule {}
