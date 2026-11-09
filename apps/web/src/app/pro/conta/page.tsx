import Link from 'next/link';
import { ChevronRight, FileSignature, LogOut } from 'lucide-react';
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
          {perfil.nome ?? perfil.usuario} · @{perfil.usuario}
          {salao && ` · ${salao.nome}`}
        </p>
      </div>
      {salao && (
        <Link
          href="/pro/contrato"
          className="flex items-center gap-3 rounded-2xl border border-borda bg-superficie p-4 text-sm hover:border-primaria/40"
        >
          <FileSignature className="size-5 text-primaria" aria-hidden />
          <span className="flex-1 font-medium">Meu contrato de parceria</span>
          <ChevronRight className="size-4 text-suave" aria-hidden />
        </Link>
      )}
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
