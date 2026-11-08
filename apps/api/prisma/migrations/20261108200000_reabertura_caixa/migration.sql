-- CreateTable
CREATE TABLE "reaberturas_caixa" (
    "id" UUID NOT NULL,
    "caixa_id" UUID NOT NULL,
    "salao_id" UUID NOT NULL,
    "motivo" TEXT NOT NULL,
    "reaberto_por_id" UUID,
    "reaberto_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechado_em_anterior" TIMESTAMP(3) NOT NULL,
    "esperado_anterior_centavos" INTEGER NOT NULL,
    "contado_anterior_centavos" INTEGER NOT NULL,
    "diferenca_anterior_centavos" INTEGER NOT NULL,

    CONSTRAINT "reaberturas_caixa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reaberturas_caixa_caixa_id_idx" ON "reaberturas_caixa"("caixa_id");

-- AddForeignKey
ALTER TABLE "reaberturas_caixa" ADD CONSTRAINT "reaberturas_caixa_caixa_id_fkey" FOREIGN KEY ("caixa_id") REFERENCES "caixas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reaberturas_caixa" ADD CONSTRAINT "reaberturas_caixa_salao_id_fkey" FOREIGN KEY ("salao_id") REFERENCES "saloes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

