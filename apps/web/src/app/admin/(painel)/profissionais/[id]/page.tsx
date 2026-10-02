import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { BloqueioAgenda, ProfissionalDetalhe } from '@salonflow/shared';
import { EditorJornada } from '@/components/profissionais/editor-jornada';
import { Folgas } from '@/components/profissionais/folgas';
import { FormProfissional } from '@/components/profissionais/form-profissional';
import { SeloAcesso } from '@/components/profissionais/selo-acesso';
import { classeBotaoSecundario } from '@/components/ui/campo';
import { Secao } from '@/components/ui/secao';
import { ApiError } from '@/lib/api/client';
import { apiSalao } from '@/lib/api/salao';
import { obterContextoAdmin } from '@/lib/auth/contexto';
import { alterarAtivo } from '../actions';

async function carregar(id: string) {
  try {
    return await Promise.all([
      apiSalao<ProfissionalDetalhe>(`/profissionais/${id}`),
      apiSalao<BloqueioAgenda[]>(`/profissionais/${id}/bloqueios`),
    ]);
  } catch (erro) {
    if (erro instanceof ApiError && [400, 404].includes(erro.erro.statusCode)) notFound();
    throw erro;
  }
}

export default async function ProfissionalPage({ params }: PageProps<'/admin/profissionais/[id]'>) {
  const { id } = await params;
  const [{ salao }, [profissional, bloqueios]] = await Promise.all([
    obterContextoAdmin(),
    carregar(id),
  ]);
  const ehDono = salao.papel === 'DONO';

  return (
    <div className="flex max-w-2xl flex-col gap-8">
      <div>
        <Link href="/admin/profissionais" className="text-sm text-suave">
          ← Profissionais
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl">{profissional.nome}</h1>
          {profissional.ativo ? (
            <SeloAcesso acesso={profissional.acessoApp} />
          ) : (
            <span className="text-sm text-suave">Desativado</span>
          )}
        </div>
      </div>

      {ehDono && (
        <Secao titulo="Dados">
          <FormProfissional profissional={profissional} />
        </Secao>
      )}

      <Secao
        titulo="Jornada semanal"
        descricao="Horários em que o profissional atende. Use dois intervalos para marcar o almoço."
      >
        <EditorJornada profissionalId={profissional.id} jornada={profissional.jornada} />
      </Secao>

      <Secao titulo="Folgas e bloqueios" descricao="Períodos em que não haverá atendimento.">
        <Folgas
          profissionalId={profissional.id}
          bloqueios={bloqueios}
          fusoHorario={salao.fusoHorario}
        />
      </Secao>

      {ehDono && (
        <Secao
          titulo={profissional.ativo ? 'Desativar profissional' : 'Reativar profissional'}
          descricao={
            profissional.ativo
              ? 'Ele deixa de aparecer na agenda e perde o acesso ao app. O histórico é mantido.'
              : 'Ele volta a aparecer na agenda e recupera o acesso ao app.'
          }
        >
          <form action={alterarAtivo.bind(null, profissional.id, !profissional.ativo)}>
            <button
              type="submit"
              className={
                profissional.ativo ? `${classeBotaoSecundario} text-perigo` : classeBotaoSecundario
              }
            >
              {profissional.ativo ? 'Desativar' : 'Reativar'}
            </button>
          </form>
        </Secao>
      )}
    </div>
  );
}
