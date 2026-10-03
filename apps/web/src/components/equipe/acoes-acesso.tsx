'use client';

import { useState, useTransition } from 'react';
import { alterarAcesso, cancelarConvite } from '@/app/admin/(painel)/equipe/actions';
import type { Resultado } from '@/lib/api/resultado';

/** Botão de texto com confirmação e erro em linha (lista da equipe). */
function AcaoComConfirmacao({
  rotulo,
  confirmacao,
  perigo,
  executar,
}: {
  rotulo: string;
  confirmacao?: string;
  perigo?: boolean;
  executar: () => Promise<Resultado>;
}) {
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  return (
    <span className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pendente}
        onClick={() => {
          if (confirmacao && !window.confirm(confirmacao)) return;
          setErro(null);
          iniciar(async () => {
            const r = await executar();
            if (!r.ok) setErro(r.erro);
          });
        }}
        className={`text-sm font-medium disabled:opacity-50 ${
          perigo ? 'text-perigo hover:underline' : 'text-primaria hover:underline'
        }`}
      >
        {pendente ? 'Aguarde…' : rotulo}
      </button>
      {erro && <span className="text-xs text-perigo">{erro}</span>}
    </span>
  );
}

export function AlternarAcesso({ id, nome, ativo }: { id: string; nome: string; ativo: boolean }) {
  return ativo ? (
    <AcaoComConfirmacao
      rotulo="Remover acesso"
      perigo
      confirmacao={`Remover o acesso de ${nome}? A pessoa deixa de entrar no salão (o histórico é mantido).`}
      executar={() => alterarAcesso(id, false)}
    />
  ) : (
    <AcaoComConfirmacao rotulo="Devolver acesso" executar={() => alterarAcesso(id, true)} />
  );
}

export function CancelarConvite({ id, usuario }: { id: string; usuario: string }) {
  return (
    <AcaoComConfirmacao
      rotulo="Cancelar"
      perigo
      confirmacao={`Cancelar o acesso reservado para @${usuario}?`}
      executar={() => cancelarConvite(id)}
    />
  );
}
