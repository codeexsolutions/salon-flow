import { formatarPreco, ROTULO_FORMA_PAGAMENTO, type RepasseDetalhe } from '@salonflow/shared';
import { dataLocal, horaLocal } from '@/lib/data-hora';

const dataBr = (data: string) => data.split('-').reverse().join('/');

/**
 * Comprovante de repasse no modelo salão-parceiro (Lei 13.352/2016): para cada
 * atendimento, a cota-parte do salão e a do profissional-parceiro.
 */
export function ComprovanteRepasse({ repasse: r }: { repasse: RepasseDetalhe }) {
  const fuso = r.salao.fusoHorario;
  const local = [r.salao.cidade, r.salao.uf].filter(Boolean).join(' - ');

  return (
    <article className="flex flex-col gap-5 rounded-xl border border-borda p-6 text-sm print:border-0 print:p-0">
      <header className="flex flex-col gap-1 border-b border-borda pb-4">
        <p className="text-xs uppercase tracking-wide text-suave">
          Comprovante de repasse — salão-parceiro (Lei 13.352/2016)
        </p>
        <h1 className="text-xl font-bold">{r.salao.nome}</h1>
        {local && <p className="text-suave">{local}</p>}
        {r.status === 'CANCELADO' && (
          <p className="mt-2 rounded-md bg-perigo-suave p-2 font-medium text-perigo">
            REPASSE CANCELADO
          </p>
        )}
      </header>

      <dl className="grid grid-cols-[10rem_1fr] gap-y-1">
        <dt className="text-suave">Profissional-parceiro</dt>
        <dd className="font-medium">{r.profissional.nome}</dd>
        <dt className="text-suave">Período</dt>
        <dd>
          {dataBr(r.de)} a {dataBr(r.ate)}
        </dd>
        <dt className="text-suave">Pago em</dt>
        <dd>
          {dataBr(dataLocal(r.pagoEm, fuso))} {horaLocal(r.pagoEm, fuso)}
          {r.formaPagamento && ` · ${ROTULO_FORMA_PAGAMENTO[r.formaPagamento]}`}
        </dd>
      </dl>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-borda text-suave">
            <tr>
              <th className="py-2 pr-2 font-medium">Data</th>
              <th className="py-2 pr-2 font-medium">Comanda</th>
              <th className="py-2 pr-2 font-medium">Serviço</th>
              <th className="py-2 pr-2 font-medium">Cliente</th>
              <th className="py-2 pr-2 text-right font-medium">Valor</th>
              <th className="py-2 pr-2 text-right font-medium">Cota salão</th>
              <th className="py-2 text-right font-medium">Cota profissional</th>
            </tr>
          </thead>
          <tbody>
            {r.itens.map((i, k) => (
              <tr key={k} className="border-b border-borda">
                <td className="py-1.5 pr-2 whitespace-nowrap">
                  {dataBr(dataLocal(i.fechadaEm, fuso)).slice(0, 5)}
                </td>
                <td className="py-1.5 pr-2">#{i.comandaNumero}</td>
                <td className="py-1.5 pr-2">{i.descricao}</td>
                <td className="py-1.5 pr-2">{i.cliente ?? '—'}</td>
                <td className="py-1.5 pr-2 text-right">{formatarPreco(i.valorCentavos)}</td>
                <td className="py-1.5 pr-2 text-right">{formatarPreco(i.cotaSalaoCentavos)}</td>
                <td className="py-1.5 text-right">{formatarPreco(i.comissaoCentavos)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="ml-auto grid w-full max-w-xs grid-cols-[1fr_auto] gap-y-1">
        <dt className="text-suave">Total dos serviços</dt>
        <dd>{formatarPreco(r.totalServicosCentavos)}</dd>
        <dt className="text-suave">Cota-parte do salão</dt>
        <dd>{formatarPreco(r.cotaSalaoCentavos)}</dd>
        <dt className="text-suave">Cota-parte do profissional</dt>
        <dd>{formatarPreco(r.totalComissaoCentavos)}</dd>
        {r.descontosCentavos > 0 && (
          <>
            <dt className="text-suave">Vales / adiantamentos</dt>
            <dd>− {formatarPreco(r.descontosCentavos)}</dd>
          </>
        )}
        <dt className="border-t border-borda pt-1 font-semibold">Valor pago</dt>
        <dd className="border-t border-borda pt-1 font-semibold">
          {formatarPreco(r.valorPagoCentavos)}
        </dd>
      </dl>

      {r.observacoes && <p className="text-suave">Observações: {r.observacoes}</p>}

      <footer className="mt-8 grid grid-cols-2 gap-8 text-center text-xs text-suave">
        <div className="border-t border-foreground pt-1">{r.salao.nome}</div>
        <div className="border-t border-foreground pt-1">{r.profissional.nome}</div>
      </footer>
    </article>
  );
}
