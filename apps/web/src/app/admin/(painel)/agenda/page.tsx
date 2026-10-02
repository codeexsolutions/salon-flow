import Link from 'next/link';
import { dataLocalSchema, type AgendaDia, type ServicoResumo } from '@salonflow/shared';
import { GradeAgenda } from '@/components/agenda/grade-agenda';
import { classeBotaoSecundario } from '@/components/ui/campo';
import { apiSalao } from '@/lib/api/salao';
import { obterContextoAdmin } from '@/lib/auth/contexto';
import { dataPorExtenso, hojeNoFuso, somarDias } from '@/lib/data-hora';

export const metadata = { title: 'Agenda' };

export default async function AgendaPage({ searchParams }: PageProps<'/admin/agenda'>) {
  const { salao } = await obterContextoAdmin();
  const hoje = hojeNoFuso(salao.fusoHorario);
  const pedido = (await searchParams).data;
  const data = dataLocalSchema.safeParse(pedido).success ? (pedido as string) : hoje;

  const [agenda, servicos] = await Promise.all([
    apiSalao<AgendaDia>(`/agenda?data=${data}`),
    apiSalao<ServicoResumo[]>('/servicos'),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-bold">Agenda</h1>
        <nav className="flex items-center gap-1" aria-label="Navegar entre dias">
          <Link
            href={`/admin/agenda?data=${somarDias(data, -1)}`}
            className={classeBotaoSecundario}
            aria-label="Dia anterior"
          >
            ←
          </Link>
          {data !== hoje && (
            <Link href="/admin/agenda" className={classeBotaoSecundario}>
              Hoje
            </Link>
          )}
          <Link
            href={`/admin/agenda?data=${somarDias(data, 1)}`}
            className={classeBotaoSecundario}
            aria-label="Próximo dia"
          >
            →
          </Link>
        </nav>
        <form action="/admin/agenda" className="flex items-center gap-2">
          <input
            type="date"
            name="data"
            defaultValue={data}
            aria-label="Ir para a data"
            className="rounded-lg border border-borda bg-transparent px-2 py-1.5 text-sm"
          />
          <button type="submit" className="text-sm text-primaria">
            Ir
          </button>
        </form>
        <p className="text-sm capitalize text-suave">
          {dataPorExtenso(data)}
          {data === hoje && ' · hoje'}
        </p>
      </div>

      <GradeAgenda agenda={agenda} servicos={servicos} />
    </div>
  );
}
