import Link from 'next/link';
import { FormNovoSalao } from '@/components/admin/form-novo-salao';
import { obterPerfil } from '@/lib/auth/sessao';

export const metadata = { title: 'Cadastrar salão' };

export default async function NovoSalaoPage() {
  const perfil = await obterPerfil('/admin/novo-salao');
  const jaTemSalao = perfil.saloes.some((s) => s.papel === 'DONO' || s.papel === 'RECEPCAO');

  return (
    <main className="mx-auto w-full max-w-md px-4 py-10">
      <p className="text-lg font-bold text-primaria">SalonFlow</p>
      <h1 className="mt-4 text-2xl font-bold">Cadastre seu salão</h1>
      <p className="mt-1 mb-6 text-sm text-suave">
        Você será o dono e poderá convidar sua equipe depois.
      </p>
      <FormNovoSalao />
      {jaTemSalao && (
        <Link href="/admin" className="mt-6 block text-center text-sm text-suave underline">
          Voltar para o painel
        </Link>
      )}
    </main>
  );
}
