import { Module } from '@nestjs/common';
import { FaturamentoController } from './faturamento.controller.js';
import { FaturamentoRepository } from './faturamento.repository.js';
import { FaturamentoService } from './faturamento.service.js';

@Module({
  controllers: [FaturamentoController],
  providers: [FaturamentoService, FaturamentoRepository],
})
export class FaturamentoModule {}
