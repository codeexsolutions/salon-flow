import { Module } from '@nestjs/common';
import { AgendadorNotificacoes } from './agendador.service.js';
import {
  AvaliacaoPublicaController,
  AvaliacoesController,
  MensagensController,
  PushController,
} from './notificacoes.controller.js';
import { NotificacoesRepository } from './notificacoes.repository.js';
import { NotificacoesService } from './notificacoes.service.js';
import { PushService } from './push.service.js';

@Module({
  controllers: [
    PushController,
    MensagensController,
    AvaliacoesController,
    AvaliacaoPublicaController,
  ],
  providers: [NotificacoesService, NotificacoesRepository, PushService, AgendadorNotificacoes],
  exports: [NotificacoesService, PushService],
})
export class NotificacoesModule {}
