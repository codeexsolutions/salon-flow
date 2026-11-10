import Link from 'next/link';
import { ChevronRight, IdCard, LayoutDashboard, LogOut, Smartphone } from 'lucide-react';
import { FormDefinirSenha } from '@/components/auth/form-definir-senha';
import { GerarCodigoRecuperacao } from '@/components/auth/gerar-codigo-recuperacao';
import { CabecalhoPagina } from '@/components/ui/cabecalho-pagina';
import { classeBotaoSecundario } from '@/components/ui/campo';
import { Secao } from '@/components/ui/secao';
import { sair } from '@/lib/auth/actions';
import { usaAppProfissional, usaPainel } from '@/lib/auth/contexto';
import { obterPerfil } from '@/lib/auth/sessao';

export const metadata = { title: 'Minha conta' };

/** Conta: senha (inclusive a provisória dada pelo salão), código de recuperação e sair. */
export default async function ContaPage() {
  const perfil = await obterPerfil('/conta/senha');
  const painel = perfil.saloes.some(usaPainel);
  const appProfissional = perfil.saloes.some(usaAppProfissional);

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <CabecalhoPagina
        titulo="Minha conta"
        subtitulo={`${perfil.nome ? `${perfil.nome} · ` : ''}@${perfil.usuario}`}
      />
      {(painel || appProfissional) && (
        <div className="flex flex-wrap gap-2">
          {painel && (
            <Link href="/admin" className={classeBotaoSecundario}>
              <LayoutDashboard className="size-4" aria-hidden /> Painel do salão
            </Link>
          )}
          {appProfissional && (
            <Link href="/pro" className={classeBotaoSecundario}>
              <Smartphone className="size-4" aria-hidden /> App do profissional
            </Link>
          )}
        </div>
      )}
      <Link
        href="/conta/dados"
        className="flex items-center gap-3 rounded-2xl border border-borda bg-superficie p-4 transition hover:border-primaria/40"
      >
        <IdCard className="size-5 text-primaria" aria-hidden />
        <span className="flex flex-1 flex-col">
          <span className="font-medium">Meus dados</span>
          <span className="text-xs text-suave">
            Celular, nascimento e e-mail para os salões (opcional)
          </span>
        </span>
        <ChevronRight className="size-4 text-suave" aria-hidden />
      </Link>
      <Secao titulo="Nova senha">
        <FormDefinirSenha />
      </Secao>
      <Secao
        titulo="Código de recuperação"
        descricao="Se esquecer a senha, você cria outra com seu usuário, celular e este código."
      >
        <GerarCodigoRecuperacao jaTem={perfil.temRecuperacao} />
      </Secao>
      <form action={sair}>
        <button type="submit" className={`${classeBotaoSecundario} w-full text-perigo`}>
          <LogOut className="size-4" aria-hidden /> Sair da conta
        </button>
      </form>
    </div>
  );
}
