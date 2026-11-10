import { Module } from '@nestjs/common';
import { NotificacoesModule } from '../notificacoes/notificacoes.module.js';
import { FidelidadeController, MeusPontosController } from './fidelidade.controller.js';
import { FidelidadeRepository } from './fidelidade.repository.js';
import { FidelidadeService } from './fidelidade.service.js';

@Module({
  imports: [NotificacoesModule],
  controllers: [FidelidadeController, MeusPontosController],
  providers: [FidelidadeService, FidelidadeRepository],
  exports: [FidelidadeService],
})
export class FidelidadeModule {}
