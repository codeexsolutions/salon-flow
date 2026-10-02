import { Module } from '@nestjs/common';
import { CaixaController } from './caixa.controller.js';
import { CaixaRepository } from './caixa.repository.js';
import { CaixaService } from './caixa.service.js';

@Module({
  controllers: [CaixaController],
  providers: [CaixaService, CaixaRepository],
  exports: [CaixaService],
})
export class CaixaModule {}
