import { LogOut } from 'lucide-react';
import { FormDefinirSenha } from '@/components/auth/form-definir-senha';
import { classeBotaoPerigo } from '@/components/ui/campo';
import { Secao } from '@/components/ui/secao';
import { sair } from '@/lib/auth/actions';
import { obterContextoPro } from '@/lib/auth/contexto';

export const metadata = { title: 'Minha conta' };

export default async function ProContaPage() {
  const { perfil, salao } = await obterContextoPro();

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h1 className="text-3xl">Minha conta</h1>
        <p className="text-sm text-suave">
          {perfil.nome ?? perfil.email}
          {salao && ` · ${salao.nome}`}
        </p>
      </div>
      <Secao titulo="Alterar senha">
        <FormDefinirSenha />
      </Secao>
      <form action={sair}>
        <button type="submit" className={`${classeBotaoPerigo} w-full`}>
          <LogOut className="size-4" aria-hidden /> Sair
        </button>
      </form>
    </section>
  );
}
