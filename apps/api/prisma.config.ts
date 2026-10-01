import 'dotenv/config';
import { defineConfig } from 'prisma/config';

// A CLI do Prisma (migrate, studio) usa a conexão DIRETA com o banco.
// A aplicação em execução usa DATABASE_URL (pooler do Supabase) — ver PrismaService.
// O fallback vazio permite rodar `prisma generate` em ambientes sem banco (ex.: build na Vercel).
export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DIRECT_URL ?? '',
  },
});
