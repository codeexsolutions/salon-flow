import type { ConfigMensagens } from '@salonflow/shared';
import { FormMensagens } from '@/components/mensagens/form-mensagens';
import { CabecalhoPagina } from '@/components/ui/cabecalho-pagina';
import { apiSalao } from '@/lib/api/salao';
import { obterContextoAdmin } from '@/lib/auth/contexto';

export const metadata = { title: 'Mensagens' };

export default async function MensagensPage() {
  const { salao } = await obterContextoAdmin();
  if (salao.papel !== 'DONO') {
    return <p className="text-sm text-suave">Apenas o dono do salão configura as mensagens.</p>;
  }
  const config = await apiSalao<ConfigMensagens>('/mensagens/config');

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <CabecalhoPagina
        titulo="Mensagens"
        subtitulo="Notificações automáticas no app do cliente e textos prontos para o WhatsApp."
      />
      <FormMensagens config={config} salao={salao.nome} />
    </div>
  );
}
