import Link from 'next/link';
import { Bell, MessageCircle, Send, Settings, Users } from 'lucide-react';
import {
  linkWhatsApp,
  type AssinantePush,
  type ClienteNaLista,
  type ConfigMensagens,
} from '@salonflow/shared';
import { EnviarMensagem } from '@/components/mensagens/enviar-mensagem';
import { FormMensagens } from '@/components/mensagens/form-mensagens';
import { CabecalhoPagina } from '@/components/ui/cabecalho-pagina';
import { EstadoVazio } from '@/components/ui/estado-vazio';
import { Secao } from '@/components/ui/secao';
import { apiSalao } from '@/lib/api/salao';
import { obterContextoAdmin } from '@/lib/auth/contexto';
import { origemDoSite } from '@/lib/site';

export const metadata = { title: 'Mensagens' };

const ABAS = [
  { id: 'enviar', rotulo: 'Enviar', icone: Send },
  { id: 'assinantes', rotulo: 'Assinantes', icone: Users },
  { id: 'config', rotulo: 'Configurações', icone: Settings },
] as const;
type Aba = (typeof ABAS)[number]['id'];

export default async function MensagensPage({ searchParams }: PageProps<'/admin/mensagens'>) {
  const { salao } = await obterContextoAdmin();
  if (salao.papel !== 'DONO') {
    return (
      <p className="text-sm text-suave">Apenas o dono do salão envia e configura mensagens.</p>
    );
  }
  const pedida = (await searchParams).aba;
  const aba: Aba = ABAS.some((a) => a.id === pedida) ? (pedida as Aba) : 'enviar';

  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <CabecalhoPagina
        titulo="Mensagens"
        subtitulo="Notificações no app do cliente e mensagens prontas para o WhatsApp."
      />
      <nav
        className="flex w-fit gap-1 rounded-xl border border-borda bg-superficie p-1 text-sm"
        aria-label="Seções de mensagens"
      >
        {ABAS.map(({ id, rotulo, icone: Icone }) => (
          <Link
            key={id}
            href={`/admin/mensagens?aba=${id}`}
            aria-current={aba === id ? 'page' : undefined}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 ${
              aba === id ? 'bg-nude font-medium text-primaria' : 'text-suave hover:text-foreground'
            }`}
          >
            <Icone className="size-4" aria-hidden />
            {rotulo}
          </Link>
        ))}
      </nav>

      {aba === 'enviar' && <AbaEnviar nome={salao.nome} slug={salao.slug} />}
      {aba === 'assinantes' && <AbaAssinantes />}
      {aba === 'config' && <AbaConfig nome={salao.nome} />}
    </div>
  );
}

async function AbaEnviar({ nome, slug }: { nome: string; slug: string }) {
  const [assinantes, clientes, config, origem] = await Promise.all([
    apiSalao<AssinantePush[]>('/mensagens/assinantes').catch(() => [] as AssinantePush[]),
    apiSalao<ClienteNaLista[]>('/clientes/todos'),
    apiSalao<ConfigMensagens>('/mensagens/config'),
    origemDoSite(),
  ]);
  return (
    <EnviarMensagem
      salao={nome}
      slug={slug}
      origem={origem}
      assinantes={assinantes}
      clientes={clientes.map(({ id, nome, telefone }) => ({ id, nome, telefone }))}
      modelos={config.modelos}
    />
  );
}

async function AbaAssinantes() {
  const assinantes = await apiSalao<AssinantePush[]>('/mensagens/assinantes').catch(
    () => [] as AssinantePush[],
  );
  if (assinantes.length === 0) {
    return (
      <EstadoVazio
        icone={Bell}
        titulo="Nenhum cliente com notificações ativas"
        descricao="O cliente ativa em Meus agendamentos, no app. Quem ativar aparece aqui."
      />
    );
  }
  return (
    <Secao
      titulo={`${assinantes.length} cliente(s) com notificações ativas`}
      descricao="Recebem lembretes, pedidos de avaliação e as mensagens enviadas por aqui."
    >
      <ul className="flex flex-col divide-y divide-borda text-sm">
        {assinantes.map((a) => {
          const whatsapp = linkWhatsApp(a.telefone);
          return (
            <li key={a.clienteId} className="flex items-center gap-3 py-2.5">
              <Link
                href={`/admin/clientes/${a.clienteId}`}
                className="flex min-w-0 flex-1 flex-col hover:text-primaria"
              >
                <span className="truncate font-medium">{a.nome}</span>
                <span className="text-xs text-suave">{a.telefone ?? 'Sem telefone'}</span>
              </Link>
              <span className="shrink-0 text-xs text-suave">{a.aparelhos} aparelho(s)</span>
              {whatsapp && (
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="flex size-8 items-center justify-center rounded-full text-sucesso hover:bg-sucesso-suave"
                  aria-label={`WhatsApp de ${a.nome}`}
                >
                  <MessageCircle className="size-4" aria-hidden />
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </Secao>
  );
}

async function AbaConfig({ nome }: { nome: string }) {
  const config = await apiSalao<ConfigMensagens>('/mensagens/config');
  return <FormMensagens config={config} salao={nome} />;
}
