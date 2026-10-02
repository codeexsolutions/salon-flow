import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  formatarPercentual,
  formatarPreco,
  ROTULO_FORMA_PAGAMENTO,
  type ComandaDetalhe,
  type ProdutoResumo,
  type ProfissionalResumo,
  type ServicoResumo,
} from '@salonflow/shared';
import { EditorComanda } from '@/components/comandas/editor-comanda';
import { Secao } from '@/components/ui/secao';
import { ApiError } from '@/lib/api/client';
import { apiSalao } from '@/lib/api/salao';
import { obterContextoAdmin } from '@/lib/auth/contexto';
import { dataLocal, dataPorExtenso, horaLocal } from '@/lib/data-hora';

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
          {comanda.status === 'FECHADA' && ` · fechada às ${horaLocal(comanda.fechadaEm!, fuso)}`}
          {comanda.status === 'CANCELADA' && ' · cancelada'}
        </p>
      </div>

      {comanda.status === 'ABERTA' ? (
        <EditorAberta comanda={comanda} />
      ) : (
        <ComandaEncerrada comanda={comanda} ehDono={salao.papel === 'DONO'} />
      )}
    </div>
  );
}

async function EditorAberta({ comanda }: { comanda: ComandaDetalhe }) {
  const [servicos, profissionais, produtos] = await Promise.all([
    apiSalao<ServicoResumo[]>('/servicos'),
    apiSalao<ProfissionalResumo[]>('/profissionais'),
    apiSalao<ProdutoResumo[]>('/produtos'),
  ]);
  // A chave recria o editor quando o total muda (pagamento sugerido acompanha).
  return (
    <EditorComanda
      key={`${comanda.id}-${comanda.totalCentavos}`}
      comanda={comanda}
      servicos={servicos}
      profissionais={profissionais}
      produtos={produtos.filter((p) => p.precoVendaCentavos !== null)}
    />
  );
}

function ComandaEncerrada({ comanda, ehDono }: { comanda: ComandaDetalhe; ehDono: boolean }) {
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

      {fechada && (
        <Secao titulo="Pagamentos">
          <ul className="text-sm">
            {comanda.pagamentos.map((p) => (
              <li key={p.id} className="flex justify-between">
                <span>
                  {ROTULO_FORMA_PAGAMENTO[p.forma]}
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
    </>
  );
}
