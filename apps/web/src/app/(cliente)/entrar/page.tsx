import { redirect } from 'next/navigation';
import { FormEntrar } from '@/components/auth/form-entrar';
import { caminhoSeguro } from '@/lib/auth/destino';
import { obterSessao } from '@/lib/auth/sessao';

export const metadata = { title: 'Entrar' };

export default async function EntrarPage({ searchParams }: PageProps<'/entrar'>) {
  const params = await searchParams;
  const next = caminhoSeguro(typeof params.next === 'string' ? params.next : null);

  if (await obterSessao()) {
    redirect(next ? `/auth/continuar?next=${encodeURIComponent(next)}` : '/auth/continuar');
  }

  return (
    <section className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold">Entrar</h1>
      <p className="mt-1 mb-6 text-sm text-suave">
        Sem senha: use sua conta Google ou receba um link no e-mail.
      </p>
      {params.erro === 'link' && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          O link expirou ou já foi usado. Peça um novo abaixo.
        </p>
      )}
      <FormEntrar next={next} />
    </section>
  );
}
