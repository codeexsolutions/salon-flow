-- AlterTable
ALTER TABLE "comandas" ADD COLUMN     "competencia_em" TIMESTAMP(3),
ADD COLUMN     "lancada_em" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "caixas" ADD COLUMN     "lancado_depois" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "reaberturas_comanda" (
    "id" UUID NOT NULL,
    "comanda_id" UUID NOT NULL,
    "salao_id" UUID NOT NULL,
    "motivo" TEXT NOT NULL,
    "reaberta_por_id" UUID,
    "reaberta_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechada_em_anterior" TIMESTAMP(3) NOT NULL,
    "total_anterior_centavos" INTEGER NOT NULL,
    "fechamento_anterior" JSONB NOT NULL,

    CONSTRAINT "reaberturas_comanda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reaberturas_comanda_comanda_id_idx" ON "reaberturas_comanda"("comanda_id");

-- AddForeignKey
ALTER TABLE "reaberturas_comanda" ADD CONSTRAINT "reaberturas_comanda_comanda_id_fkey" FOREIGN KEY ("comanda_id") REFERENCES "comandas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reaberturas_comanda" ADD CONSTRAINT "reaberturas_comanda_salao_id_fkey" FOREIGN KEY ("salao_id") REFERENCES "saloes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

