import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import {
  alterarStatusAgendamentoSchema,
  criarAgendamentoSchema,
  dataLocalSchema,
  horariosLivresQuerySchema,
  remarcarAgendamentoSchema,
  type AlterarStatusAgendamentoInput,
  type CriarAgendamentoInput,
  type HorariosLivresQuery,
  type RemarcarAgendamentoInput,
} from '@salonflow/shared';
import { UsuarioAtual } from '../../shared/auth/decorators.js';
import type { UsuarioAutenticado } from '../../shared/auth/usuario-autenticado.js';
import { ZodValidationPipe } from '../../shared/http/zod-validation.pipe.js';
import { RotaDoSalao } from '../../shared/tenant/rota-do-salao.decorator.js';
import { paraAgendamentoAgenda } from './agenda.mapper.js';
import { AgendaService } from './agenda.service.js';

/** Visão da agenda e horários livres (painel do salão). */
@RotaDoSalao('DONO', 'RECEPCAO')
@Controller('agenda')
export class AgendaController {
  constructor(private readonly service: AgendaService) {}

  /** GET /agenda?data=AAAA-MM-DD */
  @Get()
  agendaDoDia(@Query('data', new ZodValidationPipe(dataLocalSchema)) data: string) {
    return this.service.agendaDoDia(data);
  }

  /** GET /agenda/horarios-livres?servicoId=&data=&profissionalId= */
  @Get('horarios-livres')
  horariosLivres(
    @Query(new ZodValidationPipe(horariosLivresQuerySchema)) query: HorariosLivresQuery,
  ) {
    return this.service.horariosLivres(query);
  }
}

/** Criação e manutenção de agendamentos pela equipe. */
@RotaDoSalao('DONO', 'RECEPCAO')
@Controller('agendamentos')
export class AgendamentosController {
  constructor(private readonly service: AgendaService) {}

  @Post()
  async criar(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Body(new ZodValidationPipe(criarAgendamentoSchema)) dados: CriarAgendamentoInput,
  ) {
    return paraAgendamentoAgenda(await this.service.criar(dados, usuario.id));
  }

  @Patch(':id/remarcar')
  async remarcar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(remarcarAgendamentoSchema)) dados: RemarcarAgendamentoInput,
  ) {
    return paraAgendamentoAgenda(await this.service.remarcar(id, dados));
  }

  @Patch(':id/status')
  async alterarStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(alterarStatusAgendamentoSchema))
    dados: AlterarStatusAgendamentoInput,
  ) {
    return paraAgendamentoAgenda(await this.service.alterarStatus(id, dados));
  }
}
