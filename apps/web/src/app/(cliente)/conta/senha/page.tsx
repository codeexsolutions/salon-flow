import { FormDefinirSenha } from '@/components/auth/form-definir-senha';
import { CabecalhoPagina } from '@/components/ui/cabecalho-pagina';
import { Secao } from '@/components/ui/secao';
import { exigirSessao } from '@/lib/auth/sessao';

export const metadata = { title: 'Alterar senha' };

/** Alterar a senha (também é o destino do link "Esqueci minha senha"). */
export default async function SenhaPage() {
  const sessao = await exigirSessao('/conta/senha');

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <CabecalhoPagina titulo="Alterar senha" subtitulo={sessao.email} />
      <Secao titulo="Nova senha">
        <FormDefinirSenha />
      </Secao>
    </div>
  );
}
