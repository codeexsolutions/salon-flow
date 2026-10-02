-- AlterTable
ALTER TABLE "saloes" ADD COLUMN     "fuso_horario" TEXT NOT NULL DEFAULT 'America/Sao_Paulo';

-- CreateTable
CREATE TABLE "profissionais" (
    "id" UUID NOT NULL,
    "salao_id" UUID NOT NULL,
    "usuario_id" UUID,
    "nome" TEXT NOT NULL,
    "email" TEXT,
    "telefone" TEXT,
    "cor_agenda" TEXT NOT NULL DEFAULT '#7c3aed',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profissionais_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jornada_intervalos" (
    "id" UUID NOT NULL,
    "salao_id" UUID NOT NULL,
    "profissional_id" UUID NOT NULL,
    "dia_semana" SMALLINT NOT NULL,
    "inicio_min" SMALLINT NOT NULL,
    "fim_min" SMALLINT NOT NULL,

    CONSTRAINT "jornada_intervalos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bloqueios_agenda" (
    "id" UUID NOT NULL,
    "salao_id" UUID NOT NULL,
    "profissional_id" UUID NOT NULL,
    "inicio" TIMESTAMPTZ NOT NULL,
    "fim" TIMESTAMPTZ NOT NULL,
    "motivo" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bloqueios_agenda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "profissionais_salao_id_ativo_idx" ON "profissionais"("salao_id", "ativo");

-- CreateIndex
CREATE INDEX "profissionais_email_idx" ON "profissionais"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profissionais_salao_id_email_key" ON "profissionais"("salao_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "profissionais_salao_id_usuario_id_key" ON "profissionais"("salao_id", "usuario_id");

-- CreateIndex
CREATE INDEX "jornada_intervalos_profissional_id_dia_semana_idx" ON "jornada_intervalos"("profissional_id", "dia_semana");

-- CreateIndex
CREATE INDEX "bloqueios_agenda_profissional_id_inicio_idx" ON "bloqueios_agenda"("profissional_id", "inicio");

-- AddForeignKey
ALTER TABLE "profissionais" ADD CONSTRAINT "profissionais_salao_id_fkey" FOREIGN KEY ("salao_id") REFERENCES "saloes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profissionais" ADD CONSTRAINT "profissionais_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jornada_intervalos" ADD CONSTRAINT "jornada_intervalos_salao_id_fkey" FOREIGN KEY ("salao_id") REFERENCES "saloes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "jornada_intervalos" ADD CONSTRAINT "jornada_intervalos_profissional_id_fkey" FOREIGN KEY ("profissional_id") REFERENCES "profissionais"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloqueios_agenda" ADD CONSTRAINT "bloqueios_agenda_salao_id_fkey" FOREIGN KEY ("salao_id") REFERENCES "saloes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bloqueios_agenda" ADD CONSTRAINT "bloqueios_agenda_profissional_id_fkey" FOREIGN KEY ("profissional_id") REFERENCES "profissionais"("id") ON DELETE CASCADE ON UPDATE CASCADE;
