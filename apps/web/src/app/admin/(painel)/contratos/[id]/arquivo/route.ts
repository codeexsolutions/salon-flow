import { repassarDownload, repassarUpload } from '@/lib/api/arquivo-contrato';
import { obterContextoAdmin } from '@/lib/auth/contexto';
import { exigirSessao } from '@/lib/auth/sessao';

type Contexto = { params: Promise<{ id: string }> };

async function credenciais() {
  const [{ salao }, sessao] = await Promise.all([obterContextoAdmin(), exigirSessao('/admin')]);
  return { token: sessao.token, salaoId: salao.id };
}

/** Baixa o PDF assinado (a API confere que é o dono). */
export async function GET(_: Request, { params }: Contexto) {
  const { id } = await params;
  const { token, salaoId } = await credenciais();
  return repassarDownload(`/contratos/${id}/arquivo`, token, salaoId);
}

/** Envia o PDF assinado (campo "arquivo"). */
export async function POST(requisicao: Request, { params }: Contexto) {
  const { id } = await params;
  const arquivo = (await requisicao.formData()).get('arquivo');
  if (!(arquivo instanceof File)) {
    return Response.json({ mensagem: 'Escolha o arquivo PDF.' }, { status: 400 });
  }
  const { token, salaoId } = await credenciais();
  return repassarUpload(`/contratos/${id}/arquivo`, token, salaoId, arquivo);
}
