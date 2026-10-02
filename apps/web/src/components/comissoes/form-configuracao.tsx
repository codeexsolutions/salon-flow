'use client';

import { useState, useTransition } from 'react';
import {
  FORMAS_PAGAMENTO,
  ROTULO_FORMA_PAGAMENTO,
  textoParaBps,
  type ConfiguracaoComissao,
  type FormaPagamento,
} from '@salonflow/shared';
import { salvarConfiguracaoComissao } from '@/app/admin/(painel)/comissoes/actions';
import { classeBotaoPrimario, MensagemForm } from '@/components/ui/campo';

const paraTexto = (bps: number) => String(bps / 100).replace('.', ',');

/** Percentual padrão, base de cálculo e taxas por forma de pagamento. */
export function FormConfiguracao({ configuracao }: { configuracao: ConfiguracaoComissao }) {
  const [padrao, setPadrao] = useState(paraTexto(configuracao.comissaoPadraoBps));
  const [sobreLiquido, setSobreLiquido] = useState(configuracao.comissaoSobreLiquido);
  const [taxas, setTaxas] = useState<Record<FormaPagamento, string>>(
    () =>
      Object.fromEntries(
        FORMAS_PAGAMENTO.map((f) => {
          const t = configuracao.taxas.find((x) => x.forma === f);
          return [f, t ? paraTexto(t.taxaBps) : ''];
        }),
      ) as Record<FormaPagamento, string>,
  );
  const [retorno, setRetorno] = useState<{ sucesso: boolean; mensagem: string } | null>(null);
  const [pendente, iniciar] = useTransition();

  function salvar() {
    const padraoBps = textoParaBps(padrao);
    const taxasBps = FORMAS_PAGAMENTO.map((forma) => ({
      forma,
      taxaBps: taxas[forma].trim() ? textoParaBps(taxas[forma]) : 0,
    }));
    if (padraoBps === null || taxasBps.some((t) => t.taxaBps === null)) {
      setRetorno({ sucesso: false, mensagem: 'Use percentuais entre 0 e 100, ex.: 50 ou 2,99.' });
      return;
    }
    iniciar(async () => {
      const r = await salvarConfiguracaoComissao({
        comissaoPadraoBps: padraoBps,
        comissaoSobreLiquido: sobreLiquido,
        taxas: taxasBps,
      });
      setRetorno(
        r.ok
          ? { sucesso: true, mensagem: 'Configuração salva.' }
          : { sucesso: false, mensagem: r.erro },
      );
    });
  }

  return (
    <div className="flex flex-col gap-4 text-sm">
      <label className="flex items-center gap-2">
        <span className="font-medium">Comissão padrão</span>
        <input
          value={padrao}
          onChange={(e) => setPadrao(e.target.value)}
          inputMode="decimal"
          className="w-20 rounded-md border border-borda bg-transparent px-2 py-1"
        />
        %<span className="text-xs text-suave">vale quando não há regra específica</span>
      </label>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 font-medium">
          Taxas por forma de pagamento (maquininha, etc.)
        </legend>
        <div className="flex flex-wrap gap-3">
          {FORMAS_PAGAMENTO.map((forma) => (
            <label key={forma} className="flex items-center gap-1">
              {ROTULO_FORMA_PAGAMENTO[forma]}
              <input
                value={taxas[forma]}
                onChange={(e) => setTaxas((t) => ({ ...t, [forma]: e.target.value }))}
                inputMode="decimal"
                placeholder="0"
                className="w-16 rounded-md border border-borda bg-transparent px-2 py-1"
              />
              %
            </label>
          ))}
        </div>
      </fieldset>

      <label className="flex items-start gap-2">
        <input
          type="checkbox"
          checked={sobreLiquido}
          onChange={(e) => setSobreLiquido(e.target.checked)}
          className="mt-1"
        />
        <span>
          Calcular comissão sobre o valor <strong>líquido</strong> (descontando a taxa do pagamento)
          <span className="block text-xs text-suave">
            Ex.: corte de R$ 100 no crédito com taxa de 3% → comissão calculada sobre R$ 97.
          </span>
        </span>
      </label>

      {retorno && <MensagemForm sucesso={retorno.sucesso} mensagem={retorno.mensagem} />}
      <button
        type="button"
        onClick={salvar}
        disabled={pendente}
        className={`${classeBotaoPrimario} self-start`}
      >
        {pendente ? 'Salvando…' : 'Salvar configuração'}
      </button>
    </div>
  );
}
