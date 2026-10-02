import Link from 'next/link';
import type { ProfissionalResumo } from '@salonflow/shared';
import { SeloAcesso } from '@/components/profissionais/selo-acesso';
import { classeBotaoPrimario } from '@/components/ui/campo';
import { apiSalao } from '@/lib/api/salao';
import { obterContextoAdmin } from '@/lib/auth/contexto';

export const metadata = { title: 'Profissionais' };

export default async function ProfissionaisPage() {
  const [{ salao }, profissionais] = await Promise.all([
    obterContextoAdmin(),
    apiSalao<ProfissionalResumo[]>('/profissionais?incluirInativos=true'),
  ]);
  const ehDono = salao.papel === 'DONO';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-3xl">Profissionais</h1>
        {ehDono && (
          <Link href="/admin/profissionais/novo" className={classeBotaoPrimario}>
            Novo profissional
          </Link>
        )}
      </div>

      {profissionais.length === 0 ? (
        <p className="rounded-xl border border-dashed border-borda p-8 text-center text-sm text-suave">
          Nenhum profissional cadastrado ainda.
          {ehDono && ' Cadastre sua equipe para montar a agenda.'}
        </p>
      ) : (
        <ul className="flex flex-col divide-y divide-borda rounded-2xl border border-borda bg-superficie">
          {profissionais.map((p) => (
            <li key={p.id}>
              <Link
                href={`/admin/profissionais/${p.id}`}
                className={`flex items-center gap-3 px-4 py-3 ${p.ativo ? '' : 'opacity-50'}`}
              >
                <span
                  className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: p.corAgenda }}
                  aria-hidden
                />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">{p.nome}</span>
                  <span className="truncate text-xs text-suave">
                    {p.email ?? p.telefone ?? 'Sem contato'}
                  </span>
                </span>
                {p.ativo ? (
                  <SeloAcesso acesso={p.acessoApp} />
                ) : (
                  <span className="text-xs text-suave">Desativado</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
