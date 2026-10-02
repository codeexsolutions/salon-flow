import Link from 'next/link';
import { formatarDuracao, formatarPreco, type ServicoResumo } from '@salonflow/shared';
import { classeBotaoPrimario } from '@/components/ui/campo';
import { apiSalao } from '@/lib/api/salao';
import { obterContextoAdmin } from '@/lib/auth/contexto';

export const metadata = { title: 'Serviços' };

/** Agrupa por categoria, mantendo a ordem da API; sem categoria vai para o fim. */
function agruparPorCategoria(servicos: ServicoResumo[]) {
  const grupos = new Map<string, ServicoResumo[]>();
  for (const s of servicos) {
    const chave = s.categoria ?? '';
    grupos.set(chave, [...(grupos.get(chave) ?? []), s]);
  }
  return [...grupos.entries()].sort(([a], [b]) => (a === '' ? 1 : b === '' ? -1 : 0));
}

export default async function ServicosPage() {
  const [{ salao }, servicos] = await Promise.all([
    obterContextoAdmin(),
    apiSalao<ServicoResumo[]>('/servicos?incluirInativos=true'),
  ]);
  const ehDono = salao.papel === 'DONO';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl">Serviços</h1>
        {ehDono && (
          <Link href="/admin/servicos/novo" className={classeBotaoPrimario}>
            Novo serviço
          </Link>
        )}
      </div>

      {servicos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-borda p-8 text-center text-sm text-suave">
          Nenhum serviço cadastrado ainda.
          {ehDono && ' Cadastre o que o salão oferece para os clientes poderem agendar.'}
        </p>
      ) : (
        agruparPorCategoria(servicos).map(([categoria, lista]) => (
          <section key={categoria} className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-suave">{categoria || 'Sem categoria'}</h2>
            <ul className="flex flex-col divide-y divide-borda rounded-2xl border border-borda bg-superficie">
              {lista.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/admin/servicos/${s.id}`}
                    className={`flex items-center gap-3 px-4 py-3 ${s.ativo ? '' : 'opacity-50'}`}
                  >
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium">{s.nome}</span>
                      <span className="text-xs text-suave">
                        {formatarDuracao(s.duracaoMin)} ·{' '}
                        {s.totalProfissionais === 0 ? (
                          <span className="text-alerta">nenhum profissional</span>
                        ) : (
                          `${s.totalProfissionais} profissional(is)`
                        )}
                        {!s.visivelOnline && ' · só na recepção'}
                        {!s.ativo && ' · desativado'}
                      </span>
                    </span>
                    <span className="font-medium">{formatarPreco(s.precoCentavos)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
