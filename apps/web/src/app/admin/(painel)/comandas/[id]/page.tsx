import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  formatarPercentual,
  formatarPreco,
  ROTULO_FORMA_PAGAMENTO,
  type AnotacaoCliente,
  type ComandaDetalhe,
  type MaquininhaDto,
  type ProdutoResumo,
  type ProfissionalResumo,
  type ServicoResumo,
} from '@salonflow/shared';
import { DataAtendimento } from '@/components/comandas/data-atendimento';
import { EditorComanda } from '@/components/comandas/editor-comanda';
import { ReabrirComanda } from '@/components/comandas/reabrir-comanda';
import { Secao } from '@/components/ui/secao';
import { ApiError } from '@/lib/api/client';
import { apiSalao } from '@/lib/api/salao';
import { obterContextoAdmin, pode } from '@/lib/auth/contexto';
import { dataLocal, dataPorExtenso, hojeNoFuso, horaLocal, somarDias } from '@/lib/data-hora';

const dma = (data: string) => data.split('-').reverse().join('/');

async function carregar(id: string) {
  try {
    return await apiSalao<ComandaDetalhe>(`/comandas/${id}`);
  } catch (erro) {
    if (erro instanceof ApiError && [400, 404].includes(erro.erro.statusCode)) notFound();
    throw erro;
  }
}

export default async function ComandaPage({ params }: PageProps<'/admin/comandas/[id]'>) {
  const { id } = await params;
  const [{ salao }, comanda] = await Promise.all([obterContextoAdmin(), carregar(id)]);
  const fuso = salao.fusoHorario;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <Link href="/admin/comandas" className="text-sm text-suave">
          ← Comandas
        </Link>
        <h1 className="mt-2 text-3xl">Comanda #{comanda.numero}</h1>
        <p className="text-sm text-suave">
          Aberta em {dataPorExtenso(dataLocal(comanda.abertaEm, fuso))},{' '}
          {horaLocal(comanda.abertaEm, fuso)}
          {comanda.status === 'FECHADA' && <InfoFechamento comanda={comanda} fuso={fuso} />}
          {comanda.status === 'CANCELADA' && ' · cancelada'}
        </p>
      </div>

      {comanda.cliente && (
        <FichaResumo clienteId={comanda.cliente.id} verFicha={pode(salao, 'CLIENTES')} />
      )}

      {comanda.status === 'ABERTA' ? (
        <EditorAberta comanda={comanda} ehDono={salao.papel === 'DONO'} fuso={fuso} />
      ) : (
        <ComandaEncerrada comanda={comanda} ehDono={salao.papel === 'DONO'} fuso={fuso} />
      )}
    </div>
  );
}

/** Últimos registros da ficha técnica do cliente (fórmulas, tons) para o atendimento. */
async function FichaResumo({ clienteId, verFicha }: { clienteId: string; verFicha: boolean }) {
  const anotacoes = await apiSalao<AnotacaoCliente[]>(
    `/clientes/${clienteId}/anotacoes?limite=2`,
  ).catch(() => [] as AnotacaoCliente[]);
  if (anotacoes.length === 0) return null;
  return (
    <section className="flex flex-col gap-2 rounded-xl border border-primaria/30 bg-nude/40 p-3 text-sm print:hidden">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-medium">Ficha técnica do cliente</h2>
        {verFicha && (
          <Link href={`/admin/clientes/${clienteId}`} className="text-xs text-primaria">
            Ver ficha completa
          </Link>
        )}
      </div>
      <ul className="flex flex-col gap-2">
        {anotacoes.map((a) => (
          <li key={a.id}>
            <span className="text-xs text-suave">
              {dma(a.data)}
              {a.servico && ` · ${a.servico.nome}`}
              {a.profissional && ` · ${a.profissional.nome}`}
            </span>
            <p className="whitespace-pre-line">{a.texto}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Fechada às HH:MM; se lançada depois, mostra o dia do atendimento e o do lançamento. */
function InfoFechamento({ comanda, fuso }: { comanda: ComandaDetalhe; fuso: string }) {
  const atendimento = dataLocal(comanda.fechadaEm!, fuso);
  const lancada = comanda.lancadaEm ? dataLocal(comanda.lancadaEm, fuso) : atendimento;
  if (lancada === atendimento) return <> · fechada às {horaLocal(comanda.fechadaEm!, fuso)}</>;
  return (
    <>
      {' '}
      · atendimento em <strong>{dma(atendimento)}</strong> · lançada em {dma(lancada)},{' '}
      {horaLocal(comanda.lancadaEm!, fuso)}
    </>
  );
}

async function EditorAberta({
  comanda,
  ehDono,
  fuso,
}: {
  comanda: ComandaDetalhe;
  ehDono: boolean;
  fuso: string;
}) {
  const hoje = hojeNoFuso(fuso);
  const dataAtendimento = comanda.competenciaEm ? dataLocal(comanda.competenciaEm, fuso) : null;
  const [servicos, profissionais, produtos, maquininhas] = await Promise.all([
    apiSalao<ServicoResumo[]>('/servicos'),
    apiSalao<ProfissionalResumo[]>('/profissionais'),
    apiSalao<ProdutoResumo[]>('/produtos'),
    // API antiga (sem maquininhas): segue com a taxa por forma de pagamento.
    apiSalao<MaquininhaDto[]>('/maquininhas').catch(() => [] as MaquininhaDto[]),
  ]);
  // A chave recria o editor quando o total muda (pagamento sugerido acompanha).
  return (
    <EditorComanda
      key={`${comanda.id}-${comanda.totalCentavos}`}
      comanda={comanda}
      servicos={servicos}
      profissionais={profissionais}
      produtos={produtos.filter((p) => p.precoVendaCentavos !== null)}
      maquininhas={maquininhas.filter((m) => m.ativo)}
      cabecalho={
        ehDono ? (
          <DataAtendimento
            comandaId={comanda.id}
            data={dataAtendimento === hoje ? null : dataAtendimento}
            hoje={hoje}
            minimo={somarDias(hoje, -30)}
          />
        ) : (
          dataAtendimento &&
          dataAtendimento !== hoje && (
            <p className="rounded-xl border border-alerta/40 bg-alerta/10 px-3 py-2 text-sm">
              Lançamento do dia <strong>{dma(dataAtendimento)}</strong>.
            </p>
          )
        )
      }
    />
  );
}

function ComandaEncerrada({
  comanda,
  ehDono,
  fuso,
}: {
  comanda: ComandaDetalhe;
  ehDono: boolean;
  fuso: string;
}) {
  const fechada = comanda.status === 'FECHADA';
  const totalComissao = comanda.itens.reduce((s, i) => s + (i.comissaoCentavos ?? 0), 0);
  const totalTaxas = comanda.pagamentos.reduce((s, p) => s + p.taxaCentavos, 0);

  return (
    <>
      <Secao titulo={comanda.cliente?.nome ?? 'Sem cliente'}>
        <ul className="flex flex-col divide-y divide-borda rounded-xl border border-borda bg-superficie text-sm">
          {comanda.itens.map((i) => (
            <li key={i.id} className="flex items-center gap-3 px-3 py-2">
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-medium">
                  {i.tipo === 'PRODUTO' && i.quantidade > 1 && `${i.quantidade}× `}
                  {i.descricao}
                </span>
                <span className="text-xs text-suave">
                  {i.tipo === 'PRODUTO' ? 'Venda de produto' : i.profissional?.nome}
                  {fechada && ehDono && !!i.custoProdutosCentavos && (
                    <> · produtos {formatarPreco(i.custoProdutosCentavos)}</>
                  )}
                  {fechada && ehDono && i.tipo === 'SERVICO' && i.comissaoCentavos !== null && (
                    <>
                      {' · comissão '}
                      {formatarPercentual(i.comissaoBps!)} de{' '}
                      {formatarPreco(i.baseComissaoCentavos!)} ={' '}
                      <strong>{formatarPreco(i.comissaoCentavos)}</strong>
                    </>
                  )}
                </span>
              </span>
              <span>{formatarPreco(i.valorCentavos)}</span>
            </li>
          ))}
        </ul>
        <dl className="grid grid-cols-[1fr_auto] gap-y-1 text-sm">
          <dt className="text-suave">Subtotal</dt>
          <dd>{formatarPreco(comanda.subtotalCentavos)}</dd>
          {comanda.descontoCentavos > 0 && (
            <>
              <dt className="text-suave">Desconto</dt>
              <dd>− {formatarPreco(comanda.descontoCentavos)}</dd>
            </>
          )}
          <dt className="font-semibold">Total</dt>
          <dd className="font-semibold">{formatarPreco(comanda.totalCentavos)}</dd>
        </dl>
      </Secao>

      {(comanda.reaberturas ?? []).length > 0 && (
        <ul className="flex flex-col gap-1 text-xs text-suave">
          {comanda.reaberturas.map((r) => (
            <li key={r.reabertaEm}>
              Reaberta em {dma(dataLocal(r.reabertaEm, fuso))} {horaLocal(r.reabertaEm, fuso)} ·{' '}
              {r.motivo} · total anterior {formatarPreco(r.totalAnteriorCentavos)}
            </li>
          ))}
        </ul>
      )}

      {fechada && (
        <Secao titulo="Pagamentos">
          <ul className="text-sm">
            {comanda.pagamentos.map((p) => (
              <li key={p.id} className="flex justify-between">
                <span>
                  {ROTULO_FORMA_PAGAMENTO[p.forma]}
                  {p.maquininha && (
                    <span className="text-suave">
                      {' '}
                      · {p.maquininha.nome}
                      {p.parcelas && p.parcelas > 1 ? ` · ${p.parcelas}x` : ''}
                    </span>
                  )}
                  {p.taxaCentavos > 0 && (
                    <span className="text-suave">
                      {' '}
                      (taxa {formatarPercentual(p.taxaBps)} = {formatarPreco(p.taxaCentavos)})
                    </span>
                  )}
                </span>
                <span>{formatarPreco(p.valorCentavos)}</span>
              </li>
            ))}
          </ul>
          {ehDono && (
            <p className="text-sm text-suave">
              Comissões: <strong className="text-foreground">{formatarPreco(totalComissao)}</strong>
              {totalTaxas > 0 && ` · Taxas: ${formatarPreco(totalTaxas)}`} · Fica para o salão:{' '}
              <strong className="text-foreground">
                {formatarPreco(comanda.totalCentavos - totalComissao - totalTaxas)}
              </strong>
            </p>
          )}
        </Secao>
      )}

      {fechada && ehDono && <ReabrirComanda comandaId={comanda.id} />}
    </>
  );
}
