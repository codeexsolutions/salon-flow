-- CreateEnum
CREATE TYPE "StatusAgendamento" AS ENUM ('AGENDADO', 'CONFIRMADO', 'CONCLUIDO', 'CANCELADO', 'FALTOU');

-- CreateEnum
CREATE TYPE "OrigemAgendamento" AS ENUM ('SALAO', 'APP_CLIENTE');

-- CreateTable
CREATE TABLE "clientes" (
    "id" UUID NOT NULL,
    "salao_id" UUID NOT NULL,
    "usuario_id" UUID,
    "nome" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "observacoes" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agendamentos" (
    "id" UUID NOT NULL,
    "salao_id" UUID NOT NULL,
    "cliente_id" UUID NOT NULL,
    "profissional_id" UUID NOT NULL,
    "servico_id" UUID NOT NULL,
    "inicio" TIMESTAMPTZ NOT NULL,
    "fim" TIMESTAMPTZ NOT NULL,
    "preco_centavos" INTEGER NOT NULL,
    "status" "StatusAgendamento" NOT NULL DEFAULT 'AGENDADO',
    "origem" "OrigemAgendamento" NOT NULL DEFAULT 'SALAO',
    "observacoes" TEXT,
    "criado_por_id" UUID,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agendamentos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "clientes_salao_id_nome_idx" ON "clientes"("salao_id", "nome");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_salao_id_usuario_id_key" ON "clientes"("salao_id", "usuario_id");

-- CreateIndex
CREATE INDEX "agendamentos_salao_id_inicio_idx" ON "agendamentos"("salao_id", "inicio");

-- CreateIndex
CREATE INDEX "agendamentos_profissional_id_inicio_idx" ON "agendamentos"("profissional_id", "inicio");

-- CreateIndex
CREATE INDEX "agendamentos_cliente_id_inicio_idx" ON "agendamentos"("cliente_id", "inicio");

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_salao_id_fkey" FOREIGN KEY ("salao_id") REFERENCES "saloes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_salao_id_fkey" FOREIGN KEY ("salao_id") REFERENCES "saloes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_profissional_id_fkey" FOREIGN KEY ("profissional_id") REFERENCES "profissionais"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_servico_id_fkey" FOREIGN KEY ("servico_id") REFERENCES "servicos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
