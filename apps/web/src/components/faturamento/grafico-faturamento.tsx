import { formatarPreco, type FaturamentoDia } from '@salonflow/shared';

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

interface Barra {
  chave: string;
  rotulo: string;
  /** Rótulo curto no eixo (só alguns aparecem). */
  eixo: string;
  cobradoCentavos: number;
  comandas: number;
}

/** Até ~2 meses: uma barra por dia. Mais que isso: uma por mês. */
function agrupar(dias: FaturamentoDia[]): Barra[] {
  if (dias.length <= 62) {
    return dias.map((d) => {
      const [, mes, dia] = d.data.split('-');
      return {
        chave: d.data,
        rotulo: `${dia}/${mes}`,
        eixo: dia,
        cobradoCentavos: d.cobradoCentavos,
        comandas: d.comandas,
      };
    });
  }
  const meses = new Map<string, Barra>();
  for (const d of dias) {
    const chave = d.data.slice(0, 7);
    const [ano, mes] = chave.split('-');
    const b = meses.get(chave) ?? {
      chave,
      rotulo: `${MESES[Number(mes) - 1]}/${ano}`,
      eixo: MESES[Number(mes) - 1],
      cobradoCentavos: 0,
      comandas: 0,
    };
    b.cobradoCentavos += d.cobradoCentavos;
    b.comandas += d.comandas;
    meses.set(chave, b);
  }
  return [...meses.values()];
}

/** Barras do faturamento no período (uma série: sem legenda; detalhe ao passar o mouse). */
export function GraficoFaturamento({ dias }: { dias: FaturamentoDia[] }) {
  const barras = agrupar(dias);
  const maximo = Math.max(...barras.map((b) => b.cobradoCentavos), 0);
  if (maximo === 0) {
    return <p className="text-sm text-suave">Nenhuma comanda fechada no período.</p>;
  }
  // Mostra no eixo no máximo ~10 rótulos.
  const passo = Math.ceil(barras.length / 10);

  return (
    <figure className="flex flex-col gap-2">
      <figcaption className="sr-only">
        Faturamento por {barras.length > 1 ? 'dia' : 'período'}
      </figcaption>
      <div className="flex items-end justify-between text-xs text-suave">
        <span>Maior: {formatarPreco(maximo)}</span>
      </div>
      <div className="relative flex h-44 items-end gap-[2px] border-b border-borda">
        {barras.map((b) => (
          <div
            key={b.chave}
            className="group relative flex h-full min-w-0 flex-1 items-end"
            tabIndex={0}
            aria-label={`${b.rotulo}: ${formatarPreco(b.cobradoCentavos)}, ${b.comandas} comanda(s)`}
          >
            <div
              className="w-full rounded-t-[4px] bg-primaria transition-opacity group-hover:opacity-80"
              style={{
                height: `${(b.cobradoCentavos / maximo) * 100}%`,
                minHeight: b.cobradoCentavos > 0 ? 2 : 0,
              }}
            />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-lg border border-borda bg-superficie px-2 py-1 text-xs shadow-md group-hover:block group-focus:block">
              <strong>{b.rotulo}</strong>
              <br />
              {formatarPreco(b.cobradoCentavos)} · {b.comandas} comanda(s)
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-[2px] text-[10px] text-suave">
        {barras.map((b, i) => (
          <span key={b.chave} className="min-w-0 flex-1 text-center">
            {i % passo === 0 ? b.eixo : ''}
          </span>
        ))}
      </div>
    </figure>
  );
}
