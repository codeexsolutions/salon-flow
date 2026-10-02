'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { criarSupabaseBrowser } from '@/lib/supabase/client';
import { classeInput } from '@/components/ui/campo';

/**
 * Login com e-mail e senha — SÓ em desenvolvimento (NEXT_PUBLIC_LOGIN_SENHA=true).
 * Evita esperar o link por e-mail e permite criar contas de teste na hora.
 */
export function FormSenha({ next }: { next: string | null }) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(formData: FormData) {
    const email = String(formData.get('email') ?? '').trim();
    const senha = String(formData.get('senha') ?? '');
    const criarConta = formData.get('acao') === 'criar';
    const auth = criarSupabaseBrowser().auth;

    setEnviando(true);
    setErro(null);
    setAviso(null);

    const { data, error } = criarConta
      ? await auth.signUp({ email, password: senha })
      : await auth.signInWithPassword({ email, password: senha });

    setEnviando(false);
    if (error) {
      setErro(traduzirErro(error.message));
      return;
    }
    if (!data.session) {
      setAviso(
        'Conta criada, mas o Supabase exige confirmação por e-mail. Desative "Confirm email" no painel para entrar na hora.',
      );
      return;
    }
    router.push(next ? `/auth/continuar?next=${encodeURIComponent(next)}` : '/auth/continuar');
    router.refresh();
  }

  return (
    <details className="rounded-xl border border-dashed border-amber-400 p-4">
      <summary className="cursor-pointer text-sm font-medium text-amber-700">
        Entrar com senha (modo desenvolvimento)
      </summary>
      <form action={enviar} className="mt-4 flex flex-col gap-3">
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="E-mail"
          aria-label="E-mail"
          className={classeInput}
        />
        <input
          name="senha"
          type="password"
          required
          minLength={6}
          autoComplete="current-password"
          placeholder="Senha (mínimo 6 caracteres)"
          aria-label="Senha"
          className={classeInput}
        />
        <div className="flex gap-2">
          <button
            type="submit"
            name="acao"
            value="entrar"
            disabled={enviando}
            className="flex-1 rounded-lg bg-amber-600 px-4 py-2 font-medium text-white disabled:opacity-60"
          >
            Entrar
          </button>
          <button
            type="submit"
            name="acao"
            value="criar"
            disabled={enviando}
            className="flex-1 rounded-lg border border-amber-600 px-4 py-2 font-medium text-amber-700 disabled:opacity-60"
          >
            Criar conta de teste
          </button>
        </div>
        {erro && (
          <p role="alert" className="text-sm text-red-600">
            {erro}
          </p>
        )}
        {aviso && <p className="text-sm text-amber-700">{aviso}</p>}
        <p className="text-xs text-suave">
          Já entra pelo link do e-mail? Depois de entrar, defina uma senha em{' '}
          <strong>/conta/senha</strong>.
        </p>
      </form>
    </details>
  );
}

function traduzirErro(mensagem: string) {
  if (/invalid login credentials/i.test(mensagem)) {
    return 'E-mail ou senha incorretos. Se a conta foi criada pelo link do e-mail, ela ainda não tem senha.';
  }
  if (/already registered/i.test(mensagem)) return 'Este e-mail já tem conta. Use "Entrar".';
  if (/password/i.test(mensagem)) return 'Senha inválida: use pelo menos 6 caracteres.';
  return mensagem;
}
