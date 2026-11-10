-- CreateEnum
CREATE TYPE "TipoMovimentoPontos" AS ENUM ('GANHO', 'RESGATE', 'AJUSTE');

-- CreateTable
CREATE TABLE "programas_fidelidade" (
    "salao_id" UUID NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "centavos_por_ponto" INTEGER NOT NULL DEFAULT 100,
    "validade_meses" SMALLINT,
    "regras" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programas_fidelidade_pkey" PRIMARY KEY ("salao_id")
);

-- CreateTable
CREATE TABLE "premios_fidelidade" (
    "id" UUID NOT NULL,
    "salao_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "pontos" INTEGER NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "premios_fidelidade_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentos_pontos" (
    "id" UUID NOT NULL,
    "salao_id" UUID NOT NULL,
    "cliente_id" UUID NOT NULL,
    "tipo" "TipoMovimentoPontos" NOT NULL,
    "pontos" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "expira_em" TIMESTAMP(3),
    "comanda_id" UUID,
    "premio_id" UUID,
    "criado_por_id" UUID,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentos_pontos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "premios_fidelidade_salao_id_ativo_idx" ON "premios_fidelidade"("salao_id", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "movimentos_pontos_comanda_id_key" ON "movimentos_pontos"("comanda_id");

-- CreateIndex
CREATE INDEX "movimentos_pontos_salao_id_cliente_id_data_idx" ON "movimentos_pontos"("salao_id", "cliente_id", "data");

-- AddForeignKey
ALTER TABLE "programas_fidelidade" ADD CONSTRAINT "programas_fidelidade_salao_id_fkey" FOREIGN KEY ("salao_id") REFERENCES "saloes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "premios_fidelidade" ADD CONSTRAINT "premios_fidelidade_salao_id_fkey" FOREIGN KEY ("salao_id") REFERENCES "saloes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_pontos" ADD CONSTRAINT "movimentos_pontos_salao_id_fkey" FOREIGN KEY ("salao_id") REFERENCES "saloes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_pontos" ADD CONSTRAINT "movimentos_pontos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_pontos" ADD CONSTRAINT "movimentos_pontos_comanda_id_fkey" FOREIGN KEY ("comanda_id") REFERENCES "comandas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_pontos" ADD CONSTRAINT "movimentos_pontos_premio_id_fkey" FOREIGN KEY ("premio_id") REFERENCES "premios_fidelidade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

