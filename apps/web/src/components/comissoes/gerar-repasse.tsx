'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import {
  FORMAS_PAGAMENTO,
  formatarPreco,
  ROTULO_FORMA_PAGAMENTO,
  textoParaCentavos,
  type FormaPagamento,
} from '@salonflow/shared';
import { gerarRepasse } from '@/app/admin/(painel)/comissoes/actions';
import { classeBotaoPrimario, classeInput } from '@/components/ui/campo';

/** Botão "Pagar" do extrato: abre o formulário de repasse do profissional. */
export function GerarRepasse({
  profissionalId,
  nome,
  pendenteCentavos,
  de,
  ate,
}: {
  profissionalId: string;
  nome: string;
  pendenteCentavos: number;
  de: string;
  ate: string;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [vale, setVale] = useState('');
  const [forma, setForma] = useState<FormaPagamento>('PIX');
  const [observacoes, setObservacoes] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  const valeCentavos = textoParaCentavos(vale || '0');
  const aPagar = valeCentavos === null ? null : pendenteCentavos - valeCentavos;

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="text-sm font-medium text-primaria"
      >
        Pagar {formatarPreco(pendenteCentavos)}
      </button>
    );
  }

  function confirmar() {
    if (valeCentavos === null) {
      setErro('Vale inválido. Ex.: 50,00');
      return;
    }
    setErro(null);
    iniciar(async () => {
      const r = await gerarRepasse({
        profissionalId,
        de,
        ate,
        descontosCentavos: valeCentavos,
        formaPagamento: forma,
        observacoes: observacoes.trim() || undefined,
      });
      if (r.ok) router.push(`/admin/comissoes/repasses/${r.dados}`);
      else setErro(r.erro);
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-borda p-3 text-sm">
      <p className="font-medium">
        Repasse para {nome}: {formatarPreco(pendenteCentavos)} em comissões pendentes
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1">
          Vales / adiantamentos R$
          <input
            value={vale}
            onChange={(e) => setVale(e.target.value)}
            inputMode="decimal"
            placeholder="0,00"
            className={`${classeInput} w-24`}
          />
        </label>
        <select
          value={forma}
          onChange={(e) => setForma(e.target.value as FormaPagamento)}
          aria-label="Forma de pagamento do repasse"
          className={`${classeInput} w-auto`}
        >
          {FORMAS_PAGAMENTO.map((f) => (
            <option key={f} value={f}>
              {ROTULO_FORMA_PAGAMENTO[f]}
            </option>
          ))}
        </select>
      </div>
      <input
        value={observacoes}
        onChange={(e) => setObservacoes(e.target.value)}
        placeholder="Observação (opcional)"
        maxLength={500}
        className={classeInput}
      />
      {aPagar !== null && (
        <p>
          Valor a pagar: <strong>{formatarPreco(Math.max(0, aPagar))}</strong>
        </p>
      )}
      {erro && (
        <p role="alert" className="text-red-600">
          {erro}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={confirmar}
          disabled={pendente}
          className={classeBotaoPrimario}
        >
          {pendente ? 'Gerando…' : 'Confirmar pagamento'}
        </button>
        <button type="button" onClick={() => setAberto(false)} className="text-suave">
          Cancelar
        </button>
      </div>
    </div>
  );
}
