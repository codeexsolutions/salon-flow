import { BUCKET_IMAGENS_SALAO } from '@salonflow/shared';
import { criarSupabaseBrowser } from './client';

const TIPOS_ACEITOS = ['image/jpeg', 'image/png', 'image/webp'];
const TAMANHO_MAXIMO = 2 * 1024 * 1024;

/**
 * Envia a imagem do salão (logo/capa) para o Supabase Storage e devolve a URL pública.
 * O Storage só aceita se o usuário logado for DONO do salão (política no banco).
 */
export async function enviarImagemSalao(
  salaoId: string,
  arquivo: File,
  tipo: 'logo' | 'capa',
): Promise<{ url: string } | { erro: string }> {
  if (!TIPOS_ACEITOS.includes(arquivo.type)) return { erro: 'Use uma imagem JPG, PNG ou WEBP.' };
  if (arquivo.size > TAMANHO_MAXIMO) return { erro: 'A imagem deve ter no máximo 2 MB.' };

  const extensao = arquivo.type.split('/')[1].replace('jpeg', 'jpg');
  const caminho = `${salaoId}/${tipo}-${Date.now()}.${extensao}`;
  const storage = criarSupabaseBrowser().storage.from(BUCKET_IMAGENS_SALAO);

  const { error } = await storage.upload(caminho, arquivo, {
    contentType: arquivo.type,
    cacheControl: '31536000',
  });
  if (error) return { erro: 'Não foi possível enviar a imagem. Tente de novo.' };
  return { url: storage.getPublicUrl(caminho).data.publicUrl };
}
