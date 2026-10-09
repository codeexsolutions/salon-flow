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

Produção usa o **mesmo projeto Supabase** do desenvolvimento (banco, Auth e Storage já configurados).
A cada `git push` na `main`, Railway e Vercel publicam sozinhos.

**Supabase** (já feito neste projeto; só confira)

1. Authentication > Sign In / Providers > Email: habilitado, com **Confirm email DESLIGADO**.
   O login é por **usuário e senha**: cada usuário vira o e-mail interno `usuario@salonflow.invalid`
   (domínio reservado, nunca recebe mensagens), então não há e-mails a confirmar nem SMTP a configurar.
2. `apps/api/prisma/supabase/storage.sql` já aplicado (bucket de imagens; só o dono envia).
3. Depois do deploy: Authentication > URL Configuration > **Site URL** = URL da Vercel.

**1º Railway (API)**

1. New Project > Deploy from GitHub repo > `codeexsolutions/salon-flow`.
2. Settings: **sem** Root Directory e **sem** Config file path (o Railway lê o `railway.json`
   da raiz; o build precisa do monorepo); Region: **US West** (perto do Supabase us-west-2).
3. Variables (mesmos valores do `apps/api/.env`):
   - `DATABASE_URL` (pooler, porta 6543) e `DIRECT_URL` (pooler "Session", porta 5432 — IPv4,
     usado pelas migrações no pre-deploy)
   - `SUPABASE_URL`, `SUPABASE_SECRET_KEY` (sb_secret_..., nunca vai para o front)
   - `NODE_ENV=production`
   - `CORS_ORIGINS` = URL da Vercel (preencha depois do passo da Vercel)
   - **Não** defina `PORT`: o Railway injeta.
4. Settings > Networking > **Generate Domain**. Teste: `https://<api>.up.railway.app/health`.

**2º Vercel (web)**

1. Add New > Project > importe `codeexsolutions/salon-flow`; **Root Directory** `apps/web`
   (framework Next.js; o build vem do `apps/web/vercel.json`).
2. Environment Variables: `NEXT_PUBLIC_API_URL` (URL do Railway, sem barra no fim),
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Deploy. Volte ao Railway e coloque a URL da Vercel em `CORS_ORIGINS`.

Domínio próprio (ex.: `app.salonflow.com.br` / `api.salonflow.com.br`) pode ser ligado depois;
lembre de atualizar `NEXT_PUBLIC_API_URL`, `CORS_ORIGINS` e a Site URL do Supabase.
