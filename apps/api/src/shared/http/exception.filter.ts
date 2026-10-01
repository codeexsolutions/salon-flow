import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import type { ApiErro } from '@salonflow/shared';
import { DomainError } from '../errors/domain.error.js';

/** Converte qualquer erro no formato padrão `ApiErro`. */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const corpo = this.toApiErro(exception);
    res.status(corpo.statusCode).json(corpo);
  }

  private toApiErro(exception: unknown): ApiErro {
    if (exception instanceof DomainError) {
      return {
        statusCode: exception.statusCode,
        codigo: exception.codigo,
        mensagem: exception.message,
        detalhes: exception.detalhes,
      };
    }

    if (exception instanceof HttpException) {
      const resposta = exception.getResponse();
      const corpo = typeof resposta === 'object' ? (resposta as Record<string, unknown>) : {};
      return {
        statusCode: exception.getStatus(),
        codigo: (corpo.codigo as string) ?? HttpStatus[exception.getStatus()] ?? 'ERRO',
        mensagem: (corpo.mensagem as string) ?? exception.message,
        detalhes: corpo.detalhes,
      };
    }

    this.logger.error(exception);
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      codigo: 'ERRO_INTERNO',
      mensagem: 'Erro interno do servidor',
    };
  }
}
