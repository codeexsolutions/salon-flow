import { Module } from '@nestjs/common';
import { ClientesModule } from '../clientes/clientes.module.js';
import { ProfissionaisModule } from '../profissionais/profissionais.module.js';
import { ServicosModule } from '../servicos/servicos.module.js';
import {
  AgendaController,
  AgendamentosController,
  AgendaPublicaController,
  MeusAgendamentosController,
  ProAgendaController,
} from './agenda.controller.js';
import { AgendaService } from './agenda.service.js';
import { AgendamentosRepository } from './agendamentos.repository.js';

@Module({
  imports: [ClientesModule, ProfissionaisModule, ServicosModule],
  controllers: [
    AgendaController,
    AgendamentosController,
    AgendaPublicaController,
    MeusAgendamentosController,
    ProAgendaController,
  ],
  providers: [AgendaService, AgendamentosRepository],
  exports: [AgendaService],
})
export class AgendaModule {}
