'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { criarSupabaseBrowser } from '@/lib/supabase/client';
import { Campo, classeBotaoPrimario, classeInput, MensagemForm } from '@/components/ui/campo';
import { traduzirErroAuth } from './erros-auth';

/** Troca a senha da conta logada (e encerra a "senha provisória" criada pelo salão). */
export function FormDefinirSenha() {
  const router = useRouter();
  const [resultado, setResultado] = useState<{ ok: boolean; texto: string } | null>(null);
  const [pendente, iniciar] = useTransition();

  function salvar(formData: FormData) {
    const senha = String(formData.get('senha') ?? '');
    if (senha !== String(formData.get('confirmacao') ?? '')) {
      setResultado({ ok: false, texto: 'As senhas não conferem.' });
      return;
    }
    iniciar(async () => {
      const { error } = await criarSupabaseBrowser().auth.updateUser({
        password: senha,
        data: { senha_provisoria: false },
      });
      if (error) {
        setResultado({ ok: false, texto: traduzirErroAuth(error.message) });
        return;
      }
      setResultado({ ok: true, texto: 'Senha alterada.' });
      router.refresh();
    });
  }

  return (
    <form action={salvar} className="flex flex-col gap-3">
      <Campo rotulo="Nova senha" ajuda="Mínimo de 6 caracteres.">
        <input
          name="senha"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className={classeInput}
        />
      </Campo>
      <Campo rotulo="Repita a nova senha">
        <input
          name="confirmacao"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className={classeInput}
        />
      </Campo>
      {resultado && <MensagemForm sucesso={resultado.ok} mensagem={resultado.texto} />}
      <button type="submit" disabled={pendente} className={`${classeBotaoPrimario} self-start`}>
        {pendente ? 'Salvando…' : 'Alterar senha'}
      </button>
    </form>
  );
}
