import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  formatarDuracao,
  formatarPreco,
  type ProfissionalResumo,
  type ServicoDetalhe,
  type ServicoResumo,
} from '@salonflow/shared';
import { EditorProfissionaisServico } from '@/components/servicos/editor-profissionais-servico';
import { FormServico } from '@/components/servicos/form-servico';
import { classeBotaoSecundario } from '@/components/ui/campo';
import { Secao } from '@/components/ui/secao';
import { ApiError } from '@/lib/api/client';
import { apiSalao } from '@/lib/api/salao';
import { obterContextoAdmin } from '@/lib/auth/contexto';
import { alterarAtivoServico } from '../actions';
import { categoriasDe } from '../categorias';

async function carregar(id: string) {
  try {
    return await Promise.all([
      apiSalao<ServicoDetalhe>(`/servicos/${id}`),
      apiSalao<ServicoResumo[]>('/servicos?incluirInativos=true'),
      apiSalao<ProfissionalResumo[]>('/profissionais'),
    ]);
  } catch (erro) {
    if (erro instanceof ApiError && [400, 404].includes(erro.erro.statusCode)) notFound();
    throw erro;
  }
}

export default async function ServicoPage({ params }: PageProps<'/admin/servicos/[id]'>) {
  const { id } = await params;
  const [{ salao }, [servico, todos, profissionais]] = await Promise.all([
    obterContextoAdmin(),
    carregar(id),
  ]);
  const ehDono = salao.papel === 'DONO';

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <div>
        <Link href="/admin/servicos" className="text-sm text-suave">
          ← Serviços
        </Link>
        <h1 className="mt-2 text-2xl font-bold">{servico.nome}</h1>
        <p className="text-sm text-suave">
          {formatarPreco(servico.precoCentavos)} · {formatarDuracao(servico.duracaoMin)}
          {!servico.ativo && ' · desativado'}
        </p>
      </div>

      {ehDono ? (
        <>
          <Secao titulo="Dados do serviço">
            <FormServico servico={servico} categorias={categoriasDe(todos)} />
          </Secao>

          <Secao
            titulo="Quem faz este serviço"
            descricao="Só os profissionais marcados aparecem para o cliente ao agendar."
          >
            <EditorProfissionaisServico
              servicoId={servico.id}
              precoCentavos={servico.precoCentavos}
              duracaoMin={servico.duracaoMin}
              profissionais={profissionais}
              vinculados={servico.profissionais}
            />
          </Secao>

          <Secao
            titulo={servico.ativo ? 'Desativar serviço' : 'Reativar serviço'}
            descricao={
              servico.ativo
                ? 'Deixa de ser oferecido para novos agendamentos. O histórico é mantido.'
                : 'Volta a ser oferecido para agendamento.'
            }
          >
            <form action={alterarAtivoServico.bind(null, servico.id, !servico.ativo)}>
              <button
                type="submit"
                className={
                  servico.ativo ? `${classeBotaoSecundario} text-red-600` : classeBotaoSecundario
                }
              >
                {servico.ativo ? 'Desativar' : 'Reativar'}
              </button>
            </form>
          </Secao>
        </>
      ) : (
        <Secao titulo="Quem faz este serviço">
          {servico.profissionais.length === 0 ? (
            <p className="text-sm text-suave">Nenhum profissional vinculado.</p>
          ) : (
            <ul className="text-sm">
              {servico.profissionais.map((p) => (
                <li key={p.profissionalId}>
                  {p.nome}
                  {(p.precoCentavos !== null || p.duracaoMin !== null) && (
                    <span className="text-suave">
                      {' '}
                      · {formatarPreco(p.precoCentavos ?? servico.precoCentavos)} ·{' '}
                      {formatarDuracao(p.duracaoMin ?? servico.duracaoMin)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Secao>
      )}
    </div>
  );
}
