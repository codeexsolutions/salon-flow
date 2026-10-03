import { FormDefinirSenha } from '@/components/auth/form-definir-senha';
import { GerarCodigoRecuperacao } from '@/components/auth/gerar-codigo-recuperacao';
import { CabecalhoPagina } from '@/components/ui/cabecalho-pagina';
import { Secao } from '@/components/ui/secao';
import { obterPerfil } from '@/lib/auth/sessao';

export const metadata = { title: 'Alterar senha' };

/** Alterar a senha (inclusive a provisória dada pelo salão) e o código de recuperação. */
export default async function SenhaPage() {
  const perfil = await obterPerfil('/conta/senha');

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <CabecalhoPagina titulo="Senha e recuperação" subtitulo={`@${perfil.usuario}`} />
      <Secao titulo="Nova senha">
        <FormDefinirSenha />
      </Secao>
      <Secao
        titulo="Código de recuperação"
        descricao="Se esquecer a senha, você cria outra com seu usuário, celular e este código."
      >
        <GerarCodigoRecuperacao jaTem={perfil.temRecuperacao} />
      </Secao>
    </div>
  );
}
