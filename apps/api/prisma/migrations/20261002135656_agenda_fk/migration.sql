-- DropForeignKey
ALTER TABLE "agendamentos" DROP CONSTRAINT "agendamentos_cliente_id_fkey";

-- DropForeignKey
ALTER TABLE "agendamentos" DROP CONSTRAINT "agendamentos_profissional_id_fkey";

-- DropForeignKey
ALTER TABLE "agendamentos" DROP CONSTRAINT "agendamentos_servico_id_fkey";

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_profissional_id_fkey" FOREIGN KEY ("profissional_id") REFERENCES "profissionais"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "agendamentos" ADD CONSTRAINT "agendamentos_servico_id_fkey" FOREIGN KEY ("servico_id") REFERENCES "servicos"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
