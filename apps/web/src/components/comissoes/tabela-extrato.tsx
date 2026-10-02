import { formatarPercentual, formatarPreco, type ExtratoComissoes } from '@salonflow/shared';
import { dataLocal, horaLocal } from '@/lib/data-hora';

/** Extrato agrupado por profissional; cada um expande para ver os atendimentos. */
export function TabelaExtrato({ extrato, fuso }: { extrato: ExtratoComissoes; fuso: string }) {
  if (extrato.profissionais.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-borda p-6 text-center text-sm text-suave">
        Nenhuma comanda fechada no período.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 text-sm">
      {extrato.profissionais.map((p) => (
        <details key={p.profissionalId} className="rounded-lg border border-borda">
          <summary className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
            <span className="flex-1 font-medium">{p.nome}</span>
            <span className="text-suave">
              {p.quantidade} atendimento(s) · {formatarPreco(p.totalServicosCentavos)}
            </span>
            <span className="font-semibold">{formatarPreco(p.totalComissaoCentavos)}</span>
          </summary>
          <div className="overflow-x-auto border-t border-borda">
            <table className="w-full text-left text-xs">
              <thead className="text-suave">
                <tr>
                  <th className="px-3 py-2 font-medium">Data</th>
                  <th className="px-3 py-2 font-medium">Comanda</th>
                  <th className="px-3 py-2 font-medium">Serviço</th>
                  <th className="px-3 py-2 font-medium">Cliente</th>
                  <th className="px-3 py-2 text-right font-medium">Valor</th>
                  <th className="px-3 py-2 text-right font-medium">Base</th>
                  <th className="px-3 py-2 text-right font-medium">%</th>
                  <th className="px-3 py-2 text-right font-medium">Comissão</th>
                </tr>
              </thead>
              <tbody>
                {p.itens.map((i) => (
                  <tr key={i.itemId} className="border-t border-borda">
                    <td className="px-3 py-2 whitespace-nowrap">
                      {dataLocal(i.fechadaEm, fuso).split('-').reverse().slice(0, 2).join('/')}{' '}
                      {horaLocal(i.fechadaEm, fuso)}
                    </td>
                    <td className="px-3 py-2">#{i.comandaNumero}</td>
                    <td className="px-3 py-2">{i.descricao}</td>
                    <td className="px-3 py-2">{i.cliente ?? '—'}</td>
                    <td className="px-3 py-2 text-right">{formatarPreco(i.valorCentavos)}</td>
                    <td className="px-3 py-2 text-right">
                      {formatarPreco(i.baseComissaoCentavos)}
                    </td>
                    <td className="px-3 py-2 text-right">{formatarPercentual(i.comissaoBps)}</td>
                    <td className="px-3 py-2 text-right font-medium">
                      {formatarPreco(i.comissaoCentavos)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      ))}
      <p className="flex justify-end gap-4 px-4 pt-2">
        <span className="text-suave">
          Total em serviços: {formatarPreco(extrato.totalServicosCentavos)}
        </span>
        <span>
          Total de comissões: <strong>{formatarPreco(extrato.totalComissaoCentavos)}</strong>
        </span>
      </p>
    </div>
  );
}
