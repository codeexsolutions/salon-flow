'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { Store } from 'lucide-react';
import { emailDeLogin, nomeUsuarioSchema, telefoneSchema } from '@salonflow/shared';
import { definirRecuperacao } from '@/lib/auth/recuperacao-actions';
import { criarSupabaseBrowser } from '@/lib/supabase/client';
import { Campo, classeBotaoPrimario, classeInput } from '@/components/ui/campo';
import { traduzirErroAuth } from './erros-auth';
import { CampoUsuario } from './campo-usuario';
import { CodigoRecuperacao } from './codigo-recuperacao';

export type Modo = 'entrar' | 'criar';

const TITULOS: Record<Modo, { titulo: string; subtitulo: string }> = {
  entrar: { titulo: 'Entrar', subtitulo: 'Acesse com seu usuário e senha.' },
  criar: {
    titulo: 'Criar conta',
    subtitulo: 'Para encontrar salões, agendar e acompanhar seus horários.',
  },
};

/**
 * Login por usuário e senha: entrar e criar conta de CLIENTE (com celular e
 * código de recuperação). Salões se cadastram em /cadastro-salao; profissionais e
 * recepção recebem o acesso do salão (que também define uma senha nova se esquecerem).
 */
export function FormLogin({
  next,
  modoInicial = 'entrar',
}: {
  next: string | null;
  modoInicial?: Modo;
}) {
  const [modo, setModo] = useState<Modo>(modoInicial);
  const [erro, setErro] = useState<string | null>(null);
  const [codigo, setCodigo] = useState<{ codigo: string; usuario: string } | null>(null);
  const [pendente, iniciar] = useTransition();

  const continuar = next ? `/auth/continuar?next=${encodeURIComponent(next)}` : '/auth/continuar';

  function trocar(novo: Modo) {
    setModo(novo);
    setErro(null);
  }

  function enviar(formData: FormData) {
    const usuario = String(formData.get('usuario') ?? '');
    const senha = String(formData.get('senha') ?? '');
    const nome = String(formData.get('nome') ?? '').trim();
    const telefone = telefoneSchema.safeParse(String(formData.get('telefone') ?? ''));
    setErro(null);
    if (modo === 'criar' && !telefone.success) {
      setErro(telefone.error.issues[0].message);
      return;
    }

    const validacao = nomeUsuarioSchema.safeParse(usuario);
    if (!validacao.success) {
      setErro(
        modo === 'criar' ? validacao.error.issues[0].message : 'Usuário ou senha incorretos.',
      );
      return;
    }
    const email = emailDeLogin(validacao.data);

    iniciar(async () => {
      const auth = criarSupabaseBrowser().auth;
      const { data, error } =
        modo === 'criar'
          ? await auth.signUp({
              email,
              password: senha,
              options: { data: { full_name: nome, tipo_conta: 'cliente' } },
            })
          : await auth.signInWithPassword({ email, password: senha });

      if (error) {
        setErro(traduzirErroAuth(error.message));
        return;
      }
      if (!data.session) {
        setErro('Não foi possível entrar agora. Tente de novo em instantes.');
        return;
      }
      if (modo === 'criar' && telefone.success) {
        const r = await definirRecuperacao(telefone.data);
        // Sem o código agora, a pessoa pode gerar depois em Conta > Senha.
        if (r.ok) {
          setCodigo({ codigo: r.dados.codigo, usuario: validacao.data });
          return;
        }
      }
      // /auth/continuar é uma rota de redirecionamento (não uma página): navegação completa.
      window.location.assign(continuar);
    });
  }

  if (codigo) {
    return (
      <CodigoRecuperacao
        codigo={codigo.codigo}
        usuario={codigo.usuario}
        aoContinuar={() => window.location.assign(continuar)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-3xl">{TITULOS[modo].titulo}</h1>
        <p className="mt-1 text-sm text-suave">{TITULOS[modo].subtitulo}</p>
      </div>

      <form action={enviar} className="flex flex-col gap-4">
        {modo === 'criar' && (
          <Campo rotulo="Seu nome">
            <input name="nome" required autoComplete="name" minLength={2} className={classeInput} />
          </Campo>
        )}
        <CampoUsuario novo={modo === 'criar'} />
        {modo === 'criar' && (
          <Campo rotulo="Celular" ajuda="Com DDD. Junto com o código de recuperação, ajuda a recuperar a senha.">
            <input
              name="telefone"
              type="tel"
              required
              autoComplete="tel"
              inputMode="tel"
              placeholder="(85) 99999-9999"
              className={classeInput}
            />
          </Campo>
        )}
        <Campo rotulo="Senha" ajuda={modo === 'criar' ? 'Mínimo de 6 caracteres.' : undefined}>
          <input
            name="senha"
            type="password"
            required
            minLength={6}
            autoComplete={modo === 'criar' ? 'new-password' : 'current-password'}
            className={classeInput}
          />
        </Campo>

        {erro && (
          <p role="alert" className="rounded-lg bg-perigo-suave p-3 text-sm text-perigo">
            {erro}
          </p>
        )}

        <button type="submit" disabled={pendente} className={classeBotaoPrimario}>
          {pendente ? 'Aguarde…' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}
        </button>
      </form>

      {modo === 'entrar' && (
        <p className="text-sm text-suave">
          <Link href="/recuperar-senha" className="font-medium text-primaria">
            Esqueci minha senha
          </Link>
          <span className="mt-1 block text-xs">
            Trabalha num salão? Peça ao responsável uma senha nova.
          </span>
        </p>
      )}

      <div className="flex flex-col gap-3 border-t border-borda pt-4 text-center text-sm text-suave">
        <p>
          {modo === 'entrar' ? 'Ainda não tem conta? ' : 'Já tem conta? '}
          <button
            type="button"
            onClick={() => trocar(modo === 'entrar' ? 'criar' : 'entrar')}
            className="font-medium text-primaria"
          >
            {modo === 'entrar' ? 'Criar conta' : 'Entrar'}
          </button>
        </p>
        <Link
          href="/cadastro-salao"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-nude px-3 py-2 text-foreground hover:text-primaria"
        >
          <Store className="size-4" aria-hidden />É dono de salão?{' '}
          <span className="font-medium text-primaria">Cadastre seu salão</span>
        </Link>
      </div>
    </div>
  );
}
