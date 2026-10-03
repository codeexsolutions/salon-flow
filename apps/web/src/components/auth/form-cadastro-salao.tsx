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
import { enderecoDisponivel } from '@/app/(cliente)/cadastro-salao/actions';
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
        texto: resultado.mensagem ?? 'Sua conta foi criada, mas o salão não. Confira os dados.',
      });
    }
  }

  function enviar(formData: FormData) {
    const texto = (c: string) => String(formData.get(c) ?? '').trim();
    const dadosSalao = Object.fromEntries(
      ['nome', 'slug', 'telefone', 'cidade', 'uf']
        .map((c) => [c, texto(c)])
        .filter(([, v]) => v !== ''),
    );
    setErros({});
    setMensagem(null);

    const validacao = criarSalaoSchema.safeParse(dadosSalao);
    const usuario = nomeUsuarioSchema.safeParse(texto('usuario'));
    const celular = telefoneSchema.safeParse(texto('celular'));
    if (!validacao.success || !usuario.success || !celular.success) {
      setErros({
        ...(validacao.error && z.flattenError(validacao.error).fieldErrors),
        ...(usuario.error && { usuario: usuario.error.issues.map((i) => i.message) }),
        ...(celular.error && { celular: celular.error.issues.map((i) => i.message) }),
      });
      return;
    }
    const fd = new FormData();
    Object.entries(validacao.data).forEach(([c, v]) => v !== undefined && fd.set(c, String(v)));

    iniciar(async () => {
      if (!(await enderecoDisponivel(validacao.data.slug))) {
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
        rotuloContinuar={pendente ? 'Criando o salão…' : 'Continuar para o painel'}
        aoContinuar={() => iniciar(() => cadastrarSalao(salaoPendente))}
      />
    );
  }

  return (
    <form action={enviar} className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-3 font-display text-xl">Seu salão</legend>
        <Campo rotulo="Nome do salão" erro={erros.nome}>
          <input
            name="nome"
            required
            onChange={(e) => !slugEditado && setSlug(sugerirSlug(e.target.value))}
            placeholder="Studio Bela Vista"
            className={classeInput}
          />
        </Campo>
        <Campo
          rotulo="Endereço da página do salão"
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
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_5rem]">
          <Campo rotulo="Telefone / WhatsApp" erro={erros.telefone}>
            <input
              name="telefone"
              type="tel"
              placeholder="(11) 99999-9999"
              className={classeInput}
            />
          </Campo>
          <Campo rotulo="Cidade" erro={erros.cidade}>
            <input name="cidade" className={classeInput} />
          </Campo>
          <Campo rotulo="UF" erro={erros.uf}>
            <input
              name="uf"
              maxLength={2}
              placeholder="SP"
              className={`${classeInput} uppercase`}
            />
          </Campo>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4 border-t border-borda pt-6">
        <legend className="mb-3 font-display text-xl">Seu acesso</legend>
        <Campo rotulo="Seu nome (responsável)">
          <input
            name="responsavel"
            required
            minLength={2}
            autoComplete="name"
            className={classeInput}
          />
        </Campo>
        <div className="grid gap-3 sm:grid-cols-2">
          <CampoUsuario novo erro={erros.usuario} />
          <Campo
            rotulo="Seu celular"
            erro={erros.celular}
            ajuda="Com DDD. Usado para recuperar a senha."
          >
            <input
              name="celular"
              type="tel"
              required
              autoComplete="tel"
              inputMode="tel"
              className={classeInput}
            />
          </Campo>
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
      </fieldset>

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
        {pendente ? 'Cadastrando…' : 'Cadastrar salão e entrar no painel'}
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
