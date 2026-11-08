-- CreateEnum
CREATE TYPE "FormaMovimentoCaixa" AS ENUM ('DINHEIRO', 'PIX', 'CREDITO', 'DEBITO', 'VALE');

-- AlterTable
ALTER TABLE "movimentos_caixa" ADD COLUMN     "forma" "FormaMovimentoCaixa" NOT NULL DEFAULT 'DINHEIRO';
