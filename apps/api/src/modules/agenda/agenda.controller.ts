import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  agendarPeloAppSchema,
  alterarStatusAgendamentoSchema,
  criarAgendamentoSchema,
  dataLocalSchema,
  horariosLivresQuerySchema,
  remarcarAgendamentoSchema,
  type AgendarPeloAppInput,
  type AlterarStatusAgendamentoInput,
  type CriarAgendamentoInput,
  type HorariosLivresQuery,
  type RemarcarAgendamentoInput,
} from '@salonflow/shared';
import { Publica, UsuarioAtual } from '../../shared/auth/decorators.js';
import type { UsuarioAutenticado } from '../../shared/auth/usuario-autenticado.js';
import { ZodValidationPipe } from '../../shared/http/zod-validation.pipe.js';
import { RotaDoSalao } from '../../shared/tenant/rota-do-salao.decorator.js';
import { SalaoPublicoGuard } from '../../shared/tenant/salao-publico.guard.js';
import { ServicosService } from '../servicos/servicos.service.js';
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

/**
 * Página pública do salão (/s/:slug): catálogo e horários sem login;
 * agendar exige login (qualquer usuário — vira cliente do salão).
 */
@UseGuards(SalaoPublicoGuard)
@Controller('publico/saloes/:slug')
export class AgendaPublicaController {
  constructor(
    private readonly service: AgendaService,
    private readonly servicos: ServicosService,
  ) {}

  @Publica()
  @Get('servicos')
  catalogo() {
    return this.servicos.catalogoOnline();
  }

  @Publica()
  @Get('horarios-livres')
  horariosLivres(
    @Query(new ZodValidationPipe(horariosLivresQuerySchema)) query: HorariosLivresQuery,
  ) {
    return this.service.horariosLivres(query, true);
  }

  @Post('agendamentos')
  async agendar(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Body(new ZodValidationPipe(agendarPeloAppSchema)) dados: AgendarPeloAppInput,
  ) {
    return paraAgendamentoAgenda(await this.service.agendarPeloApp(usuario, dados));
  }
}

/** Agendamentos do cliente logado, em todos os salões. */
@Controller('me/agendamentos')
export class MeusAgendamentosController {
  constructor(private readonly service: AgendaService) {}

  @Get()
  listar(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return this.service.meusAgendamentos(usuario.id);
  }

  @HttpCode(204)
  @Patch(':id/cancelar')
  async cancelar(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.service.cancelarPeloCliente(usuario.id, id);
  }
}

/** App do profissional: a própria agenda. */
@RotaDoSalao()
@Controller('pro/agenda')
export class ProAgendaController {
  constructor(private readonly service: AgendaService) {}

  @Get()
  agenda(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Query('data', new ZodValidationPipe(dataLocalSchema)) data: string,
  ) {
    return this.service.agendaDoProfissional(usuario.id, data);
  }
}
