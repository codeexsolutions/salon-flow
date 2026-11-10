import Link from 'next/link';
import { CalendarClock, Cake, Receipt, UserPlus, Users } from 'lucide-react';
import { formatarPreco, type ClienteNaLista } from '@salonflow/shared';
import { ListaClientes } from '@/components/clientes/lista-clientes';
import { NovoCliente } from '@/components/clientes/novo-cliente';
import { CabecalhoPagina } from '@/components/ui/cabecalho-pagina';
import { classeBotaoPrimario } from '@/components/ui/campo';
import { Indicador } from '@/components/ui/indicador';
import { Secao } from '@/components/ui/secao';
import { apiSalao } from '@/lib/api/salao';
import { obterContextoAdmin, pode } from '@/lib/auth/contexto';
import { hojeNoFuso } from '@/lib/data-hora';
import { configMensagens } from '@/lib/mensagens';
import { origemDoSite } from '@/lib/site';

export const metadata = { title: 'Clientes' };

/** Cliente "ativo": veio nos últimos 90 dias. */
const DIAS_ATIVO = 90;

export default async function ClientesPage() {
  const { salao } = await obterContextoAdmin();

  // Só cadastro: a pessoa vê o formulário, sem histórico nem valores.
  if (!pode(salao, 'CLIENTES')) {
    return (
      <div className="flex max-w-2xl flex-col gap-6">
        <CabecalhoPagina titulo="Cadastrar cliente" />
        <Secao titulo="Dados do cliente">
          <NovoCliente abrirFicha={false} />
        </Secao>
      </div>
    );
  }

  const [clientes, mensagens, origem] = await Promise.all([
    apiSalao<ClienteNaLista[]>('/clientes/todos'),
    configMensagens(),
    origemDoSite(),
  ]);
  const mesAtual = hojeNoFuso(salao.fusoHorario).slice(5, 7);

  const ativos = clientes.filter((c) => c.diasSemVir !== null && c.diasSemVir < DIAS_ATIVO);
  const comVisita = clientes.filter((c) => c.visitas > 0);
  const totalGasto = comVisita.reduce((s, c) => s + c.totalGastoCentavos, 0);
  const totalVisitas = comVisita.reduce((s, c) => s + c.visitas, 0);
  const aniversariantes = clientes.filter((c) => c.nascimento?.slice(5, 7) === mesAtual).length;

  return (
    <div className="flex flex-col gap-6">
      <CabecalhoPagina
        titulo="Clientes"
        subtitulo="Quanto cada cliente gastou, quando veio e a ficha técnica dos atendimentos."
        acoes={
          <Link href="/admin/clientes/novo" className={classeBotaoPrimario}>
            <UserPlus className="size-4" aria-hidden />
            Novo cliente
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Indicador rotulo="Clientes" valor={clientes.length} icone={Users} />
        <Indicador
          rotulo="Ativos"
          valor={ativos.length}
          detalhe={`Vieram nos últimos ${DIAS_ATIVO} dias`}
          icone={CalendarClock}
        />
        <Indicador
          rotulo="Ticket médio"
          valor={formatarPreco(totalVisitas > 0 ? Math.round(totalGasto / totalVisitas) : 0)}
          detalhe="Por visita, de todos os clientes"
          icone={Receipt}
        />
        <Indicador
          rotulo="Aniversariantes"
          valor={aniversariantes}
          detalhe="Neste mês (com data de nascimento)"
          icone={Cake}
        />
      </div>

      <ListaClientes
        clientes={clientes}
        mesAtual={mesAtual}
        whatsapp={{
          salao: salao.nome,
          link: `${origem}/s/${salao.slug}`,
          aniversario: mensagens.modelos.aniversario,
          saudade: mensagens.modelos.saudade,
        }}
      />
    </div>
  );
}
