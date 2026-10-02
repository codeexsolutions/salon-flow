'use client';

import { useState, useTransition } from 'react';
import { ROTULO_UNIDADE, type ProdutoResumo } from '@salonflow/shared';
import { movimentarEstoque } from '@/app/admin/(painel)/estoque/actions';
import { classeBotaoPrimario, classeInput, MensagemForm } from '@/components/ui/campo';

/** Entrada (em embalagens ou na unidade) e ajuste manual do saldo. */
export function MovimentarEstoque({ produto }: { produto: ProdutoResumo }) {
  const [tipo, setTipo] = useState<'ENTRADA' | 'AJUSTE'>('ENTRADA');
  const [emEmbalagens, setEmEmbalagens] = useState(produto.tamanhoEmbalagem > 1);
  const [quantidade, setQuantidade] = useState('');
  const [observacao, setObservacao] = useState('');
  const [retorno, setRetorno] = useState<{ sucesso: boolean; mensagem: string } | null>(null);
  const [pendente, iniciar] = useTransition();
  const unidade = ROTULO_UNIDADE[produto.unidade];

  const numero = Number(quantidade.replace(',', '.'));
  const naUnidade = Math.round(
    emEmbalagens && tipo === 'ENTRADA' ? numero * produto.tamanhoEmbalagem : numero,
  );

  function salvar() {
    if (!Number.isFinite(naUnidade) || naUnidade === 0) {
      setRetorno({ sucesso: false, mensagem: 'Informe a quantidade.' });
      return;
    }
    iniciar(async () => {
      const r = await movimentarEstoque(produto.id, {
        tipo,
        quantidade: naUnidade,
        observacao: observacao.trim() || undefined,
      });
      if (r.ok) {
        setQuantidade('');
        setObservacao('');
        setRetorno({ sucesso: true, mensagem: 'Estoque atualizado.' });
      } else setRetorno({ sucesso: false, mensagem: r.erro });
    });
  }

  return (
    <div className="flex flex-col gap-3 text-sm">
      <div className="flex gap-4">
        {(['ENTRADA', 'AJUSTE'] as const).map((t) => (
          <label key={t} className="flex items-center gap-1">
            <input type="radio" checked={tipo === t} onChange={() => setTipo(t)} />
            {t === 'ENTRADA' ? 'Entrada (compra)' : 'Ajuste (perda, contagem)'}
          </label>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={quantidade}
          onChange={(e) => setQuantidade(e.target.value)}
          inputMode="decimal"
          placeholder={tipo === 'AJUSTE' ? 'Ex.: -50' : 'Quantidade'}
          aria-label="Quantidade"
          className={`${classeInput} w-32`}
        />
        {tipo === 'ENTRADA' && produto.tamanhoEmbalagem > 1 ? (
          <select
            value={emEmbalagens ? 'emb' : 'un'}
            onChange={(e) => setEmEmbalagens(e.target.value === 'emb')}
            aria-label="Unidade da quantidade"
            className={`${classeInput} w-auto`}
          >
            <option value="emb">
              embalagem(ns) de {produto.tamanhoEmbalagem} {unidade}
            </option>
            <option value="un">{unidade}</option>
          </select>
        ) : (
          <span>{unidade}</span>
        )}
        {tipo === 'ENTRADA' && emEmbalagens && numero > 0 && (
          <span className="text-xs text-suave">
            = {naUnidade.toLocaleString('pt-BR')} {unidade}
          </span>
        )}
      </div>
      <input
        value={observacao}
        onChange={(e) => setObservacao(e.target.value)}
        placeholder="Observação (opcional): nota fiscal, motivo do ajuste…"
        maxLength={200}
        className={classeInput}
      />
      {tipo === 'AJUSTE' && (
        <p className="text-xs text-suave">
          Use número negativo para retirar (ex.: -30) e positivo para somar.
        </p>
      )}
      {retorno && <MensagemForm sucesso={retorno.sucesso} mensagem={retorno.mensagem} />}
      <button
        type="button"
        onClick={salvar}
        disabled={pendente}
        className={`${classeBotaoPrimario} self-start`}
      >
        {pendente ? 'Salvando…' : tipo === 'ENTRADA' ? 'Lançar entrada' : 'Lançar ajuste'}
      </button>
    </div>
  );
}
