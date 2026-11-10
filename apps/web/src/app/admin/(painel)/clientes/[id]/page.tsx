import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CalendarClock, Footprints, Receipt, Wallet } from 'lucide-react';
import {
  formatarPreco,
  montarMensagem,
  type ClienteDetalhe,
  type PontosCliente,
  type ProfissionalResumo,
  type ServicoResumo,
} from '@salonflow/shared';
import { excluirAnotacao, salvarAnotacao } from '@/app/admin/(painel)/clientes/actions';
import { EditarCliente } from '@/components/clientes/editar-cliente';
import { FichaTecnica } from '@/components/clientes/ficha-tecnica';
import { PontosDoCliente } from '@/components/fidelidade/pontos-cliente';
import { MenuWhatsApp } from '@/components/mensagens/menu-whatsapp';
import { CabecalhoPagina } from '@/components/ui/cabecalho-pagina';
import { Indicador } from '@/components/ui/indicador';
import { Secao } from '@/components/ui/secao';
import { ApiError } from '@/lib/api/client';
import { apiSalao } from '@/lib/api/salao';
import { obterContextoAdmin, pode } from '@/lib/auth/contexto';
import { dataPorExtenso, hojeNoFuso, horaLocal, dataLocal } from '@/lib/data-hora';
import { configMensagens, primeiroNome } from '@/lib/mensagens';
import { origemDoSite } from '@/lib/site';

export const metadata = { title: 'Cliente' };

const dataCurta = (d: string) => d.split('-').reverse().join('/');

function idade(nascimento: string, hoje: string) {
  const [a, m, d] = nascimento.split('-').map(Number);
  const [ah, mh, dh] = hoje.split('-').map(Number);
  return ah - a - (mh < m || (mh === m && dh < d) ? 1 : 0);
}

function Preferidos({
  titulo,
  lista,
}: {
  titulo: string;
  lista: { nome: string; vezes: number }[];
}) {
  if (lista.length === 0) return null;
  return (
    <div>
      <dt className="text-xs text-suave">{titulo}</dt>
      {lista.map((p) => (
        <dd key={p.nome} className="flex justify-between">
          {p.nome}
          <span className="text-suave">{p.vezes}×</span>
        </dd>
      ))}
    </div>
  );
}

export default async function ClientePage({ params }: PageProps<'/admin/clientes/[id]'>) {
  const { id } = await params;
  const { salao } = await obterContextoAdmin();
  if (!pode(salao, 'CLIENTES')) {
    return (
      <p className="text-sm text-suave">
        O histórico e a ficha dos clientes não estão liberados para você. Fale com o dono do salão.
      </p>
    );
  }

  let cliente: ClienteDetalhe;
  try {
    cliente = await apiSalao<ClienteDetalhe>(`/clientes/${id}`);
  } catch (erro) {
    if (erro instanceof ApiError && [400, 404].includes(erro.erro.statusCode)) notFound();
    throw erro;
  }
  const [servicos, profissionais, pontos] = await Promise.all([
    apiSalao<ServicoResumo[]>('/servicos').catch(() => []),
    apiSalao<ProfissionalResumo[]>('/profissionais').catch(() => []),
    apiSalao<PontosCliente>(`/fidelidade/clientes/${id}`).catch(() => null),
  ]);
  const [mensagens, origem] = await Promise.all([configMensagens(), origemDoSite()]);

  const fuso = salao.fusoHorario;
  const hoje = hojeNoFuso(fuso);
  const variaveis = {
    nome: primeiroNome(cliente.nome),
    salao: salao.nome,
    link: `${origem}/s/${salao.slug}`,
  };
  const proximo = cliente.proximosAgendamentos[0];
  const opcoesWhatsApp = [
    { rotulo: 'Conversa (sem texto)' },
    ...(proximo
      ? [
          {
            rotulo: 'Lembrete do próximo horário',
            texto: montarMensagem(mensagens.modelos.lembrete, {
              ...variaveis,
              servico: proximo.servico,
              profissional: proximo.profissional,
              data: dataPorExtenso(dataLocal(proximo.inicio, fuso)),
              hora: horaLocal(proximo.inicio, fuso),
            }),
          },
        ]
      : []),
    {
      rotulo: 'Feliz aniversário',
      texto: montarMensagem(mensagens.modelos.aniversario, variaveis),
    },
    { rotulo: 'Estamos com saudade', texto: montarMensagem(mensagens.modelos.saudade, variaveis) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <CabecalhoPagina
        voltar={{ href: '/admin/clientes', rotulo: 'Clientes' }}
        titulo={cliente.nome}
        subtitulo={[
          cliente.telefone,
          cliente.email,
          cliente.nascimento &&
            `${dataCurta(cliente.nascimento)} (${idade(cliente.nascimento, hoje)} anos)`,
          cliente.usaApp && 'usa o app',
        ]
          .filter(Boolean)
          .join(' · ')}
        acoes={<MenuWhatsApp telefone={cliente.telefone} opcoes={opcoesWhatsApp} />}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Indicador
          rotulo="Total gasto"
          valor={formatarPreco(cliente.totalGastoCentavos)}
          detalhe={
            cliente.primeiraVisita
              ? `Cliente desde ${dataCurta(cliente.primeiraVisita)}`
              : undefined
          }
          icone={Wallet}
        />
        <Indicador
          rotulo="Visitas"
          valor={cliente.visitas}
          detalhe={
            cliente.faltas + cliente.cancelamentos > 0
              ? `${cliente.faltas} falta(s) · ${cliente.cancelamentos} cancelamento(s)`
              : 'Nenhuma falta'
          }
          icone={Footprints}
          destaque={cliente.faltas > 0}
        />
        <Indicador
          rotulo="Ticket médio"
          valor={formatarPreco(cliente.ticketMedioCentavos)}
          icone={Receipt}
        />
        <Indicador
          rotulo="Última visita"
          valor={cliente.ultimaVisita ? dataCurta(cliente.ultimaVisita) : '—'}
          detalhe={
            cliente.diasSemVir === null
              ? 'Ainda não veio'
              : cliente.diasSemVir === 0
                ? 'Hoje'
                : `Há ${cliente.diasSemVir} dias`
          }
          icone={CalendarClock}
          destaque={(cliente.diasSemVir ?? 0) >= 60}
        />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <Secao
            titulo="Ficha técnica"
            descricao="O que foi feito em cada atendimento: fórmulas, tons, produtos e cuidados."
          >
            <FichaTecnica
              clienteId={cliente.id}
              anotacoes={cliente.anotacoes}
              servicos={servicos.filter((s) => s.ativo).map(({ id, nome }) => ({ id, nome }))}
              profissionais={profissionais
                .filter((p) => p.ativo)
                .map(({ id, nome }) => ({ id, nome }))}
              padrao={{ data: hoje }}
              salvar={salvarAnotacao}
              excluir={excluirAnotacao}
            />
          </Secao>

          <Secao
            titulo="Histórico de atendimentos"
            descricao={
              cliente.atendimentos.length >= 100 ? 'Os 100 atendimentos mais recentes.' : undefined
            }
          >
            {cliente.atendimentos.length === 0 ? (
              <p className="text-sm text-suave">Nenhum atendimento fechado ainda.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-borda text-sm">
                {cliente.atendimentos.map((a) => (
                  <li key={a.comandaId} className="flex flex-col gap-1 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/admin/comandas/${a.comandaId}`}
                        className="font-medium hover:text-primaria"
                      >
                        {dataCurta(a.data)}
                        <span className="ml-2 text-xs font-normal text-suave">
                          comanda {a.numero}
                        </span>
                      </Link>
                      <span className="font-semibold">{formatarPreco(a.totalCentavos)}</span>
                    </div>
                    <ul className="text-xs text-suave">
                      {a.itens.map((i, n) => (
                        <li key={n} className="flex justify-between gap-2">
                          <span>
                            {i.descricao}
                            {i.profissional && ` · ${i.profissional}`}
                          </span>
                          <span>{formatarPreco(i.valorCentavos)}</span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </Secao>
        </div>

        <div className="flex flex-col gap-6">
          {pontos && (
            <Secao titulo="Pontos de fidelidade">
              <PontosDoCliente
                clienteId={cliente.id}
                pontos={pontos}
                ehDono={salao.papel === 'DONO'}
              />
            </Secao>
          )}

          <Secao titulo="Próximos horários">
            {cliente.proximosAgendamentos.length === 0 ? (
              <p className="text-sm text-suave">Nenhum horário marcado.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {cliente.proximosAgendamentos.map((a) => {
                  const data = dataLocal(a.inicio, fuso);
                  return (
                    <li key={a.id}>
                      <Link
                        href={`/admin/agenda?data=${data}`}
                        className="flex flex-col rounded-lg px-2 py-1.5 hover:bg-nude"
                      >
                        <span className="font-medium">
                          {dataPorExtenso(data)}, {horaLocal(a.inicio, fuso)}
                        </span>
                        <span className="text-xs text-suave">
                          {a.servico} · {a.profissional}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Secao>

          {(cliente.servicosPreferidos.length > 0 ||
            cliente.profissionaisPreferidos.length > 0) && (
            <Secao titulo="Preferências">
              <dl className="flex flex-col gap-3 text-sm">
                <Preferidos titulo="Serviços que mais faz" lista={cliente.servicosPreferidos} />
                <Preferidos titulo="Mais atendida(o) por" lista={cliente.profissionaisPreferidos} />
              </dl>
            </Secao>
          )}

          <Secao titulo="Dados do cliente">
            <EditarCliente cliente={cliente} />
          </Secao>
        </div>
      </div>
    </div>
  );
}
