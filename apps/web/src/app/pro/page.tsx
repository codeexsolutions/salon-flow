import Link from 'next/link';
import { dataLocalSchema, formatarPreco, type AgendaDia } from '@salonflow/shared';
import { EmConstrucao } from '@/components/em-construcao';
import { ROTULO_STATUS } from '@/lib/agenda';
import { api } from '@/lib/api/client';
import { sair } from '@/lib/auth/actions';
import { obterContextoPro } from '@/lib/auth/contexto';
import { exigirSessao } from '@/lib/auth/sessao';
import { dataPorExtenso, hojeNoFuso, horaLocal, somarDias } from '@/lib/data-hora';

export default async function ProAgendaPage({ searchParams }: PageProps<'/pro'>) {
  const { perfil, salao } = await obterContextoPro();

  if (!salao) {
    return (
      <section className="flex flex-col gap-4 text-center">
        <EmConstrucao
          titulo="Você ainda não está em nenhum salão"
          descricao={`Peça ao salão para cadastrar ${perfil.email} como profissional. Depois, é só abrir este app de novo.`}
        />
        <form action={sair}>
          <button type="submit" className="text-sm text-suave underline">
            Sair
          </button>
        </form>
      </section>
    );
  }

  const hoje = hojeNoFuso(salao.fusoHorario);
  const pedido = (await searchParams).data;
  const data = dataLocalSchema.safeParse(pedido).success ? (pedido as string) : hoje;
  const sessao = await exigirSessao('/pro');
  const agenda = await api<AgendaDia>(`/pro/agenda?data=${data}`, {
    token: sessao.token,
    salaoId: salao.id,
    cache: 'no-store',
  });
  const eu = agenda.profissionais[0];
  const ativos = agenda.agendamentos.filter((a) => a.status !== 'CANCELADO');
  const totalPrevisto = ativos
    .filter((a) => a.status !== 'FALTOU')
    .reduce((soma, a) => soma + a.precoCentavos, 0);

  return (
    <section className="flex flex-col gap-4">
      <div>
        <p className="text-sm text-suave">{salao.nome}</p>
        <h1 className="text-2xl font-bold">Minha agenda</h1>
      </div>

      <nav className="flex items-center justify-between gap-2" aria-label="Navegar entre dias">
        <Link
          href={`/pro?data=${somarDias(data, -1)}`}
          className="px-3 py-1 text-lg"
          aria-label="Dia anterior"
        >
          ←
        </Link>
        <div className="text-center">
          <p className="font-medium">{dataPorExtenso(data)}</p>
          {data === hoje ? (
            <p className="text-xs text-suave">hoje</p>
          ) : (
            <Link href="/pro" className="text-xs text-primaria">
              voltar para hoje
            </Link>
          )}
        </div>
        <Link
          href={`/pro?data=${somarDias(data, 1)}`}
          className="px-3 py-1 text-lg"
          aria-label="Próximo dia"
        >
          →
        </Link>
      </nav>

      <p className="text-sm text-suave">
        {eu.jornada.length > 0
          ? `Expediente: ${eu.jornada.map((j) => `${j.inicio}–${j.fim}`).join(' e ')}`
          : 'Sem expediente neste dia.'}
        {ativos.length > 0 &&
          ` · ${ativos.length} atendimento(s) · ${formatarPreco(totalPrevisto)} previstos`}
      </p>

      {agenda.bloqueios.map((b) => (
        <p
          key={b.id}
          className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200"
        >
          {b.motivo ?? 'Folga'}: {horaLocal(b.inicio, agenda.fusoHorario)}–
          {horaLocal(b.fim, agenda.fusoHorario)}
        </p>
      ))}

      {agenda.agendamentos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-borda p-6 text-center text-sm text-suave">
          Nenhum atendimento neste dia.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {agenda.agendamentos.map((a) => (
            <li
              key={a.id}
              className="flex gap-3 rounded-xl border border-borda border-l-4 p-3"
              style={{ borderLeftColor: eu.corAgenda }}
            >
              <span className="w-12 shrink-0 font-semibold">
                {horaLocal(a.inicio, agenda.fusoHorario)}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium">{a.cliente.nome}</span>
                <span className="truncate text-sm text-suave">
                  {a.servico.nome} · até {horaLocal(a.fim, agenda.fusoHorario)}
                </span>
                {a.observacoes && <span className="text-xs text-suave">{a.observacoes}</span>}
              </span>
              <span className="shrink-0 text-xs text-suave">{ROTULO_STATUS[a.status]}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
