import {
  FORMAS_PAGAMENTO,
  formatarPreco,
  ROTULO_FORMA_PAGAMENTO,
  type CaixaDetalhe,
} from '@salonflow/shared';
import { Secao } from '@/components/ui/secao';
import { dataLocal, dataPorExtenso, horaLocal } from '@/lib/data-hora';

/** Conferência do caixa: recebido por forma, movimentos e dinheiro esperado. */
export function ResumoCaixa({ caixa, fusoHorario }: { caixa: CaixaDetalhe; fusoHorario: string }) {
  const fechado = caixa.status === 'FECHADO';
  return (
    <Secao
      titulo={fechado ? 'Caixa fechado' : 'Caixa aberto'}
      descricao={`Aberto em ${dataPorExtenso(dataLocal(caixa.abertoEm, fusoHorario))}, ${horaLocal(caixa.abertoEm, fusoHorario)}${
        caixa.fechadoEm ? ` · fechado às ${horaLocal(caixa.fechadoEm, fusoHorario)}` : ''
      }`}
    >
      <div className="grid gap-4 text-sm sm:grid-cols-2">
        <dl className="grid grid-cols-[1fr_auto] gap-y-1">
          <dt className="col-span-2 mb-1 font-medium">
            Recebido ({caixa.quantidadePagamentos} pagamentos)
          </dt>
          {FORMAS_PAGAMENTO.filter((f) => caixa.totaisPorForma[f]).map((f) => (
            <FragmentoLinha
              key={f}
              rotulo={ROTULO_FORMA_PAGAMENTO[f]}
              valor={caixa.totaisPorForma[f]!}
            />
          ))}
          {caixa.quantidadePagamentos === 0 && (
            <dd className="col-span-2 text-suave">Nenhum pagamento ainda.</dd>
          )}
          <dt className="font-semibold">Total</dt>
          <dd className="font-semibold">{formatarPreco(caixa.totalRecebidoCentavos)}</dd>
        </dl>

        <dl className="grid grid-cols-[1fr_auto] gap-y-1">
          <dt className="col-span-2 mb-1 font-medium">Dinheiro na gaveta</dt>
          <FragmentoLinha rotulo="Troco inicial" valor={caixa.trocoInicialCentavos} />
          <FragmentoLinha
            rotulo="Recebido em dinheiro"
            valor={caixa.totaisPorForma.DINHEIRO ?? 0}
          />
          <FragmentoLinha rotulo="Reforços" valor={caixa.reforcosCentavos} />
          <FragmentoLinha rotulo="Sangrias" valor={-caixa.sangriasCentavos} />
          <dt className="font-semibold">Esperado</dt>
          <dd className="font-semibold">{formatarPreco(caixa.esperadoDinheiroCentavos)}</dd>
          {fechado && caixa.contadoDinheiroCentavos !== null && (
            <>
              <dt>Contado</dt>
              <dd>{formatarPreco(caixa.contadoDinheiroCentavos)}</dd>
              <dt>Diferença</dt>
              <dd className={caixa.diferencaCentavos === 0 ? 'text-sucesso' : 'text-alerta'}>
                {formatarPreco(caixa.diferencaCentavos ?? 0)}
              </dd>
            </>
          )}
        </dl>
      </div>

      {caixa.movimentos.length > 0 && (
        <ul className="flex flex-col divide-y divide-borda border-t border-borda pt-2 text-sm">
          {caixa.movimentos.map((m) => (
            <li key={m.id} className="flex justify-between gap-3 py-1">
              <span>
                <span className="text-suave">{horaLocal(m.criadoEm, fusoHorario)}</span>{' '}
                {m.tipo === 'SANGRIA' ? 'Sangria' : 'Reforço'} · {m.motivo}
              </span>
              <span className={m.tipo === 'SANGRIA' ? 'text-perigo' : 'text-sucesso'}>
                {m.tipo === 'SANGRIA' ? '−' : '+'} {formatarPreco(m.valorCentavos)}
              </span>
            </li>
          ))}
        </ul>
      )}
      {caixa.observacoes && <p className="text-sm text-suave">Observações: {caixa.observacoes}</p>}
    </Secao>
  );
}

function FragmentoLinha({ rotulo, valor }: { rotulo: string; valor: number }) {
  return (
    <>
      <dt className="text-suave">{rotulo}</dt>
      <dd>{valor < 0 ? `− ${formatarPreco(-valor)}` : formatarPreco(valor)}</dd>
    </>
  );
}
