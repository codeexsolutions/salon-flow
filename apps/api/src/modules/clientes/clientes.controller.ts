import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { criarClienteSchema, type CriarClienteInput } from '@salonflow/shared';
import { ZodValidationPipe } from '../../shared/http/zod-validation.pipe.js';
import { RotaDoSalao } from '../../shared/tenant/rota-do-salao.decorator.js';
import { paraClienteResumo } from './clientes.mapper.js';
import { ClientesService } from './clientes.service.js';

@RotaDoSalao('DONO', 'RECEPCAO')
@Controller('clientes')
export class ClientesController {
  constructor(private readonly service: ClientesService) {}

  /** ?busca=texto procura por nome, telefone ou e-mail. */
  @Get()
  async buscar(@Query('busca') busca?: string) {
    const clientes = await this.service.buscar(busca);
    return clientes.map(paraClienteResumo);
  }

  @Post()
  async criar(@Body(new ZodValidationPipe(criarClienteSchema)) dados: CriarClienteInput) {
    return paraClienteResumo(await this.service.criar(dados));
  }
}
