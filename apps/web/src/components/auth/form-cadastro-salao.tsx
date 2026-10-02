'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { z } from 'zod';
import { criarSalaoSchema } from '@salonflow/shared';
import { enderecoDisponivel } from '@/app/(cliente)/cadastro-salao/actions';
import { criarSalao } from '@/app/admin/novo-salao/actions';
import { sugerirSlug } from '@/lib/slug';
import { criarSupabaseBrowser } from '@/lib/supabase/client';
import { Campo, classeBotaoPrimario, classeInput } from '@/components/ui/campo';
import { traduzirErroAuth } from './erros-auth';

type Erros = Partial<Record<string, string[]>>;

/**
 * Cadastro do salão em uma etapa: cria a conta do responsável (dono) e o salão.
 * Confere o endereço da página ANTES de criar a conta, para não deixar conta sem salão.
 */
export function FormCadastroSalao() {
  const [slug, setSlug] = useState('');
  const [slugEditado, setSlugEditado] = useState(false);
  const [erros, setErros] = useState<Erros>({});
  const [mensagem, setMensagem] = useState<{ ok: boolean; texto: string } | null>(null);
  const [pendente, iniciar] = useTransition();

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
    if (!validacao.success) {
      setErros(z.flattenError(validacao.error).fieldErrors);
      return;
    }

    iniciar(async () => {
      if (!(await enderecoDisponivel(validacao.data.slug))) {
        setErros({ slug: ['Este endereço já está em uso. Escolha outro.'] });
        return;
      }

      const { data, error } = await criarSupabaseBrowser().auth.signUp({
        email: texto('email'),
        password: String(formData.get('senha') ?? ''),
        options: {
          data: { full_name: texto('responsavel'), tipo_conta: 'salao' },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent('/admin/novo-salao')}`,
        },
      });
      if (error) {
        setMensagem({ ok: false, texto: traduzirErroAuth(error.message) });
        return;
      }
      if (!data.session) {
        setMensagem({
          ok: true,
          texto:
            'Conta criada! Confirme seu e-mail pelo link que enviamos. Ao entrar, você conclui o cadastro do salão.',
        });
        return;
      }

      // Já logado: cria o salão (a ação leva ao painel ao terminar).
      const fd = new FormData();
      Object.entries(validacao.data).forEach(([c, v]) => v !== undefined && fd.set(c, String(v)));
      const resultado = await criarSalao({}, fd);
      if (resultado.erros || resultado.mensagem) {
        setErros(resultado.erros ?? {});
        setMensagem({
          ok: false,
          texto: resultado.mensagem ?? 'Sua conta foi criada, mas o salão não. Confira os dados.',
        });
      }
    });
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
          <Campo rotulo="E-mail">
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
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
