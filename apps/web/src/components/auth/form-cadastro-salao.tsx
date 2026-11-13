'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { z } from 'zod';
import {
  criarSalaoSchema,
  emailDeLogin,
  nomeUsuarioSchema,
  telefoneSchema,
} from '@salonflow/shared';
import { definirRecuperacao } from '@/lib/auth/recuperacao-actions';
import { enderecoDisponivel } from '@/app/(site)/cadastro-salao/actions';
import { criarSalao } from '@/app/admin/novo-salao/actions';
import { sugerirSlug } from '@/lib/slug';
import { criarSupabaseBrowser } from '@/lib/supabase/client';
import { Campo, classeBotaoPrimario, classeInput } from '@/components/ui/campo';
import { CampoUsuario } from './campo-usuario';
import { CodigoRecuperacao } from './codigo-recuperacao';
import { traduzirErroAuth } from './erros-auth';

type Erros = Partial<Record<string, string[]>>;

/**
 * Cadastro do salão em uma etapa: cria a conta do responsável (dono) e o salão.
 * Confere o endereço da página ANTES de criar a conta, para não deixar conta sem salão.
 * Entre a conta e o salão, mostra o código de recuperação de senha para o dono guardar.
 */
export function FormCadastroSalao() {
  const [slug, setSlug] = useState('');
  const [slugEditado, setSlugEditado] = useState(false);
  /** O link da página só vira campo se a pessoa quiser trocar o sugerido. */
  const [editarSlug, setEditarSlug] = useState(false);
  const [erros, setErros] = useState<Erros>({});
  const [mensagem, setMensagem] = useState<{ ok: boolean; texto: string } | null>(null);
  /** Conta já criada (não cria de novo se o salão falhar e a pessoa reenviar). */
  const [contaCriada, setContaCriada] = useState(false);
  const [codigo, setCodigo] = useState<{ codigo: string; usuario: string } | null>(null);
  const [salaoPendente, setSalaoPendente] = useState<FormData | null>(null);
  const [pendente, iniciar] = useTransition();

  /** Cria o salão (a ação leva ao painel ao terminar). */
  async function cadastrarSalao(fd: FormData) {
    const resultado = await criarSalao({}, fd);
    if (resultado.erros || resultado.mensagem) {
      setCodigo(null);
      setErros(resultado.erros ?? {});
      setMensagem({
        ok: false,
        texto:
          resultado.mensagem ??
          'Sua conta foi criada, mas o estabelecimento não. Confira os dados.',
      });
    }
  }

  function enviar(formData: FormData) {
    const texto = (c: string) => String(formData.get(c) ?? '').trim();
    setErros({});
    setMensagem(null);

    const usuario = nomeUsuarioSchema.safeParse(texto('usuario'));
    const celular = telefoneSchema.safeParse(texto('celular'));
    // Cadastro curto: o WhatsApp do dono vira o telefone do negócio; cidade e o resto, no painel.
    const validacao = criarSalaoSchema.safeParse({
      nome: texto('nome'),
      slug,
      ...(celular.success && { telefone: celular.data }),
    });
    if (!validacao.success || !usuario.success || !celular.success) {
      const errosSalao = validacao.error ? z.flattenError(validacao.error).fieldErrors : {};
      if (errosSalao.slug) setEditarSlug(true);
      setErros({
        ...errosSalao,
        ...(usuario.error && { usuario: usuario.error.issues.map((i) => i.message) }),
        ...(celular.error && { celular: celular.error.issues.map((i) => i.message) }),
      });
      return;
    }
    const fd = new FormData();
    Object.entries(validacao.data).forEach(([c, v]) => v !== undefined && fd.set(c, String(v)));

    iniciar(async () => {
      if (!(await enderecoDisponivel(validacao.data.slug))) {
        setEditarSlug(true);
        setErros({ slug: ['Este endereço já está em uso. Escolha outro.'] });
        return;
      }
      if (contaCriada) {
        await cadastrarSalao(fd);
        return;
      }

      const { data, error } = await criarSupabaseBrowser().auth.signUp({
        email: emailDeLogin(usuario.data),
        password: String(formData.get('senha') ?? ''),
        options: { data: { full_name: texto('responsavel'), tipo_conta: 'salao' } },
      });
      if (error) {
        setMensagem({ ok: false, texto: traduzirErroAuth(error.message) });
        return;
      }
      if (!data.session) {
        setMensagem({
          ok: false,
          texto: 'Conta criada, mas não foi possível entrar. Entre com seu usuário para concluir.',
        });
        return;
      }

      setContaCriada(true);

      // Já logado: primeiro o código de recuperação, depois o salão.
      const r = await definirRecuperacao(celular.data);
      if (!r.ok) {
        // Sem o código agora, o dono pode gerar depois em Conta > Senha.
        await cadastrarSalao(fd);
        return;
      }
      setSalaoPendente(fd);
      setCodigo({ codigo: r.dados.codigo, usuario: usuario.data });
    });
  }

  if (codigo && salaoPendente) {
    return (
      <CodigoRecuperacao
        codigo={codigo.codigo}
        usuario={codigo.usuario}
        rotuloContinuar={pendente ? 'Criando seu negócio…' : 'Continuar para o painel'}
        aoContinuar={() => iniciar(() => cadastrarSalao(salaoPendente))}
      />
    );
  }

  return (
    <form action={enviar} className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <Campo rotulo="Nome do salão ou negócio" erro={erros.nome}>
          <input
            name="nome"
            required
            onChange={(e) => !slugEditado && setSlug(sugerirSlug(e.target.value))}
            placeholder="Studio Bela Vista"
            className={classeInput}
          />
        </Campo>
        {editarSlug ? (
          <Campo
            rotulo="Link da sua página"
            erro={erros.slug}
            ajuda="É o link que você divulga para os clientes agendarem."
          >
            <div className="flex items-center rounded-xl border border-borda bg-superficie focus-within:border-primaria focus-within:ring-2 focus-within:ring-primaria/20">
              <span className="pl-3.5 text-sm text-suave">salonflow.com.br/s/</span>
              <input
                name="slug"
                required
                value={slug}
                onChange={(e) => {
                  setSlugEditado(true);
                  setSlug(e.target.value.toLowerCase());
                }}
                className="min-w-0 flex-1 bg-transparent px-1 py-2.5 outline-none"
              />
            </div>
          </Campo>
        ) : (
          slug && (
            <p className="-mt-2 text-sm text-suave">
              Seu link: <span className="text-foreground">salonflow.com.br/s/{slug}</span>{' '}
              <button
                type="button"
                onClick={() => setEditarSlug(true)}
                className="font-medium text-primaria hover:underline"
              >
                alterar
              </button>
            </p>
          )
        )}
        <Campo rotulo="Seu nome">
          <input
            name="responsavel"
            required
            minLength={2}
            autoComplete="name"
            className={classeInput}
          />
        </Campo>
        <Campo
          rotulo="Seu WhatsApp"
          erro={erros.celular}
          ajuda="Com DDD. Usamos para falar com você na implantação e para recuperar a senha."
        >
          <input
            name="celular"
            type="tel"
            required
            autoComplete="tel"
            inputMode="tel"
            placeholder="(85) 99999-9999"
            className={classeInput}
          />
        </Campo>
        <div className="grid gap-3 sm:grid-cols-2">
          <CampoUsuario novo erro={erros.usuario} />
          <Campo rotulo="Senha" ajuda="Mínimo de 6 caracteres.">
            <input
              name="senha"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              className={classeInput}
            />
          </Campo>
        </div>
      </div>

      {mensagem && (
        <p
          role={mensagem.ok ? 'status' : 'alert'}
          className={`rounded-lg p-3 text-sm ${
            mensagem.ok ? 'bg-sucesso-suave text-sucesso' : 'bg-perigo-suave text-perigo'
          }`}
        >
          {mensagem.texto}
        </p>
      )}

      <button type="submit" disabled={pendente} className={classeBotaoPrimario}>
        {pendente ? 'Criando sua conta…' : 'Criar conta grátis'}
      </button>
      <p className="text-center text-sm text-suave">
        Já tem conta?{' '}
        <Link href="/entrar?next=%2Fadmin" className="font-medium text-primaria">
          Entrar
        </Link>
      </p>
    </form>
  );
}
