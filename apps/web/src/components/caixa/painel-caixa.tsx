'use client';

import { useState, useTransition } from 'react';
import {
  centavosParaTexto,
  formatarPreco,
  textoParaCentavos,
  type CaixaDetalhe,
} from '@salonflow/shared';
import { abrirCaixa, fecharCaixa, movimentarCaixa } from '@/app/admin/(painel)/caixa/actions';
import type { Resultado } from '@/lib/api/resultado';
import {
  classeBotaoPrimario,
  classeBotaoSecundario,
  classeInput,
  MensagemForm,
} from '@/components/ui/campo';
import { Secao } from '@/components/ui/secao';
import { ResumoCaixa } from './resumo-caixa';

/** Abrir o caixa (quando não há um aberto). */
export function AbrirCaixa() {
  const [troco, setTroco] = useState('');
  const { executar, pendente, retorno } = useAcao();

  return (
    <Secao titulo="Caixa fechado" descricao="Abra o caixa informando o troco que está na gaveta.">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span>Troco inicial R$</span>
        <input
          value={troco}
          onChange={(e) => setTroco(e.target.value)}
          inputMode="decimal"
          placeholder="0,00"
          aria-label="Troco inicial"
          className={`${classeInput} w-32`}
        />
        <button
          type="button"
          disabled={pendente}
          onClick={() => {
            const centavos = textoParaCentavos(troco || '0');
            executar(() =>
              centavos === null
                ? Promise.resolve({ ok: false as const, erro: 'Valor inválido. Ex.: 100,00' })
                : abrirCaixa({ trocoInicialCentavos: centavos }),
            );
          }}
          className={classeBotaoPrimario}
        >
          Abrir caixa
        </button>
      </div>
      {retorno}
    </Secao>
  );
}

/** Caixa aberto: conferência parcial, sangria/reforço e fechamento. */
export function CaixaAberto({ caixa, fusoHorario }: { caixa: CaixaDetalhe; fusoHorario: string }) {
  const [tipo, setTipo] = useState<'SANGRIA' | 'REFORCO'>('SANGRIA');
  const [valor, setValor] = useState('');
  const [motivo, setMotivo] = useState('');
  const [contado, setContado] = useState(centavosParaTexto(caixa.esperadoDinheiroCentavos));
  const [observacoes, setObservacoes] = useState('');
  const mov = useAcao();
  const fech = useAcao();

  const contadoCentavos = textoParaCentavos(contado || '0');
  const diferenca =
    contadoCentavos === null ? null : contadoCentavos - caixa.esperadoDinheiroCentavos;

  return (
    <div className="flex flex-col gap-6">
      <ResumoCaixa caixa={caixa} fusoHorario={fusoHorario} />

      <Secao titulo="Sangria ou reforço">
        <div className="flex flex-wrap gap-4 text-sm">
          {(['SANGRIA', 'REFORCO'] as const).map((t) => (
            <label key={t} className="flex items-center gap-1">
              <input type="radio" checked={tipo === t} onChange={() => setTipo(t)} />
              {t === 'SANGRIA' ? 'Sangria (retirar dinheiro)' : 'Reforço (colocar dinheiro)'}
            </label>
          ))}
        </div>
        <div className="grid gap-2 text-sm sm:grid-cols-[8rem_1fr_auto]">
          <input
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            inputMode="decimal"
            placeholder="Valor"
            aria-label="Valor"
            className={classeInput}
          />
          <input
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder={
              tipo === 'SANGRIA' ? 'Motivo: depósito, pagamento de fornecedor…' : 'Motivo: troco…'
            }
            maxLength={200}
            aria-label="Motivo"
            className={classeInput}
          />
          <button
            type="button"
            disabled={mov.pendente}
            onClick={() => {
              const centavos = textoParaCentavos(valor);
              mov.executar(
                () =>
                  centavos === null
                    ? Promise.resolve({ ok: false as const, erro: 'Valor inválido.' })
                    : movimentarCaixa({ tipo, valorCentavos: centavos, motivo }),
                () => {
                  setValor('');
                  setMotivo('');
                },
              );
            }}
            className={classeBotaoSecundario}
          >
            Registrar
          </button>
        </div>
        {mov.retorno}
      </Secao>

      <Secao titulo="Fechar caixa" descricao="Conte o dinheiro da gaveta e informe o valor.">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span>Dinheiro contado R$</span>
          <input
            value={contado}
            onChange={(e) => setContado(e.target.value)}
            inputMode="decimal"
            aria-label="Dinheiro contado"
            className={`${classeInput} w-32`}
          />
          {diferenca !== null && (
            <span className={diferenca === 0 ? 'text-green-700' : 'text-amber-700'}>
              {diferenca === 0
                ? 'Confere com o esperado'
                : diferenca > 0
                  ? `Sobra de ${formatarPreco(diferenca)}`
                  : `Falta de ${formatarPreco(-diferenca)}`}
            </span>
          )}
        </div>
        <input
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Observações do fechamento (opcional)"
          maxLength={500}
          className={`${classeInput} text-sm`}
        />
        <button
          type="button"
          disabled={fech.pendente || contadoCentavos === null}
          onClick={() => {
            if (!confirm('Fechar o caixa?')) return;
            fech.executar(() =>
              fecharCaixa({
                contadoDinheiroCentavos: contadoCentavos,
                observacoes: observacoes.trim() || undefined,
              }),
            );
          }}
          className={`${classeBotaoPrimario} self-start`}
        >
          Fechar caixa
        </button>
        {fech.retorno}
      </Secao>
    </div>
  );
}

function useAcao() {
  const [pendente, iniciar] = useTransition();
  const [resultado, setResultado] = useState<{ sucesso: boolean; mensagem: string } | null>(null);
  return {
    pendente,
    retorno: resultado && (
      <MensagemForm sucesso={resultado.sucesso} mensagem={resultado.mensagem} />
    ),
    executar(acao: () => Promise<Resultado>, depois?: () => void) {
      setResultado(null);
      iniciar(async () => {
        const r = await acao();
        if (r.ok) {
          setResultado({ sucesso: true, mensagem: 'Feito.' });
          depois?.();
        } else setResultado({ sucesso: false, mensagem: r.erro });
      });
    },
  };
}
