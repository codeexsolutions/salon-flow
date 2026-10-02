-- CreateEnum
CREATE TYPE "FormaPagamento" AS ENUM ('DINHEIRO', 'PIX', 'DEBITO', 'CREDITO', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusComanda" AS ENUM ('ABERTA', 'FECHADA', 'CANCELADA');

-- AlterTable
ALTER TABLE "saloes" ADD COLUMN     "comissao_padrao_bps" INTEGER NOT NULL DEFAULT 5000,
ADD COLUMN     "comissao_sobre_liquido" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "taxas_pagamento" (
    "id" UUID NOT NULL,
    "salao_id" UUID NOT NULL,
    "forma" "FormaPagamento" NOT NULL,
    "taxa_bps" INTEGER NOT NULL,

    CONSTRAINT "taxas_pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "regras_comissao" (
    "id" UUID NOT NULL,
    "salao_id" UUID NOT NULL,
    "profissional_id" UUID,
    "servico_id" UUID,
    "percentual_bps" INTEGER NOT NULL,

    CONSTRAINT "regras_comissao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comandas" (
    "id" UUID NOT NULL,
    "salao_id" UUID NOT NULL,
    "numero" INTEGER NOT NULL,
    "cliente_id" UUID,
    "status" "StatusComanda" NOT NULL DEFAULT 'ABERTA',
    "desconto_centavos" INTEGER NOT NULL DEFAULT 0,
    "subtotal_centavos" INTEGER,
    "total_centavos" INTEGER,
    "observacoes" TEXT,
    "aberta_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aberta_por_id" UUID,
    "fechada_em" TIMESTAMP(3),
    "fechada_por_id" UUID,

    CONSTRAINT "comandas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comanda_itens" (
    "id" UUID NOT NULL,
    "comanda_id" UUID NOT NULL,
    "salao_id" UUID NOT NULL,
    "servico_id" UUID NOT NULL,
    "profissional_id" UUID NOT NULL,
    "agendamento_id" UUID,
    "descricao" TEXT NOT NULL,
    "valor_centavos" INTEGER NOT NULL,
    "desconto_rateado_centavos" INTEGER,
    "taxa_rateada_centavos" INTEGER,
    "base_comissao_centavos" INTEGER,
    "comissao_bps" INTEGER,
    "comissao_centavos" INTEGER,

    CONSTRAINT "comanda_itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamentos" (
    "id" UUID NOT NULL,
    "comanda_id" UUID NOT NULL,
    "salao_id" UUID NOT NULL,
    "forma" "FormaPagamento" NOT NULL,
    "valor_centavos" INTEGER NOT NULL,
    "taxa_bps" INTEGER NOT NULL DEFAULT 0,
    "taxa_centavos" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "pagamentos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "taxas_pagamento_salao_id_forma_key" ON "taxas_pagamento"("salao_id", "forma");

-- CreateIndex
CREATE INDEX "regras_comissao_salao_id_idx" ON "regras_comissao"("salao_id");

-- CreateIndex
CREATE INDEX "comandas_salao_id_status_idx" ON "comandas"("salao_id", "status");

-- CreateIndex
CREATE INDEX "comandas_salao_id_fechada_em_idx" ON "comandas"("salao_id", "fechada_em");

-- CreateIndex
CREATE UNIQUE INDEX "comandas_salao_id_numero_key" ON "comandas"("salao_id", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "comanda_itens_agendamento_id_key" ON "comanda_itens"("agendamento_id");

-- CreateIndex
CREATE INDEX "comanda_itens_comanda_id_idx" ON "comanda_itens"("comanda_id");

-- CreateIndex
CREATE INDEX "comanda_itens_salao_id_profissional_id_idx" ON "comanda_itens"("salao_id", "profissional_id");

-- CreateIndex
CREATE INDEX "pagamentos_comanda_id_idx" ON "pagamentos"("comanda_id");

-- AddForeignKey
ALTER TABLE "taxas_pagamento" ADD CONSTRAINT "taxas_pagamento_salao_id_fkey" FOREIGN KEY ("salao_id") REFERENCES "saloes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regras_comissao" ADD CONSTRAINT "regras_comissao_salao_id_fkey" FOREIGN KEY ("salao_id") REFERENCES "saloes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regras_comissao" ADD CONSTRAINT "regras_comissao_profissional_id_fkey" FOREIGN KEY ("profissional_id") REFERENCES "profissionais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regras_comissao" ADD CONSTRAINT "regras_comissao_servico_id_fkey" FOREIGN KEY ("servico_id") REFERENCES "servicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comandas" ADD CONSTRAINT "comandas_salao_id_fkey" FOREIGN KEY ("salao_id") REFERENCES "saloes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comandas" ADD CONSTRAINT "comandas_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comanda_itens" ADD CONSTRAINT "comanda_itens_comanda_id_fkey" FOREIGN KEY ("comanda_id") REFERENCES "comandas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comanda_itens" ADD CONSTRAINT "comanda_itens_salao_id_fkey" FOREIGN KEY ("salao_id") REFERENCES "saloes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comanda_itens" ADD CONSTRAINT "comanda_itens_servico_id_fkey" FOREIGN KEY ("servico_id") REFERENCES "servicos"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comanda_itens" ADD CONSTRAINT "comanda_itens_profissional_id_fkey" FOREIGN KEY ("profissional_id") REFERENCES "profissionais"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comanda_itens" ADD CONSTRAINT "comanda_itens_agendamento_id_fkey" FOREIGN KEY ("agendamento_id") REFERENCES "agendamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_comanda_id_fkey" FOREIGN KEY ("comanda_id") REFERENCES "comandas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_salao_id_fkey" FOREIGN KEY ("salao_id") REFERENCES "saloes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
