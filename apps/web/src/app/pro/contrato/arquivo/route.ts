import { repassarDownload } from '@/lib/api/arquivo-contrato';
import { obterContextoPro } from '@/lib/auth/contexto';
import { exigirSessao } from '@/lib/auth/sessao';

/** Profissional baixa o PDF assinado do próprio contrato. */
export async function GET() {
  const [{ salao }, sessao] = await Promise.all([obterContextoPro(), exigirSessao('/pro')]);
  if (!salao) return new Response('Sem salão.', { status: 404 });
  return repassarDownload('/pro/contrato/arquivo', sessao.token, salao.id);
}
