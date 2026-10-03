'use client';

import { createClient } from '@supabase/supabase-js';
import { useState, useTransition } from 'react';
import { Check, Copy, MessageCircle, Shuffle, UserPlus } from 'lucide-react';
import { emailDeLogin } from '@salonflow/shared';
import { cancelarConvite, convidarRecepcao } from '@/app/admin/(painel)/equipe/actions';
import { traduzirErroAuth } from '@/components/auth/erros-auth';
import {
  Campo,
  classeBotaoPrimario,
  classeBotaoSecundario,
  classeInput,
  MensagemForm,
} from '@/components/ui/campo';
import { gerarSenhaProvisoria } from '@/lib/auth/senha-provisoria';
import { env } from '@/lib/env';

type Concluido =
  | { tipo: 'conta-criada'; nome: string; usuario: string; senha: string }
  | { tipo: 'ja-tinha-conta'; nome: string };

/**
 * O dono libera o painel para a recepção: registra o acesso na API e cria a conta
 * (usuário + senha provisória) para entregar à pessoa. Usa um cliente Supabase SEM
 * sessão, para criar a conta sem deslogar o dono.
 */
export function AdicionarRecepcao() {
  const [nome, setNome] = useState('');
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState(gerarSenhaProvisoria);
  const [concluido, setConcluido] = useState<Concluido | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();

  function recomecar() {
    setNome('');
    setUsuario('');
    setSenha(gerarSenhaProvisoria());
    setConcluido(null);
    setErro(null);
  }

  function adicionar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);
    iniciar(async () => {
      const r = await convidarRecepcao({ nome, usuario });
      if (!r.ok) {
        setErro(r.erro);
        return;
      }
      const login = usuario.trim().toLowerCase();
      if (r.dados.situacao === 'LIBERADO') {
        setConcluido({ tipo: 'ja-tinha-conta', nome });
        return;
      }

      const isolado = createClient(env.supabaseUrl, env.supabasePublishableKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      });
      const { data, error } = await isolado.auth.signUp({
        email: emailDeLogin(login),
        password: senha,
        options: {
          data: { full_name: nome.trim(), tipo_conta: 'recepcao', senha_provisoria: true },
        },
      });
      // Usuário já usado por outra pessoa: desfaz a reserva para não dar acesso a ela.
      const jaExiste = !!data.user && data.user.identities?.length === 0;
      if (error || jaExiste) {
        await cancelarConvite(r.dados.conviteId);
        setErro(
          jaExiste ? 'Este usuário já existe. Escolha outro.' : traduzirErroAuth(error!.message),
        );
        return;
      }
      setConcluido({ tipo: 'conta-criada', nome, usuario: login, senha });
    });
  }

  if (concluido?.tipo === 'ja-tinha-conta') {
    return (
      <div className="flex flex-col gap-3 text-sm">
        <MensagemForm
          sucesso
          mensagem={`${concluido.nome} já faz parte do salão. O acesso ao painel foi liberado: é só entrar com a senha de sempre.`}
        />
        <button type="button" onClick={recomecar} className={`${classeBotaoSecundario} self-start`}>
          Adicionar outra pessoa
        </button>
      </div>
    );
  }

  if (concluido?.tipo === 'conta-criada') {
    return <DadosDeAcesso {...concluido} aoRecomecar={recomecar} />;
  }

  return (
    <form onSubmit={adicionar} className="flex flex-col gap-4 text-sm">
      <div className="grid gap-3 sm:grid-cols-3">
        <Campo rotulo="Nome">
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
            minLength={2}
            className={classeInput}
          />
        </Campo>
        <Campo rotulo="Usuário" ajuda="Ex.: ana.recepcao">
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
              required
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
        type="submit"
        disabled={pendente || nome.trim().length < 2 || usuario.trim().length < 3 || senha.length < 6}
        className={`${classeBotaoPrimario} self-start`}
      >
        <UserPlus className="size-4" aria-hidden />
        {pendente ? 'Liberando…' : 'Liberar acesso'}
      </button>
    </form>
  );
}

export function DadosDeAcesso({
  nome,
  usuario,
  senha,
  aoRecomecar,
  titulo,
}: {
  nome: string;
  usuario: string;
  /** Mensagem de sucesso (padrão: acesso criado). */
  titulo?: string;
  senha: string;
  aoRecomecar?: () => void;
}) {
  const [copiado, setCopiado] = useState(false);
  const link = `${window.location.origin}/entrar`;
  const texto = `Olá, ${nome}! Seu acesso ao SalonFlow:\n${link}\nUsuário: ${usuario}\nSenha: ${senha}\nAo entrar, crie a sua senha.`;

  return (
    <div className="flex flex-col gap-3 text-sm">
      <MensagemForm
        sucesso
        mensagem={titulo ?? `Acesso criado! Entregue os dados abaixo para ${nome}.`}
      />
      <dl className="grid grid-cols-[5rem_1fr] gap-y-1 rounded-xl bg-nude p-4 font-mono text-sm">
        <dt className="font-sans text-suave">Link</dt>
        <dd className="break-all">{link}</dd>
        <dt className="font-sans text-suave">Usuário</dt>
        <dd className="break-all">{usuario}</dd>
        <dt className="font-sans text-suave">Senha</dt>
        <dd className="font-semibold">{senha}</dd>
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
          {copiado ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          {copiado ? 'Copiado' : 'Copiar'}
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(texto)}`}
          target="_blank"
          rel="noreferrer"
          className={classeBotaoSecundario}
        >
          <MessageCircle className="size-4" aria-hidden /> Enviar pelo WhatsApp
        </a>
        {aoRecomecar && (
          <button type="button" onClick={aoRecomecar} className={classeBotaoSecundario}>
            Adicionar outra pessoa
          </button>
        )}
      </div>
      <p className="text-xs text-suave">
        Por segurança, esta senha não fica salva no painel. A pessoa cria a própria senha no primeiro
        acesso.
      </p>
    </div>
  );
}
