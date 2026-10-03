-- CreateTable
CREATE TABLE "convites_acesso" (
    "id" UUID NOT NULL,
    "salao_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "nome" TEXT,
    "papel" "Papel" NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "convites_acesso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "convites_acesso_email_idx" ON "convites_acesso"("email");

-- CreateIndex
CREATE UNIQUE INDEX "convites_acesso_salao_id_email_key" ON "convites_acesso"("salao_id", "email");

-- AddForeignKey
ALTER TABLE "convites_acesso" ADD CONSTRAINT "convites_acesso_salao_id_fkey" FOREIGN KEY ("salao_id") REFERENCES "saloes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
