import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  atualizarServicoSchema,
  criarServicoSchema,
  definirProfissionaisServicoSchema,
  type AtualizarServicoInput,
  type CriarServicoInput,
  type DefinirProfissionaisServicoInput,
} from '@salonflow/shared';
import { ZodValidationPipe } from '../../shared/http/zod-validation.pipe.js';
import { RotaDoSalao, SomentePapeis } from '../../shared/tenant/rota-do-salao.decorator.js';
import { paraServicoDetalhe, paraServicoResumo } from './servicos.mapper.js';
import { ServicosService } from './servicos.service.js';

/** Catálogo de serviços. Toda a equipe consulta; só o dono altera. */
@RotaDoSalao('DONO', 'RECEPCAO', 'PROFISSIONAL')
@Controller('servicos')
export class ServicosController {
  constructor(private readonly service: ServicosService) {}

  @Get()
  async listar(@Query('incluirInativos') incluirInativos?: string) {
    const lista = await this.service.listar(incluirInativos === 'true');
    return lista.map(paraServicoResumo);
  }

  @SomentePapeis('DONO')
  @Post()
  async criar(@Body(new ZodValidationPipe(criarServicoSchema)) dados: CriarServicoInput) {
    return paraServicoResumo(await this.service.criar(dados));
  }

  @Get(':id')
  async buscar(@Param('id', ParseUUIDPipe) id: string) {
    return paraServicoDetalhe(await this.service.buscar(id));
  }

  @SomentePapeis('DONO')
  @Patch(':id')
  async atualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(atualizarServicoSchema)) dados: AtualizarServicoInput,
  ) {
    return paraServicoResumo(await this.service.atualizar(id, dados));
  }

  /** Substitui a lista de profissionais que fazem o serviço. */
  @SomentePapeis('DONO')
  @Put(':id/profissionais')
  async definirProfissionais(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(definirProfissionaisServicoSchema))
    dados: DefinirProfissionaisServicoInput,
  ) {
    return paraServicoDetalhe(await this.service.definirProfissionais(id, dados));
  }
}
