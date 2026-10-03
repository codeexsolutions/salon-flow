'use client';

import { useState, useTransition } from 'react';
import { KeyRound } from 'lucide-react';
import { redefinirSenhaMembro } from '@/app/admin/(painel)/equipe/actions';
import { Dialogo } from '@/components/ui/dialogo';
import { classeBotaoPrimario, MensagemForm } from '@/components/ui/campo';
import { gerarSenhaProvisoria } from '@/lib/auth/senha-provisoria';
import { DadosDeAcesso } from './adicionar-recepcao';

/** O dono gera uma senha provisória nova para quem esqueceu a dele. */
export function RedefinirSenha({ id, nome, usuario }: { id: string; nome: string; usuario: string }) {
  const [aberto, setAberto] = useState(false);
  const [senha, setSenha] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  function fechar() {
    setAberto(false);
    setSenha(null);
    setErro(null);
  }

  function redefinir() {
    setErro(null);
    const nova = gerarSenhaProvisoria();
    iniciar(async () => {
      const r = await redefinirSenhaMembro(id, nova);
      if (r.ok) setSenha(nova);
      else setErro(r.erro);
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="inline-flex items-center gap-1 text-sm font-medium text-primaria hover:underline"
      >
        <KeyRound className="size-3.5" aria-hidden /> Redefinir senha
      </button>
      <Dialogo aberto={aberto} aoFechar={fechar} titulo={`Redefinir senha de ${nome}`}>
        {senha ? (
          <DadosDeAcesso
            nome={nome}
            usuario={usuario}
            senha={senha}
            titulo={`Senha redefinida! Entregue os dados abaixo para ${nome}.`}
          />
        ) : (
          <div className="flex flex-col gap-4 text-sm">
            <p>
              Uma senha provisória nova será gerada para <strong>@{usuario}</strong>. A senha atual
              deixa de funcionar e, ao entrar, a pessoa cria a dela.
            </p>
            {erro && <MensagemForm mensagem={erro} />}
            <button
              type="button"
              onClick={redefinir}
              disabled={pendente}
              className={`${classeBotaoPrimario} self-start`}
            >
              {pendente ? 'Gerando…' : 'Gerar senha nova'}
            </button>
          </div>
        )}
      </Dialogo>
    </>
  );
}
