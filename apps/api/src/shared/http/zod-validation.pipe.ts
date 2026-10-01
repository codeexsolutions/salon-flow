import { BadRequestException, PipeTransform } from '@nestjs/common';
import { z } from 'zod';

/**
 * Valida a entrada com um schema Zod (normalmente vindo de @salonflow/shared).
 * Uso: `@Body(new ZodValidationPipe(criarSalaoSchema)) dados: CriarSalaoInput`
 */
export class ZodValidationPipe<T extends z.ZodType> implements PipeTransform {
  constructor(private readonly schema: T) {}

  transform(valor: unknown): z.infer<T> {
    const resultado = this.schema.safeParse(valor);
    if (!resultado.success) {
      throw new BadRequestException({
        codigo: 'DADOS_INVALIDOS',
        mensagem: 'Dados inválidos',
        detalhes: z.flattenError(resultado.error).fieldErrors,
      });
    }
    return resultado.data;
  }
}
