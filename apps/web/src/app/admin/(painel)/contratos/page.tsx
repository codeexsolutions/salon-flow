import Link from 'next/link';
import { FileSignature } from 'lucide-react';
import type { SituacaoContrato } from '@salonflow/shared';
import { StatusContratoBadge } from '@/components/contratos/status-contrato';
import { CabecalhoPagina } from '@/components/ui/cabecalho-pagina';
import { classeBotaoSecundario } from '@/components/ui/campo';
import { EstadoVazio } from '@/components/ui/estado-vazio';
import { Secao } from '@/components/ui/secao';
import { apiSalao } from '@/lib/api/salao';
import { obterContextoAdmin } from '@/lib/auth/contexto';

export const metadata = { title: 'Contratos' };

const dataCurta = (d: string) => d.split('-').reverse().join('/');

export default async function ContratosPage() {
  const { salao } = await obterContextoAdmin();
  if (salao.papel !== 'DONO') {
    return <p className="text-sm text-suave">Apenas o dono do salão acessa os contratos.</p>;
  }
  const situacao = await apiSalao<SituacaoContrato[]>('/contratos/situacao');
  const semContrato = situacao.filter((s) => s.contrato?.status !== 'ATIVO').length;

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <CabecalhoPagina
        titulo="Contratos"
        subtitulo="Contrato de parceria salão-parceiro × profissional-parceiro (Lei 13.352/2016)."
      />

      {semContrato > 0 && (
        <p className="rounded-xl border border-perigo/30 bg-perigo-suave px-4 py-3 text-sm">
          <strong>{semContrato} profissional(is) sem contrato ativo.</strong> Sem contrato de
          parceria formalizado e homologado, a relação pode ser reconhecida como vínculo de emprego
          (Lei 12.592, art. 1º-C).
        </p>
      )}

      <Secao titulo="Profissionais">
        {situacao.length === 0 ? (
          <EstadoVazio icone={FileSignature} titulo="Nenhum profissional ativo" />
        ) : (
          <ul className="flex flex-col divide-y divide-borda">
            {situacao.map((s) => (
              <li key={s.profissionalId} className="flex flex-wrap items-center gap-3 py-3">
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-medium">{s.nome}</span>
                  <span className="text-xs text-suave">
                    {s.contrato
                      ? s.contrato.status === 'ENCERRADO'
                        ? `Encerrado em ${dataCurta(s.contrato.encerradoEm ?? s.contrato.inicioEm)}`
                        : `Desde ${dataCurta(s.contrato.inicioEm)}${s.contrato.temArquivo ? ' · PDF assinado' : ''}`
                      : 'Nenhum contrato cadastrado'}
                    {s.contrato &&
                      s.contrato.pendencias.length > 0 &&
                      ` · ${s.contrato.pendencias.length} pendência(s) para ativar`}
                  </span>
                </span>
                <StatusContratoBadge status={s.contrato?.status ?? null} />
                {s.contrato && s.contrato.status !== 'ENCERRADO' ? (
                  <Link
                    href={`/admin/contratos/${s.contrato.id}`}
                    className={classeBotaoSecundario}
                  >
                    Abrir
                  </Link>
                ) : (
                  <Link
                    href={`/admin/contratos/novo?profissional=${s.profissionalId}`}
                    className={classeBotaoSecundario}
                  >
                    Criar contrato
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </Secao>

      <p className="text-xs text-suave">
        A minuta gerada segue as cláusulas obrigatórias da lei, mas não substitui orientação
        jurídica: revise com o sindicato ou um advogado na homologação.
      </p>
    </div>
  );
}
