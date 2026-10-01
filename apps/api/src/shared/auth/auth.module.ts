import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from './auth.guard.js';
import { SupabaseTokenVerifier } from './supabase-token.verifier.js';

@Module({
  providers: [SupabaseTokenVerifier, { provide: APP_GUARD, useClass: AuthGuard }],
})
export class AuthModule {}
