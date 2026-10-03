'use client';

import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { Check, Copy, KeyRound, MessageCircle, Shuffle } from 'lucide-react';
import { emailDeLogin, type ProfissionalResumo } from '@salonflow/shared';
import {
  definirUsuarioProfissional,
  limparUsuarioProfissional,
} from '@/app/admin/(painel)/profissionais/actions';
import { linkWhatsApp } from '@/lib/agenda';
import { gerarSenhaProvisoria } from '@/lib/auth/senha-provisoria';
import { env } from '@/lib/env';
import { traduzirErroAuth } from '@/components/auth/erros-auth';
import {
  Campo,
  classeBotaoPrimario,
  classeBotaoSecundario,
  classeInput,
  MensagemForm,
} from '@/components/ui/campo';

/**
 * O dono cria o acesso do profissional (usuário + senha provisória) e entrega a ele.
 * Usa um cliente Supabase SEM sessão: criar a conta não desloga o dono.
 * O vínculo com o salão acontece no 1º login do profissional (pelo usuário).
 */
export function CriarAcesso({ profissional }: { profissional: ProfissionalResumo }) {
  const router = useRouter();
  const [usuario, setUsuario] = useState(profissional.usuario ?? '');
  const [senha, setSenha] = useState(gerarSenhaProvisoria);
  const [criado, setCriado] = useState<{ usuario: string; senha: string } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [pendente, iniciar] = useTransition();

  function criar() {
    setErro(null);
    iniciar(async () => {
      const login = usuario.trim().toLowerCase();
      if (login !== profissional.usuario) {
        const r = await definirUsuarioProfissional(profissional.id, login);
        if (!r.ok) {
          setErro(r.erro);
          return;
        }
      }

      const isolado = createClient(env.supabaseUrl, env.supabasePublishableKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      });
      const { data, error } = await isolado.auth.signUp({
        email: emailDeLogin(login),
        password: senha,
        options: {
          data: {
            full_name: profissional.nome,
            tipo_conta: 'profissional',
            senha_provisoria: true,
          },
        },
      });
      // Usuário já usado por outra pessoa: desfaz a reserva para não dar acesso a ela.
      const jaExiste = !!data.user && data.user.identities?.length === 0;
      if (error || jaExiste) {
        await limparUsuarioProfissional(profissional.id);
        setErro(
          jaExiste || /already registered|already exists/i.test(error?.message ?? '')
            ? 'Este usuário já existe. Escolha outro.'
            : traduzirErroAuth(error!.message),
        );
        router.refresh();
        return;
      }
      setCriado({ usuario: login, senha });
      router.refresh();
    });
  }

  if (criado) {
    const texto = `Olá, ${profissional.nome}! Seu acesso ao app do salão:\n${window.location.origin}/entrar\nUsuário: ${criado.usuario}\nSenha: ${criado.senha}\nNo primeiro acesso, troque a senha em Conta.`;
    const whatsapp = profissional.telefone && linkWhatsApp(profissional.telefone);
    return (
      <div className="flex flex-col gap-3 text-sm">
        <MensagemForm sucesso mensagem="Acesso criado! Entregue os dados abaixo ao profissional." />
        <dl className="grid grid-cols-[5rem_1fr] gap-y-1 rounded-xl bg-nude p-4 font-mono text-sm">
          <dt className="font-sans text-suave">Link</dt>
          <dd className="break-all">{window.location.origin}/entrar</dd>
          <dt className="font-sans text-suave">Usuário</dt>
          <dd>{criado.usuario}</dd>
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
          primeiro acesso. Se ele esquecer, gere uma nova em Equipe e acessos.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 text-sm">
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo rotulo="Usuário do profissional" ajuda="Ex.: joao.barbeiro">
          <input
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            required
            minLength={3}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
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
              onClick={() => setSenha(gerarSenhaProvisoria())}
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
        disabled={pendente || usuario.trim().length < 3 || senha.length < 6}
        className={`${classeBotaoPrimario} self-start`}
      >
        <KeyRound className="size-4" aria-hidden />
        {pendente ? 'Criando…' : 'Criar acesso ao app'}
      </button>
    </div>
  );
}
