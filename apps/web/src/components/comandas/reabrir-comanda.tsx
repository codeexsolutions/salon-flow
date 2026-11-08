'use client';

import { useState, useTransition } from 'react';
import { reabrirComanda } from '@/app/admin/(painel)/comandas/actions';
import { classeBotaoSecundario, classeInput, MensagemForm } from '@/components/ui/campo';
import { Secao } from '@/components/ui/secao';

/** Reabrir comanda fechada para correção (só aparece para o dono). */
export function ReabrirComanda({ comandaId }: { comandaId: string }) {
  const [aberto, setAberto] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className={`${classeBotaoSecundario} self-start`}
      >
        Reabrir para correção
      </button>
    );
  }

  return (
    <Secao
      titulo="Reabrir comanda"
      descricao="Os pagamentos saem, o estoque volta e a comissão é recalculada ao fechar de novo. A data do atendimento é mantida."
    >
      <input
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        placeholder="Motivo: profissional errado, valor errado…"
        maxLength={300}
        aria-label="Motivo da reabertura"
        autoFocus
        className={`${classeInput} text-sm`}
      />
      <div className="flex gap-3">
        <button
          type="button"
          disabled={pendente || motivo.trim().length < 3}
          onClick={() => {
            if (!confirm('Reabrir esta comanda para correção?')) return;
            setErro(null);
            iniciar(async () => {
              const r = await reabrirComanda(comandaId, { motivo });
              if (!r.ok) setErro(r.erro);
            });
          }}
          className={classeBotaoSecundario}
        >
          {pendente ? 'Reabrindo…' : 'Reabrir comanda'}
        </button>
        <button type="button" onClick={() => setAberto(false)} className="text-sm text-suave">
          Cancelar
        </button>
      </div>
      {erro && <MensagemForm sucesso={false} mensagem={erro} />}
    </Secao>
  );
}
