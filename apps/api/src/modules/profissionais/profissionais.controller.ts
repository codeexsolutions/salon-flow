import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  atualizarProfissionalSchema,
  criarBloqueioSchema,
  criarProfissionalSchema,
  definirJornadaSchema,
  type AtualizarProfissionalInput,
  type CriarBloqueioInput,
  type CriarProfissionalInput,
  type DefinirJornadaInput,
} from '@salonflow/shared';
import { ZodValidationPipe } from '../../shared/http/zod-validation.pipe.js';
import { RotaDoSalao, SomentePapeis } from '../../shared/tenant/rota-do-salao.decorator.js';
import {
  paraBloqueio,
  paraProfissionalDetalhe,
  paraProfissionalResumo,
} from './profissionais.mapper.js';
import { ProfissionaisService } from './profissionais.service.js';

/** Gestão da equipe. Dono e recepção consultam e ajustam agenda; só o dono cadastra/edita. */
@RotaDoSalao('DONO', 'RECEPCAO')
@Controller('profissionais')
export class ProfissionaisController {
  constructor(private readonly service: ProfissionaisService) {}

  @Get()
  async listar(@Query('incluirInativos') incluirInativos?: string) {
    const lista = await this.service.listar(incluirInativos === 'true');
    return lista.map(paraProfissionalResumo);
  }

  @SomentePapeis('DONO')
  @Post()
  async criar(@Body(new ZodValidationPipe(criarProfissionalSchema)) dados: CriarProfissionalInput) {
    return paraProfissionalResumo(await this.service.criar(dados));
  }

  @Get(':id')
  async buscar(@Param('id', ParseUUIDPipe) id: string) {
    return paraProfissionalDetalhe(await this.service.buscar(id));
  }

  @SomentePapeis('DONO')
  @Patch(':id')
  async atualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(atualizarProfissionalSchema)) dados: AtualizarProfissionalInput,
  ) {
    return paraProfissionalResumo(await this.service.atualizar(id, dados));
  }

  @Put(':id/jornada')
  async definirJornada(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(definirJornadaSchema)) dados: DefinirJornadaInput,
  ) {
    return paraProfissionalDetalhe(await this.service.definirJornada(id, dados));
  }

  /** Folgas e bloqueios atuais e futuros. */
  @Get(':id/bloqueios')
  async listarBloqueios(@Param('id', ParseUUIDPipe) id: string) {
    const bloqueios = await this.service.listarBloqueios(id);
    return bloqueios.map(paraBloqueio);
  }

  @Post(':id/bloqueios')
  async criarBloqueio(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(criarBloqueioSchema)) dados: CriarBloqueioInput,
  ) {
    return paraBloqueio(await this.service.criarBloqueio(id, dados));
  }

  @HttpCode(204)
  @Delete(':id/bloqueios/:bloqueioId')
  async removerBloqueio(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('bloqueioId', ParseUUIDPipe) bloqueioId: string,
  ) {
    await this.service.removerBloqueio(id, bloqueioId);
  }
}
