import Link from 'next/link';
import type { PerfilCliente } from '@salonflow/shared';
import { FormPerfilCliente } from '@/components/cliente/form-perfil-cliente';
import { AtivarNotificacoes } from '@/components/pwa/ativar-notificacoes';
import { CabecalhoPagina } from '@/components/ui/cabecalho-pagina';
import { Secao } from '@/components/ui/secao';
import { api } from '@/lib/api/client';
import { exigirSessao } from '@/lib/auth/sessao';
import { chavePublicaPush } from '@/lib/push/chave';

export const metadata = { title: 'Meus dados' };

const VAZIO: PerfilCliente = {
  nome: null,
  telefone: null,
  email: null,
  nascimento: null,
  saloes: 0,
};

export default async function MeusDadosPage() {
  const sessao = await exigirSessao('/conta/dados');
  // API antiga (sem cadastro do cliente): formulário vazio.
  const perfil = await api<PerfilCliente>('/me/perfil-cliente', {
    token: sessao.token,
    cache: 'no-store',
  }).catch(() => VAZIO);

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6">
      <CabecalhoPagina
        titulo="Meus dados"
        subtitulo="Opcional. Preencha uma vez e os salões em que você agenda já recebem seus dados."
        voltar={{ href: '/conta/senha', rotulo: 'Minha conta' }}
      />
      <AtivarNotificacoes chavePublica={await chavePublicaPush()} />
      <Secao titulo="Cadastro">
        <FormPerfilCliente perfil={perfil} />
      </Secao>
      <p className="text-xs text-suave">
        Só estes dados são compartilhados. Seus serviços, histórico e pontos ficam em cada salão. Se
        preferir, deixe em branco: o salão completa no atendimento.{' '}
        <Link href="/meus-agendamentos" className="text-primaria underline">
          Meus agendamentos
        </Link>
      </p>
    </div>
  );
}
