import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { dataLocalSchema, type FichaClientePro } from '@salonflow/shared';
import { excluirAnotacaoPro, salvarAnotacaoPro } from '@/app/pro/clientes/actions';
import { FichaTecnica } from '@/components/clientes/ficha-tecnica';
import { ApiError } from '@/lib/api/client';
import { apiPro } from '@/lib/api/pro';
import { obterContextoPro } from '@/lib/auth/contexto';
import { hojeNoFuso } from '@/lib/data-hora';

export const metadata = { title: 'Ficha do cliente' };

/** Ficha técnica do cliente no app do profissional. ?data=&servico= vêm do atendimento. */
export default async function FichaClienteProPage({
  params,
  searchParams,
}: PageProps<'/pro/clientes/[id]'>) {
  const { id } = await params;
  const { data, servico } = await searchParams;
  const { salao } = await obterContextoPro();
  if (!salao) notFound();

  let ficha: FichaClientePro;
  try {
    ficha = await apiPro<FichaClientePro>(`/pro/clientes/${id}/ficha`);
  } catch (erro) {
    if (erro instanceof ApiError && [400, 403, 404].includes(erro.erro.statusCode)) notFound();
    throw erro;
  }

  const dataAtendimento =
    typeof data === 'string' && dataLocalSchema.safeParse(data).success
      ? data
      : hojeNoFuso(salao.fusoHorario);
  const servicoId =
    typeof servico === 'string' && ficha.servicos.some((s) => s.id === servico)
      ? servico
      : undefined;

  return (
    <section className="flex flex-col gap-4">
      <Link
        href={`/pro?data=${dataAtendimento}`}
        className="inline-flex items-center gap-1 self-start text-sm text-suave"
      >
        <ChevronLeft className="size-4" aria-hidden />
        Agenda
      </Link>
      <div>
        <p className="text-sm text-suave">Ficha técnica</p>
        <h1 className="text-3xl">{ficha.cliente.nome}</h1>
        {ficha.cliente.observacoes && (
          <p className="mt-2 rounded-lg bg-alerta-suave p-3 text-sm text-alerta">
            {ficha.cliente.observacoes}
          </p>
        )}
      </div>
      <FichaTecnica
        clienteId={ficha.cliente.id}
        anotacoes={ficha.anotacoes}
        servicos={ficha.servicos}
        padrao={{ data: dataAtendimento, servicoId }}
        salvar={salvarAnotacaoPro}
        excluir={excluirAnotacaoPro}
      />
    </section>
  );
}
