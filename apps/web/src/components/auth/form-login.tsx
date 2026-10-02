'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { CalendarHeart, Scissors, Store, type LucideIcon } from 'lucide-react';
import { criarSupabaseBrowser } from '@/lib/supabase/client';
import {
  Campo,
  classeBotaoPrimario,
  classeBotaoSecundario,
  classeInput,
} from '@/components/ui/campo';

export type Modo = 'entrar' | 'criar' | 'recuperar';

/** Perfil escolhido ao criar a conta: define para onde a pessoa vai em seguida. */
export type TipoConta = 'cliente' | 'salao' | 'profissional';

const TIPOS: { tipo: TipoConta; rotulo: string; descricao: string; icone: LucideIcon }[] = [
  { tipo: 'cliente', rotulo: 'Quero agendar', descricao: 'Cliente', icone: CalendarHeart },
  { tipo: 'salao', rotulo: 'Tenho um salão', descricao: 'Dono(a)', icone: Store },
  {
    tipo: 'profissional',
    rotulo: 'Sou profissional',
    descricao: 'Atendo num salão',
    icone: Scissors,
  },
];

const SUBTITULO_CRIAR: Record<TipoConta, string> = {
  cliente: 'Crie sua conta para agendar em qualquer salão.',
  salao: 'Crie seu acesso. Em seguida, você cadastra os dados do salão.',
  profissional: 'Use o mesmo e-mail que o salão cadastrou para você.',
};

const TITULOS: Record<Modo, { titulo: string; subtitulo: string }> = {
  entrar: { titulo: 'Entrar', subtitulo: 'Acesse com seu e-mail e senha.' },
  criar: { titulo: 'Criar conta', subtitulo: 'É rápido: nome, e-mail e uma senha.' },
  recuperar: {
    titulo: 'Recuperar senha',
    subtitulo: 'Enviaremos um link para você criar uma nova senha.',
  },
};

/** Login por e-mail e senha: entrar, criar conta e recuperar senha. */
export function FormLogin({
  next,
  google,
  modoInicial = 'entrar',
  tipoInicial = 'cliente',
}: {
  next: string | null;
  google: boolean;
  modoInicial?: Modo;
  tipoInicial?: TipoConta;
}) {
  const router = useRouter();
  const [modo, setModo] = useState<Modo>(modoInicial);
  const [tipo, setTipo] = useState<TipoConta>(tipoInicial);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  // Ao criar conta, o perfil escolhido define o próximo passo.
  const destino =
    modo === 'criar' && tipo === 'salao'
      ? '/admin/novo-salao'
      : modo === 'criar' && tipo === 'profissional'
        ? '/pro'
        : next;
  const continuar = destino
    ? `/auth/continuar?next=${encodeURIComponent(destino)}`
    : '/auth/continuar';
  const retorno = (caminho: string | null) => {
    const url = new URL('/auth/callback', window.location.origin);
    if (caminho) url.searchParams.set('next', caminho);
    return url.toString();
  };

  function trocar(novo: Modo) {
    setModo(novo);
    setErro(null);
    setAviso(null);
  }

  function enviar(formData: FormData) {
    const email = String(formData.get('email') ?? '').trim();
    const senha = String(formData.get('senha') ?? '');
    const nome = String(formData.get('nome') ?? '').trim();
    setErro(null);
    setAviso(null);

    iniciar(async () => {
      const auth = criarSupabaseBrowser().auth;

      if (modo === 'recuperar') {
        const { error } = await auth.resetPasswordForEmail(email, {
          redirectTo: retorno('/conta/senha'),
        });
        if (error) setErro(traduzirErro(error.message));
        else setAviso(`Se existir uma conta com ${email}, você receberá o link em instantes.`);
        return;
      }

      const { data, error } =
        modo === 'criar'
          ? await auth.signUp({
              email,
              password: senha,
              options: {
                data: { full_name: nome, tipo_conta: tipo },
                emailRedirectTo: retorno(destino),
              },
            })
          : await auth.signInWithPassword({ email, password: senha });

      if (error) {
        setErro(traduzirErro(error.message));
        return;
      }
      if (!data.session) {
        setAviso('Conta criada! Confirme seu e-mail pelo link que enviamos para poder entrar.');
        return;
      }
      router.push(continuar);
      router.refresh();
    });
  }

  async function entrarComGoogle() {
    const { error } = await criarSupabaseBrowser().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: retorno(next) },
    });
    if (error) setErro('Login com Google indisponível no momento.');
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-3xl">
          {modo === 'criar' && tipo === 'salao' ? 'Cadastre seu salão' : TITULOS[modo].titulo}
        </h1>
        <p className="mt-1 text-sm text-suave">
          {modo === 'criar' ? SUBTITULO_CRIAR[tipo] : TITULOS[modo].subtitulo}
        </p>
      </div>

      <form action={enviar} className="flex flex-col gap-4">
        {modo === 'criar' && (
          <fieldset className="grid grid-cols-3 gap-2">
            <legend className="mb-2 text-sm font-medium">Como você vai usar o SalonFlow?</legend>
            {TIPOS.map(({ tipo: t, rotulo, descricao, icone: Icone }) => (
              <label
                key={t}
                className={`flex cursor-pointer flex-col items-center gap-1 rounded-xl border p-3 text-center text-xs transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primaria/40 ${
                  tipo === t
                    ? 'border-primaria bg-nude text-primaria'
                    : 'border-borda text-suave hover:border-primaria/40'
                }`}
              >
                <input
                  type="radio"
                  name="tipoConta"
                  value={t}
                  checked={tipo === t}
                  onChange={() => setTipo(t)}
                  className="sr-only"
                />
                <Icone className="size-5" aria-hidden />
                <span className="font-medium text-foreground">{rotulo}</span>
                <span>{descricao}</span>
              </label>
            ))}
          </fieldset>
        )}
        {modo === 'criar' && (
          <Campo rotulo="Seu nome">
            <input name="nome" required autoComplete="name" minLength={2} className={classeInput} />
          </Campo>
        )}
        <Campo rotulo="E-mail">
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="voce@email.com"
            className={classeInput}
          />
        </Campo>
        {modo !== 'recuperar' && (
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
        )}

        {erro && (
          <p role="alert" className="rounded-lg bg-perigo-suave p-3 text-sm text-perigo">
            {erro}
          </p>
        )}
        {aviso && (
          <p role="status" className="rounded-lg bg-sucesso-suave p-3 text-sm text-sucesso">
            {aviso}
          </p>
        )}

        <button type="submit" disabled={pendente} className={classeBotaoPrimario}>
          {pendente
            ? 'Aguarde…'
            : modo === 'entrar'
              ? 'Entrar'
              : modo === 'criar'
                ? 'Criar conta'
                : 'Enviar link'}
        </button>
      </form>

      {modo === 'entrar' && (
        <button
          type="button"
          onClick={() => trocar('recuperar')}
          className="self-start text-sm text-primaria"
        >
          Esqueci minha senha
        </button>
      )}

      {google && modo !== 'recuperar' && (
        <>
          <div className="flex items-center gap-3 text-xs text-suave">
            <span className="h-px flex-1 bg-borda" />
            ou
            <span className="h-px flex-1 bg-borda" />
          </div>
          <button type="button" onClick={entrarComGoogle} className={classeBotaoSecundario}>
            Continuar com Google
          </button>
        </>
      )}

      <p className="border-t border-borda pt-4 text-center text-sm text-suave">
        {modo === 'entrar' ? (
          <>
            Ainda não tem conta?{' '}
            <button
              type="button"
              onClick={() => trocar('criar')}
              className="font-medium text-primaria"
            >
              Criar conta
            </button>
          </>
        ) : (
          <>
            Já tem conta?{' '}
            <button
              type="button"
              onClick={() => trocar('entrar')}
              className="font-medium text-primaria"
            >
              Entrar
            </button>
          </>
        )}
      </p>
    </div>
  );
}

function traduzirErro(mensagem: string) {
  if (/invalid login credentials/i.test(mensagem)) return 'E-mail ou senha incorretos.';
  if (/already registered|already exists/i.test(mensagem)) {
    return 'Este e-mail já tem conta. Entre ou use "Esqueci minha senha".';
  }
  if (/email not confirmed/i.test(mensagem)) return 'Confirme seu e-mail pelo link que enviamos.';
  if (/rate limit|too many/i.test(mensagem)) return 'Muitas tentativas. Aguarde alguns minutos.';
  if (/password/i.test(mensagem)) return 'Senha inválida: use pelo menos 6 caracteres.';
  return 'Não foi possível concluir. Tente novamente.';
}
