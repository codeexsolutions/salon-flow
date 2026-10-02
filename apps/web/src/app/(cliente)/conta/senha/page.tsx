import { notFound } from 'next/navigation';
import { FormDefinirSenha } from '@/components/auth/form-definir-senha';
import { exigirSessao } from '@/lib/auth/sessao';
import { env } from '@/lib/env';

export const metadata = { title: 'Definir senha' };

/** Só existe em desenvolvimento (NEXT_PUBLIC_LOGIN_SENHA=true). */
export default async function DefinirSenhaPage() {
  if (!env.loginComSenha) notFound();
  const sessao = await exigirSessao('/conta/senha');

  return (
    <section className="mx-auto flex max-w-sm flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">Definir senha</h1>
        <p className="mt-1 text-sm text-suave">
          Para <strong>{sessao.email}</strong> entrar sem esperar o link por e-mail (modo
          desenvolvimento).
        </p>
      </div>
      <FormDefinirSenha />
    </section>
  );
}
