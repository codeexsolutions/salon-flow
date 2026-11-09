-- CreateEnum
CREATE TYPE "StatusContrato" AS ENUM ('RASCUNHO', 'ATIVO', 'ENCERRADO');

-- CreateEnum
CREATE TYPE "PeriodicidadeRepasse" AS ENUM ('SEMANAL', 'QUINZENAL', 'MENSAL');

-- CreateEnum
CREATE TYPE "HomologacaoContrato" AS ENUM ('SINDICATO', 'MTE');

-- CreateTable
CREATE TABLE "contratos_parceria" (
    "id" UUID NOT NULL,
    "salao_id" UUID NOT NULL,
    "profissional_id" UUID NOT NULL,
    "status" "StatusContrato" NOT NULL DEFAULT 'RASCUNHO',
    "salao_razao_social" TEXT NOT NULL,
    "salao_documento" TEXT NOT NULL,
    "salao_endereco" TEXT NOT NULL,
    "profissional_nome" TEXT NOT NULL,
    "profissional_documento" TEXT NOT NULL,
    "profissional_mei" BOOLEAN NOT NULL DEFAULT false,
    "profissional_endereco" TEXT NOT NULL,
    "funcoes" TEXT[],
    "servico_ids" UUID[],
    "cota_profissional_bps" INTEGER NOT NULL,
    "periodicidade" "PeriodicidadeRepasse" NOT NULL,
    "inicio_em" DATE NOT NULL,
    "assinado_em" DATE,
    "homologacao" "HomologacaoContrato",
    "homologado_em" DATE,
    "testemunhas" JSONB NOT NULL DEFAULT '[]',
    "aviso_previo_em" DATE,
    "encerrado_em" DATE,
    "comum_acordo" BOOLEAN NOT NULL DEFAULT false,
    "motivo_encerramento" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contratos_parceria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "arquivos_contrato" (
    "contrato_id" UUID NOT NULL,
    "salao_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "tamanho" INTEGER NOT NULL,
    "conteudo" BYTEA NOT NULL,
    "enviado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "arquivos_contrato_pkey" PRIMARY KEY ("contrato_id")
);

-- CreateIndex
CREATE INDEX "contratos_parceria_salao_id_profissional_id_idx" ON "contratos_parceria"("salao_id", "profissional_id");

-- CreateIndex
CREATE INDEX "arquivos_contrato_salao_id_idx" ON "arquivos_contrato"("salao_id");

-- AddForeignKey
ALTER TABLE "contratos_parceria" ADD CONSTRAINT "contratos_parceria_salao_id_fkey" FOREIGN KEY ("salao_id") REFERENCES "saloes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contratos_parceria" ADD CONSTRAINT "contratos_parceria_profissional_id_fkey" FOREIGN KEY ("profissional_id") REFERENCES "profissionais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "arquivos_contrato" ADD CONSTRAINT "arquivos_contrato_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contratos_parceria"("id") ON DELETE CASCADE ON UPDATE CASCADE;

