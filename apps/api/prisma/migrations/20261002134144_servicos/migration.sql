-- CreateTable
CREATE TABLE "servicos" (
    "id" UUID NOT NULL,
    "salao_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" TEXT,
    "preco_centavos" INTEGER NOT NULL,
    "duracao_min" SMALLINT NOT NULL,
    "visivel_online" BOOLEAN NOT NULL DEFAULT true,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "servicos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicos_profissionais" (
    "servico_id" UUID NOT NULL,
    "profissional_id" UUID NOT NULL,
    "salao_id" UUID NOT NULL,
    "preco_centavos" INTEGER,
    "duracao_min" SMALLINT,

    CONSTRAINT "servicos_profissionais_pkey" PRIMARY KEY ("servico_id","profissional_id")
);

-- CreateIndex
CREATE INDEX "servicos_salao_id_ativo_idx" ON "servicos"("salao_id", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "servicos_salao_id_nome_key" ON "servicos"("salao_id", "nome");

-- CreateIndex
CREATE INDEX "servicos_profissionais_profissional_id_idx" ON "servicos_profissionais"("profissional_id");

-- AddForeignKey
ALTER TABLE "servicos" ADD CONSTRAINT "servicos_salao_id_fkey" FOREIGN KEY ("salao_id") REFERENCES "saloes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicos_profissionais" ADD CONSTRAINT "servicos_profissionais_servico_id_fkey" FOREIGN KEY ("servico_id") REFERENCES "servicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicos_profissionais" ADD CONSTRAINT "servicos_profissionais_profissional_id_fkey" FOREIGN KEY ("profissional_id") REFERENCES "profissionais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicos_profissionais" ADD CONSTRAINT "servicos_profissionais_salao_id_fkey" FOREIGN KEY ("salao_id") REFERENCES "saloes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
