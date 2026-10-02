import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validarEnv } from './config/env.js';
import { AuthModule } from './shared/auth/auth.module.js';
import { DatabaseModule } from './shared/database/database.module.js';
import { TenantModule } from './shared/tenant/tenant.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { ProfissionaisModule } from './modules/profissionais/profissionais.module.js';
import { SaloesModule } from './modules/saloes/saloes.module.js';
import { UsuariosModule } from './modules/usuarios/usuarios.module.js';

@Module({
  imports: [
    // Infraestrutura compartilhada
    ConfigModule.forRoot({ isGlobal: true, cache: true, validate: validarEnv }),
    DatabaseModule,
    TenantModule,
    AuthModule,

    // Módulos de negócio
    HealthModule,
    UsuariosModule,
    SaloesModule,
    ProfissionaisModule,
  ],
})
export class AppModule {}
