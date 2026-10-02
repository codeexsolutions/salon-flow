'use client';

import { useState } from 'react';
import { criarSupabaseBrowser } from '@/lib/supabase/client';
import { classeBotaoPrimario, classeInput } from '@/components/ui/campo';

/** Define a senha da conta logada (modo desenvolvimento). */
export function FormDefinirSenha() {
  const [resultado, setResultado] = useState<{ ok: boolean; texto: string } | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function salvar(formData: FormData) {
    setEnviando(true);
    const { error } = await criarSupabaseBrowser().auth.updateUser({
      password: String(formData.get('senha') ?? ''),
    });
    setEnviando(false);
    setResultado(
      error
        ? { ok: false, texto: `Não foi possível salvar: ${error.message}` }
        : { ok: true, texto: 'Senha definida. Na próxima vez, use "Entrar com senha".' },
    );
  }

  return (
    <form action={salvar} className="flex flex-col gap-3">
      <input
        name="senha"
        type="password"
        required
        minLength={6}
        autoComplete="new-password"
        placeholder="Nova senha (mínimo 6 caracteres)"
        aria-label="Nova senha"
        className={classeInput}
      />
      <button type="submit" disabled={enviando} className={`${classeBotaoPrimario} self-start`}>
        {enviando ? 'Salvando…' : 'Definir senha'}
      </button>
      {resultado && (
        <p className={`text-sm ${resultado.ok ? 'text-green-700' : 'text-red-600'}`}>
          {resultado.texto}
        </p>
      )}
    </form>
  );
}
