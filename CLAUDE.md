# SalonFlow

Monorepo npm workspaces + Turborepo. Leia [docs/arquitetura.md](docs/arquitetura.md) antes de criar módulos.

- `apps/api`: NestJS 12 (ESM), Prisma 7 (client gerado em `src/generated/prisma`, imports com `.js`).
- `apps/web`: Next.js 16 — veja `apps/web/AGENTS.md` (ler docs em `node_modules/next/dist/docs/`).
- `packages/shared`: precisa de build (`dist/`) antes de API/web; o Turbo já cuida disso.

Convenções:

- Código de domínio em português (nomes de modelos, campos, métodos).
- Arquitetura em camadas por módulo; `modules/saloes` é o modelo de referência.
- Rotas de salão usam `@RotaDoSalao(...)`; repositories sempre filtram por `contexto.salaoId`.
- Validação de entrada com schemas Zod de `@salonflow/shared` + `ZodValidationPipe`.

Comandos: `npm run build | test | lint | typecheck` na raiz.
