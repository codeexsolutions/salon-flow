import { Controller, Get } from '@nestjs/common';
import { Publica } from '../../shared/auth/decorators.js';

/** Usado pelo Railway (health check) para saber se a API está no ar. */
@Controller('health')
export class HealthController {
  @Publica()
  @Get()
  verificar() {
    return { status: 'ok', horario: new Date().toISOString() };
  }
}
