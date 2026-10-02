'use client';

import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Check, Copy, KeyRound, MessageCircle, Shuffle } from 'lucide-react';
import type { ProfissionalResumo } from '@salonflow/shared';
import { definirEmailProfissional } from '@/app/admin/(painel)/profissionais/actions';
import { linkWhatsApp } from '@/lib/agenda';
import { env } from '@/lib/env';
import { traduzirErroAuth } from '@/components/auth/erros-auth';
import {
  Campo,
  classeBotaoPrimario,
  classeBotaoSecundario,
  classeInput,
  MensagemForm,
} from '@/components/ui/campo';

/** Senha provisória legível (sem 0/O, 1/l). */
function gerarSenha() {
  const letras = 'abcdefghjkmnpqrstuvwxyz';
  const numeros = '23456789';
  const aleatorio = (s: string) => s[crypto.getRandomValues(new Uint32Array(1))[0] % s.length];
  return (
    Array.from({ length: 4 }, () => aleatorio(letras)).join('') +
    Array.from({ length: 4 }, () => aleatorio(numeros)).join('')
  );
}

/**
 * O dono cria o acesso do profissional (e-mail + senha provisória) e entrega a ele.
 * Usa um cliente Supabase SEM sessão: criar a conta não desloga o dono.
 * O vínculo com o salão acontece no 1º login do profissional (pelo e-mail).
 */
export function CriarAcesso({ profissional }: { profissional: ProfissionalResumo }) {
  const router = useRouter();
  const [email, setEmail] = useState(profissional.email ?? '');
  const [senha, setSenha] = useState(gerarSenha);
  const [criado, setCriado] = useState<{
    email: string;
    senha: string;
    /** O Supabase exige confirmar o e-mail antes do 1º login. */
    confirmar: boolean;
  } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [pendente, iniciar] = useTransition();

  function criar() {
    setErro(null);
    iniciar(async () => {
      const emailNormalizado = email.trim().toLowerCase();
      if (emailNormalizado !== profissional.email) {
        const r = await definirEmailProfissional(profissional.id, emailNormalizado);
        if (!r.ok) {
          setErro(r.erro);
          return;
        }
      }

      const isolado = createClient(env.supabaseUrl, env.supabasePublishableKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      });
      const { data, error } = await isolado.auth.signUp({
        email: emailNormalizado,
        password: senha,
        options: {
          data: {
            full_name: profissional.nome,
            tipo_conta: 'profissional',
            senha_provisoria: true,
          },
        },
      });
      if (error) {
        setErro(traduzirErroAuth(error.message));
        return;
      }
      // E-mail que já tinha conta: o Supabase não cria outra (identities vazio).
      if (data.user && data.user.identities?.length === 0) {
        setErro(
          'Este e-mail já tem conta no SalonFlow. O profissional entra com a senha dele e o acesso ao salão é liberado automaticamente.',
        );
        router.refresh();
        return;
      }
      setCriado({ email: emailNormalizado, senha, confirmar: !data.session });
      router.refresh();
    });
  }

  if (criado) {
    const texto = `Olá, ${profissional.nome}! Seu acesso ao app do salão:\n${window.location.origin}/entrar\nE-mail: ${criado.email}\nSenha: ${criado.senha}\nNo primeiro acesso, troque a senha em Conta.`;
    const whatsapp = profissional.telefone && linkWhatsApp(profissional.telefone);
    return (
      <div className="flex flex-col gap-3 text-sm">
        <MensagemForm sucesso mensagem="Acesso criado! Entregue os dados abaixo ao profissional." />
        {criado.confirmar && (
          <MensagemForm
            mensagem={
              'Antes do primeiro acesso, o profissional precisa confirmar o e-mail pelo link enviado para ' +
              criado.email +
              '.'
            }
          />
        )}
        <dl className="grid grid-cols-[5rem_1fr] gap-y-1 rounded-xl bg-nude p-4 font-mono text-sm">
          <dt className="font-sans text-suave">Link</dt>
          <dd>{window.location.origin}/entrar</dd>
          <dt className="font-sans text-suave">E-mail</dt>
          <dd>{criado.email}</dd>
          <dt className="font-sans text-suave">Senha</dt>
          <dd className="font-semibold">{criado.senha}</dd>
        </dl>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={async () => {
              await navigator.clipboard.writeText(texto);
              setCopiado(true);
            }}
            className={classeBotaoSecundario}
          >
            {copiado ? (
              <Check className="size-4" aria-hidden />
            ) : (
              <Copy className="size-4" aria-hidden />
            )}
            {copiado ? 'Copiado' : 'Copiar'}
          </button>
          {whatsapp && (
            <a
              href={`${whatsapp}?text=${encodeURIComponent(texto)}`}
              target="_blank"
              rel="noreferrer"
              className={classeBotaoSecundario}
            >
              <MessageCircle className="size-4" aria-hidden /> Enviar pelo WhatsApp
            </a>
          )}
        </div>
        <p className="text-xs text-suave">
          Por segurança, esta senha não fica salva no painel. O profissional deve trocá-la no
          primeiro acesso.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 text-sm">
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo rotulo="E-mail do profissional">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={classeInput}
          />
        </Campo>
        <Campo rotulo="Senha provisória" ajuda="Mínimo de 6 caracteres.">
          <div className="flex gap-2">
            <input
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              minLength={6}
              className={`${classeInput} font-mono`}
            />
            <button
              type="button"
              onClick={() => setSenha(gerarSenha())}
              aria-label="Gerar outra senha"
              title="Gerar outra senha"
              className={classeBotaoSecundario}
            >
              <Shuffle className="size-4" aria-hidden />
            </button>
          </div>
        </Campo>
      </div>
      {erro && <MensagemForm mensagem={erro} />}
      <button
        type="button"
        onClick={criar}
        disabled={pendente || !email.includes('@') || senha.length < 6}
        className={`${classeBotaoPrimario} self-start`}
      >
        <KeyRound className="size-4" aria-hidden />
        {pendente ? 'Criando…' : 'Criar acesso ao app'}
      </button>
    </div>
  );
}
