import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth.guard.js';
import { SupabaseAdminService } from './supabase-admin.service.js';
import { SupabaseTokenVerifier } from './supabase-token.verifier.js';

@Global()
@Module({
  providers: [
    SupabaseTokenVerifier,
    SupabaseAdminService,
    { provide: APP_GUARD, useClass: AuthGuard },
  ],
  exports: [SupabaseAdminService],
})
export class AuthModule {}
