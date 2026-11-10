-- AlterTable
ALTER TABLE "agendamentos" ADD COLUMN     "lembrete_enviado_em" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "assinaturas_push" (
    "id" UUID NOT NULL,
    "usuario_id" UUID NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assinaturas_push_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "config_mensagens" (
    "salao_id" UUID NOT NULL,
    "lembrete_horas_antes" SMALLINT DEFAULT 24,
    "avaliacao_horas_depois" SMALLINT DEFAULT 2,
    "modelos" JSONB,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "config_mensagens_pkey" PRIMARY KEY ("salao_id")
);

-- CreateTable
CREATE TABLE "avaliacoes" (
    "id" UUID NOT NULL,
    "salao_id" UUID NOT NULL,
    "cliente_id" UUID NOT NULL,
    "comanda_id" UUID NOT NULL,
    "token" UUID NOT NULL,
    "pedir_em" TIMESTAMP(3) NOT NULL,
    "push_enviado_em" TIMESTAMP(3),
    "nota" SMALLINT,
    "comentario" TEXT,
    "respondida_em" TIMESTAMP(3),
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "avaliacoes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "assinaturas_push_endpoint_key" ON "assinaturas_push"("endpoint");

-- CreateIndex
CREATE INDEX "assinaturas_push_usuario_id_idx" ON "assinaturas_push"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "avaliacoes_comanda_id_key" ON "avaliacoes"("comanda_id");

-- CreateIndex
CREATE UNIQUE INDEX "avaliacoes_token_key" ON "avaliacoes"("token");

-- CreateIndex
CREATE INDEX "avaliacoes_salao_id_respondida_em_idx" ON "avaliacoes"("salao_id", "respondida_em");

-- CreateIndex
CREATE INDEX "avaliacoes_push_enviado_em_pedir_em_idx" ON "avaliacoes"("push_enviado_em", "pedir_em");

-- AddForeignKey
ALTER TABLE "assinaturas_push" ADD CONSTRAINT "assinaturas_push_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "config_mensagens" ADD CONSTRAINT "config_mensagens_salao_id_fkey" FOREIGN KEY ("salao_id") REFERENCES "saloes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_salao_id_fkey" FOREIGN KEY ("salao_id") REFERENCES "saloes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "avaliacoes" ADD CONSTRAINT "avaliacoes_comanda_id_fkey" FOREIGN KEY ("comanda_id") REFERENCES "comandas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

