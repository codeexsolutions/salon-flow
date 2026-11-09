import 'server-only';
import { HEADER_SALAO_ID } from '@salonflow/shared';
import { env } from '../env';

/**
 * Repassa o download do PDF do contrato da API para o navegador (o arquivo tem
 * dados pessoais: só sai com a sessão de quem pode ver).
 */
export async function repassarDownload(caminho: string, token: string, salaoId: string) {
  const resposta = await fetch(`${env.apiUrl}${caminho}`, {
    headers: { Authorization: `Bearer ${token}`, [HEADER_SALAO_ID]: salaoId },
    cache: 'no-store',
  });
  if (!resposta.ok || !resposta.body) {
    return new Response('Arquivo não encontrado.', { status: resposta.status || 404 });
  }
  return new Response(resposta.body, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition':
        resposta.headers.get('content-disposition') ?? 'attachment; filename="contrato.pdf"',
      'Cache-Control': 'private, no-store',
    },
  });
}

/** Envia o PDF (multipart) para a API e devolve a resposta dela como está. */
export async function repassarUpload(
  caminho: string,
  token: string,
  salaoId: string,
  arquivo: File,
) {
  const corpo = new FormData();
  corpo.append('arquivo', arquivo, arquivo.name);
  const resposta = await fetch(`${env.apiUrl}${caminho}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, [HEADER_SALAO_ID]: salaoId },
    body: corpo,
  });
  return new Response(await resposta.text(), {
    status: resposta.status,
    headers: { 'Content-Type': 'application/json' },
  });
}
