-- CreateEnum
CREATE TYPE "TipoItemComanda" AS ENUM ('SERVICO', 'PRODUTO');

-- CreateEnum
CREATE TYPE "UnidadeProduto" AS ENUM ('UN', 'ML', 'G');

-- CreateEnum
CREATE TYPE "TipoMovimentoEstoque" AS ENUM ('ENTRADA', 'AJUSTE', 'CONSUMO', 'VENDA');

-- AlterTable
ALTER TABLE "comanda_itens" ADD COLUMN     "custo_produtos_centavos" INTEGER,
ADD COLUMN     "produto_id" UUID,
ADD COLUMN     "quantidade" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "tipo" "TipoItemComanda" NOT NULL DEFAULT 'SERVICO',
ALTER COLUMN "servico_id" DROP NOT NULL,
ALTER COLUMN "profissional_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "saloes" ADD COLUMN     "comissao_desconta_produtos" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "produtos" (
    "id" UUID NOT NULL,
    "salao_id" UUID NOT NULL,
    "nome" TEXT NOT NULL,
    "marca" TEXT,
    "unidade" "UnidadeProduto" NOT NULL DEFAULT 'UN',
    "tamanho_embalagem" INTEGER NOT NULL,
    "custo_embalagem_centavos" INTEGER NOT NULL,
    "preco_venda_centavos" INTEGER,
    "estoque_atual" INTEGER NOT NULL DEFAULT 0,
    "estoque_minimo" INTEGER,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimentos_estoque" (
    "id" UUID NOT NULL,
    "salao_id" UUID NOT NULL,
    "produto_id" UUID NOT NULL,
    "tipo" "TipoMovimentoEstoque" NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "observacao" TEXT,
    "comanda_item_id" UUID,
    "criado_por_id" UUID,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentos_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fichas_tecnicas" (
    "servico_id" UUID NOT NULL,
    "produto_id" UUID NOT NULL,
    "salao_id" UUID NOT NULL,
    "quantidade" INTEGER NOT NULL,

    CONSTRAINT "fichas_tecnicas_pkey" PRIMARY KEY ("servico_id","produto_id")
);

-- CreateIndex
CREATE INDEX "produtos_salao_id_ativo_idx" ON "produtos"("salao_id", "ativo");

-- CreateIndex
CREATE UNIQUE INDEX "produtos_salao_id_nome_key" ON "produtos"("salao_id", "nome");

-- CreateIndex
CREATE INDEX "movimentos_estoque_produto_id_criado_em_idx" ON "movimentos_estoque"("produto_id", "criado_em");

-- CreateIndex
CREATE INDEX "fichas_tecnicas_produto_id_idx" ON "fichas_tecnicas"("produto_id");

-- AddForeignKey
ALTER TABLE "comanda_itens" ADD CONSTRAINT "comanda_itens_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos" ADD CONSTRAINT "produtos_salao_id_fkey" FOREIGN KEY ("salao_id") REFERENCES "saloes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_estoque" ADD CONSTRAINT "movimentos_estoque_salao_id_fkey" FOREIGN KEY ("salao_id") REFERENCES "saloes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_estoque" ADD CONSTRAINT "movimentos_estoque_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentos_estoque" ADD CONSTRAINT "movimentos_estoque_comanda_item_id_fkey" FOREIGN KEY ("comanda_item_id") REFERENCES "comanda_itens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fichas_tecnicas" ADD CONSTRAINT "fichas_tecnicas_servico_id_fkey" FOREIGN KEY ("servico_id") REFERENCES "servicos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fichas_tecnicas" ADD CONSTRAINT "fichas_tecnicas_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fichas_tecnicas" ADD CONSTRAINT "fichas_tecnicas_salao_id_fkey" FOREIGN KEY ("salao_id") REFERENCES "saloes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
