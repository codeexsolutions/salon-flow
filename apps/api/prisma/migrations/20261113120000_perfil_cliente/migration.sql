-- CreateTable
CREATE TABLE "perfis_cliente" (
    "usuario_id" UUID NOT NULL,
    "nome" TEXT,
    "telefone" TEXT,
    "email" TEXT,
    "nascimento" DATE,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "perfis_cliente_pkey" PRIMARY KEY ("usuario_id")
);

-- AddForeignKey
ALTER TABLE "perfis_cliente" ADD CONSTRAINT "perfis_cliente_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

