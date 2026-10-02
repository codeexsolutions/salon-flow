import Link from 'next/link';
import {
  dataLocalSchema,
  formatarPreco,
  ROTULO_FORMA_PAGAMENTO,
  type ConfiguracaoComissao,
  type ExtratoComissoes,
  type ProfissionalResumo,
  type RegraComissaoDto,
  type RepasseResumo,
  type ServicoResumo,
} from '@salonflow/shared';
import { EditorRegras } from '@/components/comissoes/editor-regras';
import { FormConfiguracao } from '@/components/comissoes/form-configuracao';
import { TabelaExtrato } from '@/components/comissoes/tabela-extrato';
import { classeBotaoSecundario } from '@/components/ui/campo';
import { Secao } from '@/components/ui/secao';
import { apiSalao } from '@/lib/api/salao';
import { obterContextoAdmin } from '@/lib/auth/contexto';
import { hojeNoFuso } from '@/lib/data-hora';

export const metadata = { title: 'Comissões' };

export default async function ComissoesPage({ searchParams }: PageProps<'/admin/comissoes'>) {
  const { salao } = await obterContextoAdmin();
  if (salao.papel !== 'DONO') {
    return <p className="text-sm text-suave">Apenas o dono do salão acessa as comissões.</p>;
  }

  const hoje = hojeNoFuso(salao.fusoHorario);
  const consulta = await searchParams;
  const valida = (v: unknown, padrao: string) =>
    dataLocalSchema.safeParse(v).success ? (v as string) : padrao;
  const de = valida(consulta.de, `${hoje.slice(0, 8)}01`);
  const ate = valida(consulta.ate, hoje);

  const [extrato, configuracao, regras, profissionais, servicos, repasses] = await Promise.all([
    apiSalao<ExtratoComissoes>(`/comissoes/extrato?de=${de}&ate=${ate}`),
    apiSalao<ConfiguracaoComissao>('/comissoes/configuracao'),
    apiSalao<RegraComissaoDto[]>('/comissoes/regras'),
    apiSalao<ProfissionalResumo[]>('/profissionais'),
    apiSalao<ServicoResumo[]>('/servicos'),
    apiSalao<RepasseResumo[]>('/comissoes/repasses'),
  ]);

  return (
    <div className="flex max-w-4xl flex-col gap-8">
      <h1 className="text-3xl">Comissões</h1>

      <Secao titulo="Extrato" descricao="Comissões das comandas fechadas no período.">
        <form className="flex flex-wrap items-end gap-2 text-sm">
          <label className="flex flex-col gap-1">
            De
            <input
              type="date"
              name="de"
              defaultValue={de}
              className="rounded-md border border-borda bg-transparent px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1">
            Até
            <input
              type="date"
              name="ate"
              defaultValue={ate}
              className="rounded-md border border-borda bg-transparent px-2 py-1"
            />
          </label>
          <button type="submit" className={classeBotaoSecundario}>
            Ver
          </button>
        </form>
        <TabelaExtrato extrato={extrato} fuso={salao.fusoHorario} podePagar />
      </Secao>

      <Secao
        titulo="Repasses"
        descricao="Pagamentos de comissões aos profissionais (comprovante salão-parceiro)."
      >
        {repasses.length === 0 ? (
          <p className="text-sm text-suave">
            Nenhum repasse ainda. Use &ldquo;Pagar&rdquo; no extrato acima.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-borda text-sm">
            {repasses.map((r) => (
              <li key={r.id}>
                <Link
                  href={'/admin/comissoes/repasses/' + r.id}
                  className={
                    'flex items-center gap-3 py-2 ' +
                    (r.status === 'CANCELADO' ? 'opacity-50 line-through' : '')
                  }
                >
                  <span className="flex-1">
                    {r.profissional.nome}{' '}
                    <span className="text-suave">
                      {r.de.split('-').reverse().join('/')} a {r.ate.split('-').reverse().join('/')}
                      {r.formaPagamento && ' · ' + ROTULO_FORMA_PAGAMENTO[r.formaPagamento]}
                    </span>
                  </span>
                  <span className="font-medium">{formatarPreco(r.valorPagoCentavos)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Secao>

      <Secao titulo="Configuração">
        <FormConfiguracao configuracao={configuracao} />
      </Secao>

      <Secao
        titulo="Regras específicas"
        descricao="Percentuais diferentes por profissional, por serviço ou pelos dois."
      >
        <EditorRegras regras={regras} profissionais={profissionais} servicos={servicos} />
      </Secao>
    </div>
  );
}
