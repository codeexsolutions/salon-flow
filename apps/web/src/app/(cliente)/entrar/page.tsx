import { redirect } from 'next/navigation';
import { FormEntrar } from '@/components/auth/form-entrar';
import { caminhoSeguro } from '@/lib/auth/destino';
import { obterSessao } from '@/lib/auth/sessao';
import { provedoresAtivos } from '@/lib/supabase/provedores';

export const metadata = { title: 'Entrar' };

export default async function EntrarPage({ searchParams }: PageProps<'/entrar'>) {
  const params = await searchParams;
  const next = caminhoSeguro(typeof params.next === 'string' ? params.next : null);

  const [sessao, provedores] = await Promise.all([obterSessao(), provedoresAtivos()]);
  if (sessao) {
    redirect(next ? `/auth/continuar?next=${encodeURIComponent(next)}` : '/auth/continuar');
  }

  return (
    <section className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold">Entrar</h1>
      <p className="mt-1 mb-6 text-sm text-suave">
        {provedores.google
          ? 'Sem senha: use sua conta Google ou receba um link no e-mail.'
          : 'Sem senha: receba um link de acesso no seu e-mail.'}
      </p>
      {params.erro === 'link' && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          O link expirou ou já foi usado. Peça um novo abaixo.
        </p>
      )}
      <FormEntrar next={next} google={provedores.google} />
    </section>
  );
}
