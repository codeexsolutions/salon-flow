import { Controller, Get, Query } from '@nestjs/common';
import { dataLocalSchema } from '@salonflow/shared';
import { z } from 'zod';
import { ZodValidationPipe } from '../../shared/http/zod-validation.pipe.js';
import { ExigePermissao, RotaDoSalao } from '../../shared/tenant/rota-do-salao.decorator.js';
import { FaturamentoService } from './faturamento.service.js';

const periodoSchema = z.object({ de: dataLocalSchema, ate: dataLocalSchema });
type Periodo = z.infer<typeof periodoSchema>;

/** Relatório de faturamento — só o dono. */
@RotaDoSalao()
@ExigePermissao('FATURAMENTO')
@Controller('faturamento')
export class FaturamentoController {
  constructor(private readonly service: FaturamentoService) {}

  /** GET /faturamento?de=AAAA-MM-DD&ate=AAAA-MM-DD */
  @Get()
  relatorio(@Query(new ZodValidationPipe(periodoSchema)) { de, ate }: Periodo) {
    return this.service.relatorio(de, ate);
  }
}
