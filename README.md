# SalonFlow

Plataforma SaaS para salões de beleza e barbearias:

- **Painel do salão** (web): agenda, comandas, comissões, estoque, financeiro.
- **App do profissional** (PWA): agenda própria, comissões e valores a receber.
- **App do cliente** (PWA / marketplace): encontrar salões, agendar, remarcar e cancelar.

Detalhes da arquitetura em [docs/arquitetura.md](docs/arquitetura.md).

## Estrutura

```
salonflow/
├── apps/
│   ├── api/          NestJS (camadas) + Prisma        → Railway
│   └── web/          Next.js (admin, pro, cliente)    → Vercel
├── packages/
│   └── shared/       tipos, enums e schemas Zod compartilhados
├── docs/
└── docker-compose.yml  Postgres + Redis para desenvolvimento local
```

## Requisitos

- Node.js 24+
- Docker Desktop (banco local), ou um projeto Supabase

## Primeiros passos

```bash
npm install

# variáveis de ambiente
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# banco local
npm run db:up
npm run db:migrate          # aplica as migrations (nova: npm run db:migrate -- --name nome)

# sobe API (http://localhost:3333) e web (http://localhost:3000)
npm run dev
```

## Scripts (raiz)

| Script                               | O que faz                            |
| ------------------------------------ | ------------------------------------ |
| `npm run dev`                        | API + web + shared em modo watch     |
| `npm run build`                      | Build de tudo                        |
| `npm run test`                       | Testes unitários                     |
| `npm run lint` / `npm run typecheck` | Qualidade de código                  |
| `npm run db:up` / `db:down`          | Sobe/derruba Postgres e Redis locais |
| `npm run db:migrate`                 | `prisma migrate dev`                 |
| `npm run db:studio`                  | Prisma Studio (visualizar o banco)   |

Testes e2e da API (precisam do banco no ar): `npm run test:e2e -w @salonflow/api`.

## Deploy

**Supabase**

1. Crie o projeto (região: a mesma da API no Railway).
2. Authentication > Providers > Email: habilitado, com **Confirm email DESLIGADO**.
   O login é por **usuário e senha**: cada usuário vira o e-mail interno `usuario@salonflow.invalid`
   (domínio reservado, nunca recebe mensagens), então não há e-mails a confirmar nem SMTP a configurar.
3. Pegue as connection strings (pooler "Session" e direta) e a Publishable key.
4. No SQL Editor, rode `apps/api/prisma/supabase/storage.sql` (bucket de imagens dos salões e políticas: só o dono envia).

**Railway (API)**

1. Novo serviço a partir do repositório, **sem** Root Directory (o build precisa do monorepo inteiro).
2. Config file path: `apps/api/railway.json`.
3. Variáveis: `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `CORS_ORIGINS`, `NODE_ENV=production`.
   `SUPABASE_SECRET_KEY` (sb_secret_...) habilita a troca de senha: recuperação com código e
   senha nova dada pelo salão. Nunca vai para o front.
4. Domínio: `api.salonflow.com.br`.

**Vercel (web)**

1. Importe o repositório com Root Directory `apps/web`.
2. Variáveis: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Domínio: `app.salonflow.com.br`.
