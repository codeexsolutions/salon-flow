import { Module } from '@nestjs/common';
import { ComissoesModule } from '../comissoes/comissoes.module.js';
import { ProfissionaisModule } from '../profissionais/profissionais.module.js';
import { ServicosModule } from '../servicos/servicos.module.js';
import { ContratosController, ProContratoController } from './contratos.controller.js';
import { ContratosRepository } from './contratos.repository.js';
import { ContratosService } from './contratos.service.js';

@Module({
  imports: [ProfissionaisModule, ServicosModule, ComissoesModule],
  controllers: [ContratosController, ProContratoController],
  providers: [ContratosService, ContratosRepository],
})
export class ContratosModule {}
