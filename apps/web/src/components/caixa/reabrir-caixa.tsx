'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { reabrirCaixa } from '@/app/admin/(painel)/caixa/actions';
import { classeBotaoSecundario, classeInput, MensagemForm } from '@/components/ui/campo';
import { Secao } from '@/components/ui/secao';

/** Reabrir o caixa fechado para ajuste (só aparece para o dono). */
export function ReabrirCaixa({
  caixaId,
  dataDoCaixa,
  ehDeHoje,
}: {
  caixaId: string;
  /** dd/mm/aaaa do caixa, para o aviso. */
  dataDoCaixa: string;
  ehDeHoje: boolean;
}) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  function reabrir() {
    const aviso = ehDeHoje
      ? 'Reabrir este caixa para ajuste?'
      : `Você está reabrindo o caixa de ${dataDoCaixa}, que não é de hoje. Deseja realmente reabrir?`;
    if (!confirm(aviso)) return;
    setErro(null);
    iniciar(async () => {
      const r = await reabrirCaixa(caixaId, { motivo });
      if (r.ok) router.push('/admin/caixa');
      else setErro(r.erro);
    });
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className={`${classeBotaoSecundario} self-start`}
      >
        Reabrir para ajuste
      </button>
    );
  }

  return (
    <Secao
      titulo="Reabrir caixa"
      descricao="O fechamento atual fica guardado no histórico. Depois do ajuste, feche o caixa de novo."
    >
      <input
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        placeholder="Motivo: lançar serviço que ficou pendente, corrigir valor…"
        maxLength={300}
        aria-label="Motivo da reabertura"
        autoFocus
        className={`${classeInput} text-sm`}
      />
      <div className="flex gap-3">
        <button
          type="button"
          disabled={pendente || motivo.trim().length < 3}
          onClick={reabrir}
          className={classeBotaoSecundario}
        >
          {pendente ? 'Reabrindo…' : 'Reabrir caixa'}
        </button>
        <button type="button" onClick={() => setAberto(false)} className="text-sm text-suave">
          Cancelar
        </button>
      </div>
      {erro && <MensagemForm sucesso={false} mensagem={erro} />}
    </Secao>
  );
}
