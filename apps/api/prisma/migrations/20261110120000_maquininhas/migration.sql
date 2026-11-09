-- AlterTable
ALTER TABLE "pagamentos" ADD COLUMN     "maquininha_id" UUID,
ADD COLUMN     "parcelas" SMALLINT;

-- CreateTable
CREATE TABLE "maquininhas" (
    "id" UUID NOT NULL,
    "salao_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "taxa_debito_bps" INTEGER NOT NULL DEFAULT 0,
    "taxas_credito_bps" INTEGER[],
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "maquininhas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "maquininhas_salao_id_nome_key" ON "maquininhas"("salao_id", "nome");

-- AddForeignKey
ALTER TABLE "pagamentos" ADD CONSTRAINT "pagamentos_maquininha_id_fkey" FOREIGN KEY ("maquininha_id") REFERENCES "maquininhas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maquininhas" ADD CONSTRAINT "maquininhas_salao_id_fkey" FOREIGN KEY ("salao_id") REFERENCES "saloes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

