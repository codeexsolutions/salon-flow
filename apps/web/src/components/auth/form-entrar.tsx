'use client';

import { useState } from 'react';
import { criarSupabaseBrowser } from '@/lib/supabase/client';

type Estado =
  | { tipo: 'inicial' }
  | { tipo: 'enviando' }
  | { tipo: 'enviado'; email: string }
  | { tipo: 'erro'; mensagem: string };

function urlDeRetorno(next: string | null) {
  const url = new URL('/auth/callback', window.location.origin);
  if (next) url.searchParams.set('next', next);
  return url.toString();
}

export function FormEntrar({ next, google }: { next: string | null; google: boolean }) {
  const [estado, setEstado] = useState<Estado>({ tipo: 'inicial' });

  async function enviarLink(formData: FormData) {
    const email = String(formData.get('email') ?? '').trim();
    setEstado({ tipo: 'enviando' });

    const { error } = await criarSupabaseBrowser().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: urlDeRetorno(next) },
    });

    setEstado(
      error
        ? { tipo: 'erro', mensagem: mensagemDeErro(error.status, error.message) }
        : { tipo: 'enviado', email },
    );
  }

  async function entrarComGoogle() {
    const { error } = await criarSupabaseBrowser().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: urlDeRetorno(next) },
    });
    if (error) setEstado({ tipo: 'erro', mensagem: 'Login com Google indisponível no momento.' });
  }

  if (estado.tipo === 'enviado') {
    return (
      <div className="rounded-xl border border-borda p-6 text-center">
        <p className="text-lg font-semibold">Confira seu e-mail</p>
        <p className="mt-2 text-sm text-suave">
          Enviamos um link de acesso para <strong>{estado.email}</strong>. Abra-o neste mesmo
          navegador.
        </p>
        <button
          type="button"
          onClick={() => setEstado({ tipo: 'inicial' })}
          className="mt-4 text-sm text-primaria underline"
        >
          Usar outro e-mail
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {google && (
        <>
          <button
            type="button"
            onClick={entrarComGoogle}
            className="rounded-lg border border-borda px-4 py-3 font-medium"
          >
            Entrar com Google
          </button>

          <div className="flex items-center gap-3 text-xs text-suave">
            <span className="h-px flex-1 bg-borda" />
            ou
            <span className="h-px flex-1 bg-borda" />
          </div>
        </>
      )}

      <form action={enviarLink} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          E-mail
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="voce@email.com"
            className="rounded-lg border border-borda bg-transparent px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={estado.tipo === 'enviando'}
          className="rounded-lg bg-primaria px-4 py-3 font-medium text-primaria-contraste disabled:opacity-60"
        >
          {estado.tipo === 'enviando' ? 'Enviando…' : 'Receber link de acesso'}
        </button>
      </form>

      {estado.tipo === 'erro' && (
        <p role="alert" className="text-sm text-red-600">
          {estado.mensagem}
        </p>
      )}
    </div>
  );
}

function mensagemDeErro(status: number | undefined, mensagem: string) {
  if (status === 429) return 'Muitas tentativas. Aguarde alguns minutos e tente de novo.';
  return `Não foi possível enviar o link: ${mensagem}`;
}
