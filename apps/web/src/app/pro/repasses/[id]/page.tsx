import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { RepasseDetalhe } from '@salonflow/shared';
import { ComprovanteRepasse } from '@/components/comissoes/comprovante-repasse';
import { BotaoImprimir } from '@/components/ui/botao-imprimir';
import { api, ApiError } from '@/lib/api/client';
import { obterContextoPro } from '@/lib/auth/contexto';
import { exigirSessao } from '@/lib/auth/sessao';

export const metadata = { title: 'Comprovante de repasse' };

export default async function ProRepassePage({ params }: PageProps<'/pro/repasses/[id]'>) {
  const { id } = await params;
  const { salao } = await obterContextoPro();
  if (!salao) notFound();
  const sessao = await exigirSessao(`/pro/repasses/${id}`);

  let repasse: RepasseDetalhe;
  try {
    repasse = await api<RepasseDetalhe>(`/pro/comissoes/repasses/${id}`, {
      token: sessao.token,
      salaoId: salao.id,
      cache: 'no-store',
    });
  } catch (erro) {
    if (erro instanceof ApiError && [400, 404].includes(erro.erro.statusCode)) notFound();
    throw erro;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between print:hidden">
        <Link href="/pro/comissoes" className="text-sm text-suave">
          ← Comissões
        </Link>
        <BotaoImprimir rotulo="Salvar / imprimir" />
      </div>
      <ComprovanteRepasse repasse={repasse} />
    </div>
  );
}
