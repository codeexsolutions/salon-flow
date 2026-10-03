-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "recuperacao_bloqueada_ate" TIMESTAMP(3),
ADD COLUMN     "recuperacao_hash" TEXT,
ADD COLUMN     "recuperacao_tentativas" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "telefone" TEXT;
