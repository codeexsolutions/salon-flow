import Link from 'next/link';
import {
  dataLocalSchema,
  formatarPreco,
  ROTULO_FORMA_PAGAMENTO,
  type FaturamentoItemRanking,
  type RelatorioFaturamento,
} from '@salonflow/shared';
import { GraficoFaturamento } from '@/components/faturamento/grafico-faturamento';
import { CabecalhoPagina } from '@/components/ui/cabecalho-pagina';
import { classeBotaoSecundario } from '@/components/ui/campo';
import { Secao } from '@/components/ui/secao';
import { apiSalao } from '@/lib/api/salao';
import { obterContextoAdmin } from '@/lib/auth/contexto';
import { hojeNoFuso, somarDias } from '@/lib/data-hora';

export const metadata = { title: 'Faturamento' };

const formatarData = (d: string) => d.split('-').reverse().join('/');

/** Atalhos de período a partir de hoje. */
function atalhos(hoje: string) {
  const inicioMes = `${hoje.slice(0, 8)}01`;
  const fimMesPassado = somarDias(inicioMes, -1);
  return [
    { rotulo: 'Hoje', de: hoje, ate: hoje },
    { rotulo: '7 dias', de: somarDias(hoje, -6), ate: hoje },
    { rotulo: 'Este mês', de: inicioMes, ate: hoje },
    { rotulo: 'Mês passado', de: `${fimMesPassado.slice(0, 8)}01`, ate: fimMesPassado },
    { rotulo: '12 meses', de: somarDias(hoje, -364), ate: hoje },
  ];
}

/** "+12%" / "−5%" comparando com o período anterior (null se não há base). */
function variacao(atual: number, anterior: number) {
  if (anterior === 0) return null;
  const pct = Math.round(((atual - anterior) / Math.abs(anterior)) * 100);
  return pct;
}

function Variacao({ atual, anterior }: { atual: number; anterior: number }) {
  const pct = variacao(atual, anterior);
  if (pct === null) return <span className="text-xs text-suave">sem base de comparação</span>;
  const sobe = pct >= 0;
  return (
    <span className={`text-xs ${sobe ? 'text-sucesso' : 'text-perigo'}`}>
      {sobe ? '▲ +' : '▼ −'}
      {Math.abs(pct)}% <span className="text-suave">vs. período anterior</span>
    </span>
  );
}

function Cartao({
  rotulo,
  valor,
  anterior,
  detalhe,
  destaque = false,
}: {
  rotulo: string;
  valor: number;
  anterior?: number;
  detalhe?: string;
  destaque?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-1 rounded-2xl border p-4 ${
        destaque ? 'border-primaria/40 bg-nude' : 'border-borda bg-superficie'
      }`}
    >
      <span className="text-sm text-suave">{rotulo}</span>
      <span className="font-display text-2xl">{formatarPreco(valor)}</span>
      {anterior !== undefined && <Variacao atual={valor} anterior={anterior} />}
      {detalhe && <span className="text-xs text-suave">{detalhe}</span>}
    </div>
  );
}

function Linha({ rotulo, valor, sinal }: { rotulo: string; valor: number; sinal?: '−' | '=' }) {
  return (
    <div
      className={`flex justify-between gap-4 py-1.5 ${sinal === '=' ? 'border-t border-borda font-semibold' : ''}`}
    >
      <span className={sinal === '−' ? 'text-suave' : ''}>
        {sinal === '−' ? '− ' : ''}
        {rotulo}
      </span>
      <span className="tabular-nums">{formatarPreco(valor)}</span>
    </div>
  );
}

function Ranking({ itens, unidade }: { itens: FaturamentoItemRanking[]; unidade: string }) {
  if (itens.length === 0) return <p className="text-sm text-suave">Nada no período.</p>;
  const maximo = itens[0].valorCentavos || 1;
  return (
    <ol className="flex flex-col gap-2 text-sm">
      {itens.map((i) => (
        <li key={i.id} className="flex flex-col gap-1">
          <div className="flex justify-between gap-3">
            <span className="min-w-0 truncate">{i.nome}</span>
            <span className="shrink-0 tabular-nums">
              {formatarPreco(i.valorCentavos)}{' '}
              <span className="text-suave">
                · {i.quantidade} {unidade}
              </span>
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-nude">
            <div
              className="h-full rounded-full bg-primaria"
              style={{ width: `${(i.valorCentavos / maximo) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

export default async function FaturamentoPage({ searchParams }: PageProps<'/admin/faturamento'>) {
  const { salao } = await obterContextoAdmin();
  if (salao.papel !== 'DONO') {
    return <p className="text-sm text-suave">Apenas o dono do salão acessa o faturamento.</p>;
  }

  const hoje = hojeNoFuso(salao.fusoHorario);
  const consulta = await searchParams;
  const valida = (v: unknown, padrao: string) =>
    dataLocalSchema.safeParse(v).success ? (v as string) : padrao;
  let de = valida(consulta.de, `${hoje.slice(0, 8)}01`);
  let ate = valida(consulta.ate, hoje);
  if (ate < de) [de, ate] = [ate, de];
  // A API aceita até 1 ano.
  if (somarDias(de, 365) < ate) de = somarDias(ate, -365);

  const r = await apiSalao<RelatorioFaturamento>(`/faturamento?de=${de}&ate=${ate}`);
  const t = r.totais;
  const a = r.anterior.totais;
  const totalFormas = r.porForma.reduce((s, f) => s + f.valorCentavos, 0) || 1;

  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <CabecalhoPagina
        titulo="Faturamento"
        subtitulo={`Comandas fechadas pela data do atendimento · ${
          de === ate ? formatarData(de) : `${formatarData(de)} a ${formatarData(ate)}`
        }`}
      />

      <div className="flex flex-wrap items-end gap-2 text-sm">
        {atalhos(hoje).map((p) => {
          const ativo = p.de === de && p.ate === ate;
          return (
            <Link
              key={p.rotulo}
              href={`/admin/faturamento?de=${p.de}&ate=${p.ate}`}
              aria-current={ativo ? 'page' : undefined}
              className={`rounded-full border px-3 py-1.5 ${
                ativo
                  ? 'border-primaria bg-primaria text-primaria-contraste'
                  : 'border-borda hover:border-primaria/50'
              }`}
            >
              {p.rotulo}
            </Link>
          );
        })}
        <form className="flex flex-wrap items-end gap-2">
          <label className="flex flex-col gap-1 text-xs text-suave">
            De
            <input
              type="date"
              name="de"
              defaultValue={de}
              max={hoje}
              className="rounded-md border border-borda bg-transparent px-2 py-1 text-sm text-foreground"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-suave">
            Até
            <input
              type="date"
              name="ate"
              defaultValue={ate}
              className="rounded-md border border-borda bg-transparent px-2 py-1 text-sm text-foreground"
            />
          </label>
          <button type="submit" className={classeBotaoSecundario}>
            Ver
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Cartao
          rotulo="Faturado (cobrado)"
          valor={t.cobradoCentavos}
          anterior={a.cobradoCentavos}
        />
        <Cartao
          rotulo="Líquido (sem taxas)"
          valor={t.liquidoCentavos}
          anterior={a.liquidoCentavos}
        />
        <Cartao
          rotulo="Resultado do salão"
          valor={t.resultadoCentavos}
          anterior={a.resultadoCentavos}
          detalhe="Líquido − comissões − custo de produtos"
          destaque
        />
        <Cartao
          rotulo="Ticket médio"
          valor={t.ticketMedioCentavos}
          anterior={a.ticketMedioCentavos}
          detalhe={`${t.comandas} comanda(s) · antes ${a.comandas}`}
        />
      </div>

      <Secao
        titulo="Faturamento no período"
        descricao={`Período anterior (${formatarData(r.anterior.de)} a ${formatarData(r.anterior.ate)}): ${formatarPreco(a.cobradoCentavos)}`}
      >
        <GraficoFaturamento dias={r.porDia} />
      </Secao>

      <div className="grid gap-6 lg:grid-cols-2">
        <Secao titulo="Do bruto ao resultado">
          <div className="flex flex-col text-sm">
            <Linha rotulo="Bruto (itens)" valor={t.brutoCentavos} />
            <Linha rotulo="Descontos" valor={t.descontosCentavos} sinal="−" />
            <Linha rotulo="Cobrado dos clientes" valor={t.cobradoCentavos} sinal="=" />
            <Linha rotulo="Taxas das maquininhas" valor={t.taxasCentavos} sinal="−" />
            <Linha rotulo="Líquido" valor={t.liquidoCentavos} sinal="=" />
            <Linha rotulo="Comissões" valor={t.comissoesCentavos} sinal="−" />
            <Linha
              rotulo="Custo de produtos (ficha técnica)"
              valor={t.custoProdutosCentavos}
              sinal="−"
            />
            <Linha rotulo="Resultado do salão" valor={t.resultadoCentavos} sinal="=" />
          </div>
        </Secao>

        <Secao titulo="Por forma de pagamento">
          {r.porForma.length === 0 ? (
            <p className="text-sm text-suave">Nenhum pagamento no período.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-suave">
                <tr>
                  <th className="py-1 font-normal">Forma</th>
                  <th className="py-1 text-right font-normal">Valor</th>
                  <th className="py-1 text-right font-normal">%</th>
                  <th className="py-1 text-right font-normal">Taxas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {r.porForma.map((f) => (
                  <tr key={f.forma}>
                    <td className="py-1.5">{ROTULO_FORMA_PAGAMENTO[f.forma]}</td>
                    <td className="py-1.5 text-right tabular-nums">
                      {formatarPreco(f.valorCentavos)}
                    </td>
                    <td className="py-1.5 text-right tabular-nums text-suave">
                      {Math.round((f.valorCentavos / totalFormas) * 100)}%
                    </td>
                    <td className="py-1.5 text-right tabular-nums text-suave">
                      {formatarPreco(f.taxasCentavos)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Secao>
      </div>

      <Secao
        titulo="Por profissional"
        descricao="Valor dos serviços (antes do desconto da comanda)."
      >
        {r.porProfissional.length === 0 ? (
          <p className="text-sm text-suave">Nenhum serviço no período.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-suave">
                <tr>
                  <th className="py-1 font-normal">Profissional</th>
                  <th className="py-1 text-right font-normal">Serviços</th>
                  <th className="py-1 text-right font-normal">Faturado</th>
                  <th className="py-1 text-right font-normal">Comissão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borda">
                {r.porProfissional.map((p) => (
                  <tr key={p.profissionalId}>
                    <td className="py-1.5">{p.nome}</td>
                    <td className="py-1.5 text-right tabular-nums">{p.servicos}</td>
                    <td className="py-1.5 text-right tabular-nums">
                      {formatarPreco(p.valorCentavos)}
                    </td>
                    <td className="py-1.5 text-right tabular-nums text-suave">
                      {formatarPreco(p.comissaoCentavos)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Secao>

      <div className="grid gap-6 lg:grid-cols-2">
        <Secao titulo="Serviços que mais faturaram">
          <Ranking itens={r.servicos} unidade="atend." />
        </Secao>
        <Secao titulo="Produtos vendidos">
          <Ranking itens={r.produtos} unidade="un." />
        </Secao>
      </div>
    </div>
  );
}
