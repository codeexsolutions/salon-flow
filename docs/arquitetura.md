# Arquitetura do SalonFlow

## Visão geral

```
Celular / navegador
      │
      ▼
Vercel ── apps/web (Next.js)  →  /admin (painel do salão) · /pro (app do profissional) · / (app do cliente)
      │  HTTPS + token do Supabase + header x-salao-id
      ▼
Railway ── apps/api (NestJS, em camadas) ── Redis (filas e lembretes, futuro)
      │
      ▼
Supabase ── Postgres + Auth (login) + Storage (fotos)
```

- **Supabase Auth** diz _quem_ é o usuário. **A API** decide _o que_ ele pode fazer.
- O front **nunca** acessa o banco direto: todo dado de negócio passa pela API.
- `packages/shared` guarda os tipos, enums e schemas Zod usados pelos dois lados.

## Camadas da API

Cada módulo de negócio (`apps/api/src/modules/<modulo>`) tem as mesmas camadas:

| Camada         | Arquivo                          | Responsabilidade                                                    | Pode usar                                                     |
| -------------- | -------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------- |
| Apresentação   | `*.controller.ts`, `*.mapper.ts` | HTTP, validação da entrada (Zod), formato da resposta               | Service do próprio módulo                                     |
| Aplicação      | `*.service.ts`                   | Casos de uso, transações, orquestração                              | Repository do módulo, domínio, **services** de outros módulos |
| Domínio        | `domain/*.ts`                    | Regras de negócio puras (cálculo de comissão, conflito de horário…) | Nada de Nest/Prisma/HTTP                                      |
| Infraestrutura | `*.repository.ts`                | Acesso ao banco (Prisma)                                            | `PrismaService`                                               |

Regras:

1. **Cada camada só conhece a de baixo.** Controller não acessa repository; service não conhece HTTP.
2. **Módulos se falam por services**, nunca pelo repository do outro.
3. **`PrismaService` só é injetado em repositories.**
4. Erros de negócio são lançados como `DomainError` (`shared/errors`); o filtro global converte para HTTP.
5. Regras de domínio têm teste unitário (`*.spec.ts` ao lado do arquivo).

O módulo `saloes` é a referência: copie a estrutura dele ao criar um módulo novo.

## Multi-tenant (vários salões)

- Toda tabela que pertence a um salão tem `salaoId`.
- O front envia o salão ativo no header `x-salao-id`.
- `@RotaDoSalao()` (ou `@RotaDoSalao('DONO', 'RECEPCAO')`) no controller:
  1. confere se o usuário logado tem vínculo ativo com o salão;
  2. confere se o papel dele é permitido na rota;
  3. grava salão e papel no `ContextoSalao`.
- Services/repositories leem `contexto.salaoId` e **sempre** filtram por ele.
- Rotas do cliente (marketplace) não usam `@RotaDoSalao`: filtram pelo próprio usuário.

## Autenticação

- Login no front via Supabase (Google ou link mágico por e-mail).
- O front manda `Authorization: Bearer <access_token>` para a API.
- `AuthGuard` (global) valida o token pelas chaves públicas do Supabase (JWKS).
- Toda rota exige login, exceto as marcadas com `@Publica()`.
- O usuário é gravado/atualizado na tabela `usuarios` no primeiro acesso (`UsuariosService.garantirCadastro`).

## Front (apps/web)

| Área                         | Rota                                   | Público         | Manifest PWA                     |
| ---------------------------- | -------------------------------------- | --------------- | -------------------------------- |
| App do cliente / marketplace | `/`, `/s/[slug]`, `/meus-agendamentos` | Clientes        | `/manifests/cliente.webmanifest` |
| Painel do salão              | `/admin/*`                             | Dono e recepção | `/manifests/admin.webmanifest`   |
| App do profissional          | `/pro/*`                               | Profissionais   | `/manifests/pro.webmanifest`     |

Cada área tem o próprio layout e manifest, então pode ser instalada no celular como um app separado.
Toda chamada à API passa por `src/lib/api/client.ts`.

## Módulos planejados

| Módulo                                                     | Status  |
| ---------------------------------------------------------- | ------- |
| health, usuarios, saloes                                   | ✅ base |
| profissionais (jornada, folgas, convite por e-mail)        | ✅      |
| servicos (preço, duração, profissionais; ficha técnica ⏳) | ✅      |
| clientes (ficha do cliente por salão)                      | ⏳      |
| agendamentos (disponibilidade, conflito)                   | ⏳      |
| comandas, caixa                                            | ⏳      |
| comissoes (regras configuráveis, repasse salão-parceiro)   | ⏳      |
| estoque, fornecedores                                      | ⏳      |
| financeiro                                                 | ⏳      |
| marketplace (busca, favoritos, avaliações)                 | ⏳      |
| notificacoes (web push, e-mail, lembretes)                 | ⏳      |
