-- CreateEnum
CREATE TYPE "Papel" AS ENUM ('DONO', 'RECEPCAO', 'PROFISSIONAL');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "nome" TEXT,
    "avatar_url" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "saloes" (
    "id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "telefone" TEXT,
    "cidade" TEXT,
    "uf" CHAR(2),
    "visivel_no_marketplace" BOOLEAN NOT NULL DEFAULT true,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saloes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "membros_salao" (
    "id" UUID NOT NULL,
    "salao_id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "papel" "Papel" NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "membros_salao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "saloes_slug_key" ON "saloes"("slug");

-- CreateIndex
CREATE INDEX "saloes_cidade_uf_idx" ON "saloes"("cidade", "uf");

-- CreateIndex
CREATE INDEX "membros_salao_usuario_id_idx" ON "membros_salao"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "membros_salao_salao_id_usuario_id_key" ON "membros_salao"("salao_id", "usuario_id");

-- AddForeignKey
ALTER TABLE "membros_salao" ADD CONSTRAINT "membros_salao_salao_id_fkey" FOREIGN KEY ("salao_id") REFERENCES "saloes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "membros_salao" ADD CONSTRAINT "membros_salao_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
