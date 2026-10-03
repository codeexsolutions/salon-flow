import Link from 'next/link';
import { Clock, Scissors } from 'lucide-react';
import type { EquipeSalao, MembroEquipe, Papel } from '@salonflow/shared';
import { AdicionarRecepcao } from '@/components/equipe/adicionar-recepcao';
import { AlternarAcesso, CancelarConvite } from '@/components/equipe/acoes-acesso';
import { CabecalhoPagina } from '@/components/ui/cabecalho-pagina';
import { Secao } from '@/components/ui/secao';
import { apiSalao } from '@/lib/api/salao';
import { obterContextoAdmin } from '@/lib/auth/contexto';

export const metadata = { title: 'Equipe e acessos' };

const PAPEIS: Record<Papel, { rotulo: string; descricao: string }> = {
  DONO: { rotulo: 'Dono', descricao: 'Acesso total ao painel' },
  RECEPCAO: { rotulo: 'Recepção', descricao: 'Agenda, comandas, caixa e estoque' },
  PROFISSIONAL: { rotulo: 'Profissional', descricao: 'App do profissional' },
};

const dataCurta = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });

export default async function EquipePage() {
  const { salao } = await obterContextoAdmin();
  if (salao.papel !== 'DONO') {
    return <p className="text-sm text-suave">Apenas o dono do salão gerencia os acessos.</p>;
  }
  const { membros, convites } = await apiSalao<EquipeSalao>('/equipe');
  const ativos = membros.filter((m) => m.ativo);
  const semAcesso = membros.filter((m) => !m.ativo);

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <CabecalhoPagina
        titulo="Equipe e acessos"
        subtitulo="Quem entra no painel do salão e no app do profissional."
      />

      <Secao
        titulo="Adicionar recepção"
        descricao="A recepção usa o painel: agenda, comandas, caixa e estoque. Não vê comissões nem configurações."
      >
        <AdicionarRecepcao />
        <p className="text-xs text-suave">
          Profissionais recebem acesso ao app pela tela{' '}
          <Link href="/admin/profissionais" className="text-primaria underline">
            Profissionais
          </Link>
          .
        </p>
      </Secao>

      <Secao titulo={`Com acesso (${ativos.length})`}>
        <ListaMembros membros={ativos} />
      </Secao>

      {convites.length > 0 && (
        <Secao
          titulo="Aguardando o primeiro acesso"
          descricao="O acesso é liberado quando a pessoa entrar com este e-mail."
        >
          <ul className="flex flex-col divide-y divide-borda">
            {convites.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="truncate font-medium">{c.nome ?? c.email}</p>
                  <p className="truncate text-sm text-suave">
                    {c.email} · {PAPEIS[c.papel].rotulo}
                  </p>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-alerta">
                    <Clock className="size-3" aria-hidden /> Liberado em {dataCurta(c.criadoEm)}
                  </p>
                </div>
                <CancelarConvite id={c.id} email={c.email} />
              </li>
            ))}
          </ul>
        </Secao>
      )}

      {semAcesso.length > 0 && (
        <Secao titulo="Sem acesso" descricao="Pessoas cujo acesso foi removido.">
          <ListaMembros membros={semAcesso} />
        </Secao>
      )}
    </div>
  );
}

function ListaMembros({ membros }: { membros: MembroEquipe[] }) {
  if (membros.length === 0) return <p className="text-sm text-suave">Ninguém por aqui.</p>;
  return (
    <ul className="flex flex-col divide-y divide-borda">
      {membros.map((m) => {
        const nome = m.nome ?? m.email;
        return (
          <li key={m.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-nude font-display text-primaria">
                {nome.charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {nome}
                  {m.ehVoce && <span className="ml-1.5 text-xs font-normal text-suave">(você)</span>}
                </p>
                <p className="truncate text-sm text-suave">{m.email}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <span
                    title={PAPEIS[m.papel].descricao}
                    className="rounded-full bg-nude px-2 py-0.5 text-xs font-medium text-primaria"
                  >
                    {PAPEIS[m.papel].rotulo}
                  </span>
                  {m.ehProfissional && m.papel !== 'PROFISSIONAL' && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-borda px-2 py-0.5 text-xs text-suave">
                      <Scissors className="size-3" aria-hidden /> Também atende
                    </span>
                  )}
                </div>
              </div>
            </div>
            {!m.ehVoce && m.papel !== 'DONO' && <AlternarAcesso id={m.id} nome={nome} ativo={m.ativo} />}
          </li>
        );
      })}
    </ul>
  );
}
