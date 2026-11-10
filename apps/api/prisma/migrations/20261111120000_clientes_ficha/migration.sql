-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "nascimento" DATE,
ADD COLUMN     "recebe_notificacoes" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "anotacoes_cliente" (
    "id" UUID NOT NULL,
    "salao_id" UUID NOT NULL,
    "cliente_id" UUID NOT NULL,
    "profissional_id" UUID,
    "servico_id" UUID,
    "data" DATE NOT NULL,
    "texto" TEXT NOT NULL,
    "autor_id" UUID,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anotacoes_cliente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "anotacoes_cliente_salao_id_cliente_id_data_idx" ON "anotacoes_cliente"("salao_id", "cliente_id", "data");

-- AddForeignKey
ALTER TABLE "anotacoes_cliente" ADD CONSTRAINT "anotacoes_cliente_salao_id_fkey" FOREIGN KEY ("salao_id") REFERENCES "saloes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anotacoes_cliente" ADD CONSTRAINT "anotacoes_cliente_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anotacoes_cliente" ADD CONSTRAINT "anotacoes_cliente_profissional_id_fkey" FOREIGN KEY ("profissional_id") REFERENCES "profissionais"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anotacoes_cliente" ADD CONSTRAINT "anotacoes_cliente_servico_id_fkey" FOREIGN KEY ("servico_id") REFERENCES "servicos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

