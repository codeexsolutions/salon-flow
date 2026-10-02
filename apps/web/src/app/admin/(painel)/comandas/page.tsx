import Link from 'next/link';
import { dataLocalSchema, formatarPreco, type ComandaResumo } from '@salonflow/shared';
import { classeBotaoPrimario, classeBotaoSecundario } from '@/components/ui/campo';
import { apiSalao } from '@/lib/api/salao';
import { obterContextoAdmin } from '@/lib/auth/contexto';
import { dataPorExtenso, hojeNoFuso, horaLocal, somarDias } from '@/lib/data-hora';
import { novaComanda } from './actions';

export const metadata = { title: 'Comandas' };

const ROTULO = { ABERTA: 'Aberta', FECHADA: 'Fechada', CANCELADA: 'Cancelada' } as const;

export default async function ComandasPage({ searchParams }: PageProps<'/admin/comandas'>) {
  const { salao } = await obterContextoAdmin();
  const hoje = hojeNoFuso(salao.fusoHorario);
  const pedido = (await searchParams).data;
  const data = dataLocalSchema.safeParse(pedido).success ? (pedido as string) : hoje;
  const comandas = await apiSalao<ComandaResumo[]>(`/comandas?data=${data}`);

  const abertas = comandas.filter((c) => c.status === 'ABERTA');
  const encerradas = comandas.filter((c) => c.status !== 'ABERTA');
  const faturado = encerradas
    .filter((c) => c.status === 'FECHADA')
    .reduce((s, c) => s + c.totalCentavos, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Comandas</h1>
        <form action={novaComanda}>
          <button type="submit" className={classeBotaoPrimario}>
            Nova comanda
          </button>
        </form>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">Abertas ({abertas.length})</h2>
        <ListaComandas
          comandas={abertas}
          fuso={salao.fusoHorario}
          vazio="Nenhuma comanda aberta."
        />
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-semibold">Encerradas em {dataPorExtenso(data)}</h2>
          <Link
            href={`/admin/comandas?data=${somarDias(data, -1)}`}
            className={classeBotaoSecundario}
            aria-label="Dia anterior"
          >
            ←
          </Link>
          {data !== hoje && (
            <Link href="/admin/comandas" className={classeBotaoSecundario}>
              Hoje
            </Link>
          )}
          <Link
            href={`/admin/comandas?data=${somarDias(data, 1)}`}
            className={classeBotaoSecundario}
            aria-label="Próximo dia"
          >
            →
          </Link>
          <span className="ml-auto text-sm">
            Faturado: <strong>{formatarPreco(faturado)}</strong>
          </span>
        </div>
        <ListaComandas
          comandas={encerradas}
          fuso={salao.fusoHorario}
          vazio="Nenhuma comanda encerrada neste dia."
        />
      </section>
    </div>
  );
}

function ListaComandas({
  comandas,
  fuso,
  vazio,
}: {
  comandas: ComandaResumo[];
  fuso: string;
  vazio: string;
}) {
  if (comandas.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-borda p-6 text-center text-sm text-suave">
        {vazio}
      </p>
    );
  }
  return (
    <ul className="flex flex-col divide-y divide-borda rounded-xl border border-borda">
      {comandas.map((c) => (
        <li key={c.id}>
          <Link
            href={`/admin/comandas/${c.id}`}
            className={`flex items-center gap-3 px-4 py-3 ${c.status === 'CANCELADA' ? 'opacity-50' : ''}`}
          >
            <span className="w-12 font-mono text-sm text-suave">#{c.numero}</span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-medium">{c.cliente?.nome ?? 'Sem cliente'}</span>
              <span className="text-xs text-suave">
                {c.quantidadeItens} serviço(s) · {ROTULO[c.status]}
                {' · '}
                {horaLocal(c.fechadaEm ?? c.abertaEm, fuso)}
              </span>
            </span>
            <span className="font-medium">{formatarPreco(c.totalCentavos)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
