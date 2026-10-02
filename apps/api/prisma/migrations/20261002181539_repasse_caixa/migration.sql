-- CreateEnum
CREATE TYPE "StatusRepasse" AS ENUM ('PAGO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusCaixa" AS ENUM ('ABERTO', 'FECHADO');

-- CreateEnum
CREATE TYPE "TipoMovimentoCaixa" AS ENUM ('SANGRIA', 'REFORCO');

-- AlterTable
ALTER TABLE "comanda_itens" ADD COLUMN     "repasse_id" UUID;

-- AlterTable
ALTER TABLE "pagamentos" ADD COLUMN     "caixa_id" UUID;

-- CreateTable
CREATE TABLE "repasses" (
    "id" UUID NOT NULL,
    "salao_id" UUID NOT NULL,
    "profissional_id" UUID NOT NULL,
    "de" TEXT NOT NULL,
    "ate" TEXT NOT NULL,
    "status" "StatusRepasse" NOT NULL DEFAULT 'PAGO',
    "total_servicos_centavos" INTEGER NOT NULL,
    "total_comissao_centavos" INTEGER NOT NULL,
    "descontos_centavos" INTEGER NOT NULL DEFAULT 0,
    "valor_pago_centavos" INTEGER NOT NULL,
    "forma_pagamento" "FormaPagamento",
    "observacoes" TEXT,
    "pago_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por_id" UUID,
    "cancelado_em" TIMESTAMP(3),

    CONSTRAINT "repasses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "caixas" (
    "id" UUID NOT NULL,
    "salao_id" UUID NOT NULL,
    "status" "StatusCaixa" NOT NULL DEFAULT 'ABERTO',
    "troco_inicial_centavos" INTEGER NOT NULL,
    "aberto_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aberto_por_id" UUID,
    "fechado_em" TIMESTAMP(3),
    "fechado_por_id" UUID,
    "esperado_dinheiro_centavos" INTEGER,
    "contado_dinheiro_centavos" INTEGER,
    "diferenca_centavos" INTEGER,
    "observacoes" TEXT,

    CONSTRAINT "caixas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentos_caixa" (
    "id" UUID NOT NULL,
    "caixa_id" UUID NOT NULL,
    "salao_id" UUID NOT NULL,
    "tipo" "TipoMovimentoCaixa" NOT NULL,
    "valor_centavos" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL,
    "criado_por_id" UUID,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentos_caixa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "repasses_salao_id_profissional_id_idx" ON "repasses"("salao_id", "profissional_id");

-- CreateIndex
CREATE INDEX "caixas_salao_id_status_idx" ON "caixas"("salao_id", "status");

-- CreateIndex
CREATE INDEX "caixas_salao_id_aberto_em_idx" ON "caixas"("salao_id", "aberto_em");

-- CreateIndex
CREATE INDEX "movimentos_caixa_caixa_id_idx" ON "movimentos_caixa"("caixa_id");

-- CreateIndex
CREATE INDEX "comanda_itens_repasse_id_idx" ON "comanda_itens"("repasse_id");

-- CreateIndex
CREATE INDEX "pagamentos_caixa_id_idx" ON "pagamentos"("caixa_id");

-- AddForeignKey
ALTER TABLE "comanda_itens" ADD CONSTRAINT "comanda_itens_repasse_id_fkey" FOREIGN KEY ("repasse_id") REFERENCES "repasses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_caixa_id_fkey" FOREIGN KEY ("caixa_id") REFERENCES "caixas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repasses" ADD CONSTRAINT "repasses_salao_id_fkey" FOREIGN KEY ("salao_id") REFERENCES "saloes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "repasses" ADD CONSTRAINT "repasses_profissional_id_fkey" FOREIGN KEY ("profissional_id") REFERENCES "profissionais"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "caixas" ADD CONSTRAINT "caixas_salao_id_fkey" FOREIGN KEY ("salao_id") REFERENCES "saloes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_caixa" ADD CONSTRAINT "movimentos_caixa_caixa_id_fkey" FOREIGN KEY ("caixa_id") REFERENCES "caixas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_caixa" ADD CONSTRAINT "movimentos_caixa_salao_id_fkey" FOREIGN KEY ("salao_id") REFERENCES "saloes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
