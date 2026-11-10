import Link from 'next/link';
import { MessageSquareText, Star, Users } from 'lucide-react';
import type { RelatorioAvaliacoes } from '@salonflow/shared';
import { CabecalhoPagina } from '@/components/ui/cabecalho-pagina';
import { EstadoVazio } from '@/components/ui/estado-vazio';
import { Indicador } from '@/components/ui/indicador';
import { Secao } from '@/components/ui/secao';
import { apiSalao } from '@/lib/api/salao';
import { obterContextoAdmin } from '@/lib/auth/contexto';
import { hojeNoFuso, somarDias } from '@/lib/data-hora';

export const metadata = { title: 'Avaliações' };

const PERIODOS = [
  { dias: 30, rotulo: '30 dias' },
  { dias: 90, rotulo: '90 dias' },
  { dias: 365, rotulo: '12 meses' },
];

const dataCurta = (d: string) => d.split('-').reverse().join('/');
const nota = (n: number) =>
  n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function Estrelas({ valor }: { valor: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`Nota ${valor} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`size-3.5 ${n <= valor ? 'fill-amber-400 text-amber-400' : 'text-borda'}`}
          aria-hidden
        />
      ))}
    </span>
  );
}

export default async function AvaliacoesPage({ searchParams }: PageProps<'/admin/avaliacoes'>) {
  const { salao } = await obterContextoAdmin();
  const hoje = hojeNoFuso(salao.fusoHorario);
  const pedido = Number((await searchParams).dias);
  const dias = PERIODOS.some((p) => p.dias === pedido) ? pedido : 90;
  const de = somarDias(hoje, -(dias - 1));

  const r = await apiSalao<RelatorioAvaliacoes>(`/avaliacoes?de=${de}&ate=${hoje}`);
  const maxDistribuicao = Math.max(1, ...r.distribuicao);

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <CabecalhoPagina
        titulo="Avaliações"
        subtitulo="Notas de 1 a 5 que os clientes deram depois do atendimento."
        acoes={
          <nav className="flex gap-1 rounded-xl border border-borda bg-superficie p-1 text-sm">
            {PERIODOS.map((p) => (
              <Link
                key={p.dias}
                href={`/admin/avaliacoes?dias=${p.dias}`}
                aria-current={p.dias === dias ? 'page' : undefined}
                className={`rounded-lg px-3 py-1.5 ${p.dias === dias ? 'bg-nude font-medium text-primaria' : 'text-suave hover:text-foreground'}`}
              >
                {p.rotulo}
              </Link>
            ))}
          </nav>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Indicador
          rotulo="Nota média"
          valor={r.media !== null ? nota(r.media) : '—'}
          detalhe={r.media !== null ? <Estrelas valor={Math.round(r.media)} /> : 'Sem avaliações'}
          icone={Star}
        />
        <Indicador rotulo="Avaliações" valor={r.respondidas} icone={MessageSquareText} />
        <Indicador
          rotulo="Taxa de resposta"
          valor={r.pedidas ? `${Math.round((r.respondidas / r.pedidas) * 100)}%` : '—'}
          detalhe={`${r.pedidas} atendimento(s) com cliente`}
          icone={Users}
        />
      </div>

      {r.respondidas === 0 ? (
        <EstadoVazio
          icone={Star}
          titulo="Nenhuma avaliação no período"
          descricao="Depois do atendimento, o cliente recebe o pedido por push (se usa o app) ou pelo botão de WhatsApp da comanda fechada."
        />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <div className="flex flex-col gap-6">
            <Secao titulo="Distribuição">
              <ul className="flex flex-col gap-1.5 text-sm">
                {[5, 4, 3, 2, 1].map((n) => (
                  <li key={n} className="flex items-center gap-2">
                    <span className="w-4 text-right">{n}</span>
                    <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden />
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-nude">
                      <span
                        className="block h-full rounded-full bg-amber-400"
                        style={{ width: `${(r.distribuicao[n - 1] / maxDistribuicao) * 100}%` }}
                      />
                    </span>
                    <span className="w-8 text-right text-suave">{r.distribuicao[n - 1]}</span>
                  </li>
                ))}
              </ul>
            </Secao>
            {r.porProfissional.length > 0 && (
              <Secao titulo="Por profissional">
                <ul className="flex flex-col divide-y divide-borda text-sm">
                  {r.porProfissional.map((p) => (
                    <li key={p.nome} className="flex items-center justify-between gap-2 py-2">
                      <span className="min-w-0 truncate">{p.nome}</span>
                      <span className="flex shrink-0 items-center gap-2">
                        <strong>{nota(p.media)}</strong>
                        <span className="text-xs text-suave">({p.total})</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </Secao>
            )}
          </div>

          <Secao titulo="Comentários e notas recentes">
            <ul className="flex flex-col divide-y divide-borda text-sm">
              {r.recentes.map((a) => (
                <li key={a.id} className="flex flex-col gap-1 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link
                      href={`/admin/clientes/${a.cliente.id}`}
                      className="font-medium hover:text-primaria"
                    >
                      {a.cliente.nome}
                    </Link>
                    <Estrelas valor={a.nota} />
                  </div>
                  {a.comentario && <p className="whitespace-pre-line">{a.comentario}</p>}
                  <p className="text-xs text-suave">
                    <Link href={`/admin/comandas/${a.comandaId}`} className="hover:text-primaria">
                      {dataCurta(a.data)}
                    </Link>
                    {a.profissionais.length > 0 && ` · ${a.profissionais.join(', ')}`}
                  </p>
                </li>
              ))}
            </ul>
          </Secao>
        </div>
      )}
    </div>
  );
}
