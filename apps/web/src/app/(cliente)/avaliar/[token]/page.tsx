import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { AvaliacaoPublica } from '@salonflow/shared';
import { FormAvaliacao } from '@/components/cliente/form-avaliacao';
import { ApiError, api } from '@/lib/api/client';

export const metadata = { title: 'Avaliar atendimento', robots: { index: false } };

const dataCurta = (d: string) => d.split('-').reverse().join('/');

export default async function AvaliarPage({ params }: PageProps<'/avaliar/[token]'>) {
  const { token } = await params;
  let avaliacao: AvaliacaoPublica;
  try {
    avaliacao = await api<AvaliacaoPublica>(`/avaliacao-publica/${token}`, { cache: 'no-store' });
  } catch (erro) {
    if (erro instanceof ApiError && [400, 404].includes(erro.erro.statusCode)) notFound();
    throw erro;
  }
  const profissionais = [
    ...new Set(avaliacao.itens.map((i) => i.profissional).filter((p): p is string => !!p)),
  ];

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <header className="flex flex-col items-center gap-3 text-center">
        {avaliacao.salao.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avaliacao.salao.logoUrl}
            alt=""
            className="size-16 rounded-full border border-borda object-cover"
          />
        )}
        <div>
          <p className="text-sm text-suave">{avaliacao.salao.nome}</p>
          <h1 className="text-3xl">Como foi seu atendimento?</h1>
          <p className="mt-1 text-sm text-suave">
            {dataCurta(avaliacao.data)} · {avaliacao.itens.map((i) => i.descricao).join(', ')}
            {profissionais.length > 0 && ` · com ${profissionais.join(' e ')}`}
          </p>
        </div>
      </header>

      <FormAvaliacao token={token} inicial={avaliacao} />

      <Link
        href={`/s/${avaliacao.salao.slug}`}
        className="self-center text-sm text-primaria underline"
      >
        Agendar de novo no {avaliacao.salao.nome}
      </Link>
    </div>
  );
}
