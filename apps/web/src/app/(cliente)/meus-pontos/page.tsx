import Link from 'next/link';
import { Gift } from 'lucide-react';
import { formatarPreco, type MeusPontosSalao } from '@salonflow/shared';
import { api } from '@/lib/api/client';
import { exigirSessao } from '@/lib/auth/sessao';

export const metadata = { title: 'Meus pontos' };

const dataCurta = (iso: string) => iso.slice(0, 10).split('-').reverse().join('/');
const pts = (n: number) => `${n.toLocaleString('pt-BR')} ${Math.abs(n) === 1 ? 'ponto' : 'pontos'}`;

export default async function MeusPontosPage() {
  const sessao = await exigirSessao('/meus-pontos');
  // API antiga (sem fidelidade): mostra como se não houvesse programa.
  const saloes = await api<MeusPontosSalao[]>('/me/pontos', {
    token: sessao.token,
    cache: 'no-store',
  }).catch(() => [] as MeusPontosSalao[]);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl">Meus pontos</h1>

      {saloes.length === 0 ? (
        <p className="rounded-xl border border-dashed border-borda p-6 text-center text-sm text-suave">
          Você ainda não tem pontos. Nos salões com programa de fidelidade, cada atendimento vale
          pontos que viram prêmios.
        </p>
      ) : (
        saloes.map((s) => {
          const proximo = s.premios.find((p) => p.pontos > s.saldo);
          return (
            <section
              key={s.salao.slug}
              className="flex flex-col gap-4 rounded-2xl border border-borda bg-superficie p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link
                    href={`/s/${s.salao.slug}`}
                    className="text-sm text-suave hover:text-primaria"
                  >
                    {s.salao.nome}
                  </Link>
                  <p className="font-display text-4xl">{pts(Math.max(s.saldo, 0))}</p>
                  {s.aVencer && (
                    <p className="text-xs text-alerta">
                      {pts(s.aVencer.pontos)} vencem em {dataCurta(s.aVencer.em)}
                    </p>
                  )}
                </div>
                <Gift className="size-8 text-primaria" aria-hidden />
              </div>

              <p className="text-sm text-suave">
                A cada {formatarPreco(s.programa.centavosPorPonto)} = 1 ponto
                {s.programa.validadeMeses &&
                  ` · os pontos valem por ${s.programa.validadeMeses} meses`}
                .
              </p>

              {s.premios.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {s.premios.map((p) => {
                    const pronto = s.saldo >= p.pontos;
                    const progresso = Math.min(100, Math.max(0, (s.saldo / p.pontos) * 100));
                    return (
                      <li
                        key={p.id}
                        className="flex flex-col gap-1.5 rounded-xl border border-borda p-3"
                      >
                        <div className="flex items-center justify-between gap-2 text-sm">
                          <span className="font-medium">{p.nome}</span>
                          <span className={pronto ? 'font-medium text-sucesso' : 'text-suave'}>
                            {pronto ? 'Disponível' : pts(p.pontos)}
                          </span>
                        </div>
                        {p.descricao && <p className="text-xs text-suave">{p.descricao}</p>}
                        <div
                          className="h-1.5 overflow-hidden rounded-full bg-nude"
                          role="progressbar"
                          aria-valuenow={Math.round(progresso)}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={`Progresso para ${p.nome}`}
                        >
                          <div className="h-full bg-primaria" style={{ width: `${progresso}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}

              {proximo && (
                <p className="text-sm">
                  Faltam <strong>{pts(proximo.pontos - Math.max(s.saldo, 0))}</strong> para{' '}
                  {proximo.nome}.
                </p>
              )}
              {s.premios.some((p) => s.saldo >= p.pontos) && (
                <p className="rounded-lg bg-sucesso-suave px-3 py-2 text-sm text-sucesso">
                  Você já pode trocar seus pontos! Peça o resgate no salão.
                </p>
              )}
              {s.programa.regras && (
                <p className="text-xs whitespace-pre-line text-suave">{s.programa.regras}</p>
              )}

              {s.extrato.length > 0 && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-suave">Extrato</summary>
                  <ul className="mt-2 flex flex-col divide-y divide-borda">
                    {s.extrato.slice(0, 30).map((m) => (
                      <li key={m.id} className="flex justify-between gap-2 py-1.5">
                        <span>
                          {m.tipo === 'GANHO' ? 'Atendimento' : m.descricao}
                          <span className="block text-xs text-suave">{dataCurta(m.data)}</span>
                        </span>
                        <span className={m.pontos < 0 ? 'text-perigo' : 'text-sucesso'}>
                          {m.pontos > 0 ? '+' : ''}
                          {m.pontos.toLocaleString('pt-BR')}
                        </span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </section>
          );
        })
      )}
    </div>
  );
}
