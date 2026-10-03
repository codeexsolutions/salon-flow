'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { RefreshCw } from 'lucide-react';
import { definirRecuperacao } from '@/lib/auth/recuperacao-actions';
import { Campo, classeBotaoSecundario, classeInput, MensagemForm } from '@/components/ui/campo';
import { CodigoRecuperacao } from './codigo-recuperacao';

/** Conta > Senha: gera um código novo (o anterior deixa de valer). */
export function GerarCodigoRecuperacao({ jaTem }: { jaTem: boolean }) {
  const router = useRouter();
  const [codigo, setCodigo] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  if (codigo) {
    return (
      <CodigoRecuperacao
        codigo={codigo}
        rotuloContinuar="Concluir"
        aoContinuar={() => {
          setCodigo(null);
          router.refresh();
        }}
      />
    );
  }

  return (
    <form
      action={(formData) => {
        setErro(null);
        iniciar(async () => {
          const r = await definirRecuperacao(String(formData.get('telefone') ?? ''));
          if (r.ok) setCodigo(r.dados.codigo);
          else setErro(r.erro);
        });
      }}
      className="flex flex-col gap-3 text-sm"
    >
      {!jaTem && (
        <MensagemForm mensagem="Você ainda não tem código de recuperação. Sem ele, não há como recuperar a senha se esquecer." />
      )}
      <Campo rotulo="Seu celular" ajuda="Com DDD. Será pedido junto com o código.">
        <input name="telefone" type="tel" required inputMode="tel" className={classeInput} />
      </Campo>
      {erro && <MensagemForm mensagem={erro} />}
      <button type="submit" disabled={pendente} className={`${classeBotaoSecundario} self-start`}>
        <RefreshCw className="size-4" aria-hidden />
        {pendente ? 'Gerando…' : jaTem ? 'Gerar novo código' : 'Gerar meu código'}
      </button>
      {jaTem && <p className="text-xs text-suave">Ao gerar um novo, o código anterior deixa de valer.</p>}
    </form>
  );
}
