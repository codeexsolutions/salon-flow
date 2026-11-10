'use client';

import { useMemo, useState, useTransition } from 'react';
import { AlertCircle, Bell, MessageCircle, Send, Users } from 'lucide-react';
import {
  linkWhatsApp,
  linkWhatsAppWeb,
  montarMensagem,
  TAMANHO_MENSAGEM_PUSH,
  TAMANHO_TITULO_PUSH,
  tituloComSalao,
  type AssinantePush,
  type ModeloMensagem,
} from '@salonflow/shared';
import { enviarPushManual } from '@/app/admin/(painel)/mensagens/actions';
import { Campo, classeBotaoPrimario, classeInput, MensagemForm } from '@/components/ui/campo';
import { Secao } from '@/components/ui/secao';

type ClienteOpcao = { id: string; nome: string; telefone: string | null };

const TEXTOS_PRONTOS: { modelo: ModeloMensagem; titulo: string; rotulo: string }[] = [
  { modelo: 'saudade', titulo: 'Estamos com saudade!', rotulo: 'Estamos com saudade' },
  { modelo: 'aniversario', titulo: 'Feliz aniversário! 🎉', rotulo: 'Aniversário' },
];

const primeiroNome = (nome: string) => nome.trim().split(/\s+/)[0] ?? nome;
const ehCelular = () => /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);

/**
 * Envio manual: push para um cliente ou para todos com notificações ativas, e
 * WhatsApp (um cliente por vez) com o mesmo texto.
 */
export function EnviarMensagem({
  salao,
  logoUrl,
  origem,
  slug,
  assinantes,
  clientes,
  modelos,
}: {
  salao: string;
  /** Logo do salão: é o ícone da notificação no celular. */
  logoUrl: string | null;
  origem: string;
  slug: string;
  assinantes: AssinantePush[];
  clientes: ClienteOpcao[];
  modelos: Record<ModeloMensagem, string>;
}) {
  const [destino, setDestino] = useState<'TODOS' | 'UM'>('TODOS');
  const [busca, setBusca] = useState('');
  const [cliente, setCliente] = useState<ClienteOpcao | null>(null);
  const [titulo, setTitulo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [url, setUrl] = useState('');
  const [retorno, setRetorno] = useState<{ ok: boolean; mensagem: string } | null>(null);
  const [pendente, iniciar] = useTransition();

  const comPush = useMemo(() => new Set(assinantes.map((a) => a.clienteId)), [assinantes]);
  const encontrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (termo.length < 2) return [];
    const digitos = termo.replace(/\D/g, '');
    return clientes
      .filter(
        (c) =>
          c.nome.toLowerCase().includes(termo) ||
          (digitos.length >= 3 && (c.telefone ?? '').replace(/\D/g, '').includes(digitos)),
      )
      .slice(0, 8);
  }, [busca, clientes]);

  const clienteTemPush = cliente ? comPush.has(cliente.id) : false;
  const linkDestino = url.trim()
    ? url.trim().startsWith('/')
      ? `${origem}${url.trim()}`
      : url.trim()
    : `${origem}/s/${slug}`;
  const variaveis = {
    nome: cliente ? primeiroNome(cliente.nome) : 'Ana',
    salao,
    link: linkDestino,
  };
  const tituloPrevia = montarMensagem(titulo, variaveis);
  const mensagemPrevia = montarMensagem(mensagem, variaveis);

  function usarTexto(modelo: string) {
    const pronto = TEXTOS_PRONTOS.find((t) => t.modelo === modelo);
    if (!pronto) return;
    setRetorno(null);
    setTitulo(pronto.titulo);
    // No push o toque já abre o link: tira o {link} do texto.
    setMensagem(modelos[pronto.modelo].replace(/\s*\{link\}/g, '').slice(0, TAMANHO_MENSAGEM_PUSH));
  }

  function enviarPush() {
    setRetorno(null);
    if (destino === 'TODOS' && !confirm(`Enviar para ${assinantes.length} cliente(s)?`)) return;
    iniciar(async () => {
      const r = await enviarPushManual({
        destino: destino === 'TODOS' ? 'TODOS' : cliente?.id,
        titulo,
        mensagem,
        url,
      });
      setRetorno(
        r.ok
          ? {
              ok: true,
              mensagem: `Enviada para ${r.dados.clientes} cliente(s) · ${r.dados.entregues} aparelho(s) receberam.`,
            }
          : { ok: false, mensagem: r.erro },
      );
    });
  }

  function enviarWhatsApp() {
    if (!cliente) return;
    const corpo =
      mensagem.includes('{link}') || !url.trim()
        ? mensagemPrevia
        : `${mensagemPrevia}\n${linkDestino}`;
    const texto = tituloPrevia ? `*${tituloPrevia}*\n${corpo}` : corpo;
    const link = ehCelular()
      ? linkWhatsApp(cliente.telefone, texto)
      : linkWhatsAppWeb(cliente.telefone, texto);
    if (link) window.open(link, '_blank', 'noopener');
  }

  const podePush =
    titulo.trim().length >= 2 &&
    mensagem.trim().length >= 2 &&
    (destino === 'TODOS' ? assinantes.length > 0 : clienteTemPush);
  const podeWhatsApp =
    destino === 'UM' &&
    !!cliente &&
    !!linkWhatsApp(cliente.telefone) &&
    mensagem.trim().length >= 2;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Secao titulo="Nova mensagem">
        <div className="flex flex-col gap-4 text-sm">
          <Campo rotulo="Destinatários">
            <select
              value={destino}
              onChange={(e) => {
                setRetorno(null);
                setDestino(e.target.value as 'TODOS' | 'UM');
              }}
              className={classeInput}
            >
              <option value="TODOS">
                Todos os clientes com notificações ativas ({assinantes.length})
              </option>
              <option value="UM">Um cliente</option>
            </select>
          </Campo>

          {destino === 'UM' && (
            <div className="flex flex-col gap-2">
              {cliente ? (
                <div className="flex items-center justify-between gap-2 rounded-xl border border-borda p-3">
                  <span className="flex flex-col">
                    <span className="font-medium">{cliente.nome}</span>
                    <span className="text-xs text-suave">
                      {cliente.telefone ?? 'Sem telefone'} ·{' '}
                      {clienteTemPush ? (
                        <span className="text-sucesso">notificações ativas</span>
                      ) : (
                        'não ativou as notificações (use o WhatsApp)'
                      )}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setCliente(null)}
                    className="text-xs text-primaria"
                  >
                    Trocar
                  </button>
                </div>
              ) : (
                <>
                  <input
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar cliente por nome ou telefone"
                    aria-label="Buscar cliente"
                    className={classeInput}
                  />
                  {encontrados.length > 0 && (
                    <ul className="flex flex-col divide-y divide-borda rounded-xl border border-borda">
                      {encontrados.map((c) => (
                        <li key={c.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setCliente(c);
                              setBusca('');
                              setRetorno(null);
                            }}
                            className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-nude"
                          >
                            <span>{c.nome}</span>
                            {comPush.has(c.id) && (
                              <Bell
                                className="size-3.5 text-sucesso"
                                aria-label="Notificações ativas"
                              />
                            )}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
            </div>
          )}

          <Campo rotulo="Usar texto pronto (opcional)">
            <select value="" onChange={(e) => usarTexto(e.target.value)} className={classeInput}>
              <option value="">Escolher…</option>
              {TEXTOS_PRONTOS.map((t) => (
                <option key={t.modelo} value={t.modelo}>
                  {t.rotulo}
                </option>
              ))}
            </select>
          </Campo>

          <Campo rotulo="Título">
            <input
              value={titulo}
              maxLength={TAMANHO_TITULO_PUSH}
              onChange={(e) => {
                setRetorno(null);
                setTitulo(e.target.value);
              }}
              placeholder="Ex.: Semana da hidratação"
              className={classeInput}
            />
            <span className="flex justify-between gap-2 text-xs text-suave">
              <span>Se o título não citar o salão, o nome dele entra na frente.</span>
              <span>
                {titulo.length}/{TAMANHO_TITULO_PUSH}
              </span>
            </span>
          </Campo>

          <Campo rotulo="Mensagem">
            <textarea
              rows={4}
              value={mensagem}
              maxLength={TAMANHO_MENSAGEM_PUSH}
              onChange={(e) => {
                setRetorno(null);
                setMensagem(e.target.value);
              }}
              placeholder="Ex.: Oi, {nome}! Esta semana a hidratação está com 20% de desconto. Agende pelo app."
              className={classeInput}
            />
            <span className="flex justify-between gap-2 text-xs text-suave">
              <span>
                Variáveis: <code>{'{nome}'}</code> (de cada cliente), <code>{'{salao}'}</code>
              </span>
              <span>
                {mensagem.length}/{TAMANHO_MENSAGEM_PUSH}
              </span>
            </span>
          </Campo>

          <Campo
            rotulo="Link ao tocar (opcional)"
            ajuda="Sem link, abre a página do salão. Ex.: /meus-pontos ou https://..."
          >
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={`/s/${slug}`}
              className={classeInput}
            />
          </Campo>

          {retorno && <MensagemForm sucesso={retorno.ok} mensagem={retorno.mensagem} />}

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={enviarPush}
              disabled={!podePush || pendente}
              className={classeBotaoPrimario}
            >
              <Send className="size-4" aria-hidden />
              {pendente ? 'Enviando…' : 'Enviar notificação'}
            </button>
            <button
              type="button"
              onClick={enviarWhatsApp}
              disabled={!podeWhatsApp}
              title={
                destino === 'TODOS' ? 'O WhatsApp é enviado para um cliente por vez' : undefined
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#25d366] px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#1ebe5a] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <MessageCircle className="size-4" aria-hidden />
              Enviar WhatsApp
            </button>
          </div>

          <p className="flex gap-2 rounded-xl border border-borda bg-nude/40 p-3 text-xs text-suave">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-alerta" aria-hidden />A notificação
            chega em quem usa o app e ativou as notificações. Envie com moderação (no máximo algumas
            por semana) para o cliente não desativar. O WhatsApp abre com o texto pronto para um
            cliente por vez: no celular, no app; no computador, no WhatsApp Web.
          </p>
        </div>
      </Secao>

      <div className="flex flex-col gap-4">
        <Secao titulo="Pré-visualização">
          <div className="rounded-2xl border border-borda bg-nude/40 p-3">
            <div className="flex gap-3 rounded-xl bg-superficie p-3 shadow-sm">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt=""
                  className="size-9 shrink-0 rounded-lg border border-borda object-cover"
                />
              ) : (
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-nude text-primaria">
                  <Bell className="size-4" aria-hidden />
                </span>
              )}
              <span className="flex min-w-0 flex-col">
                <span className="text-xs text-suave">SalonFlow · agora</span>
                <span className="truncate font-medium">
                  {tituloComSalao(tituloPrevia || 'Título da notificação', salao)}
                </span>
                <span className="line-clamp-3 text-sm text-suave">
                  {mensagemPrevia || 'A mensagem aparece aqui…'}
                </span>
              </span>
            </div>
          </div>
        </Secao>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1 rounded-2xl border border-borda bg-superficie p-4">
            <span className="flex items-center gap-1.5 text-xs text-suave">
              <Users className="size-3.5" aria-hidden /> Destinatários
            </span>
            <span className="truncate text-lg font-medium">
              {destino === 'TODOS' ? `${assinantes.length} cliente(s)` : (cliente?.nome ?? '—')}
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-2xl border border-borda bg-superficie p-4">
            <span className="flex items-center gap-1.5 text-xs text-suave">
              <Bell className="size-3.5" aria-hidden /> Caracteres
            </span>
            <span className="text-lg font-medium">
              {titulo.length + mensagem.length}
              <span className="text-xs text-suave">
                /{TAMANHO_TITULO_PUSH + TAMANHO_MENSAGEM_PUSH}
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
