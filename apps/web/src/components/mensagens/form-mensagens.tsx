'use client';

import { useState, useTransition } from 'react';
import {
  MODELOS_MENSAGEM,
  MODELOS_PADRAO,
  montarMensagem,
  ROTULO_MODELO,
  type ConfigMensagens,
  type ModeloMensagem,
} from '@salonflow/shared';
import { salvarConfigMensagens } from '@/app/admin/(painel)/mensagens/actions';
import { Campo, classeBotaoPrimario, classeInput, MensagemForm } from '@/components/ui/campo';
import { Secao } from '@/components/ui/secao';

const OPCOES_LEMBRETE = [null, 2, 6, 12, 24, 48];
const OPCOES_AVALIACAO = [null, 1, 2, 4, 24];

const horasTexto = (h: number) => (h === 1 ? '1 hora' : `${h} horas`);

/** Valores de exemplo para a prévia dos textos. */
function exemplo(salao: string): Record<string, string> {
  return {
    nome: 'Ana',
    salao,
    servico: 'Escova',
    profissional: 'Carla',
    data: 'sáb., 15/11',
    hora: '14:00',
    link: 'https://salonflow.app/…',
  };
}

export function FormMensagens({ config, salao }: { config: ConfigMensagens; salao: string }) {
  const [lembrete, setLembrete] = useState(config.lembreteHorasAntes);
  const [avaliacao, setAvaliacao] = useState(config.avaliacaoHorasDepois);
  const [modelos, setModelos] = useState(config.modelos);
  const [retorno, setRetorno] = useState<{ ok: boolean; mensagem: string } | null>(null);
  const [pendente, iniciar] = useTransition();

  const mudarModelo = (m: ModeloMensagem, texto: string) => {
    setRetorno(null);
    setModelos((x) => ({ ...x, [m]: texto }));
  };

  function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    iniciar(async () => {
      const r = await salvarConfigMensagens({
        lembreteHorasAntes: lembrete,
        avaliacaoHorasDepois: avaliacao,
        modelos,
      });
      setRetorno(
        r.ok ? { ok: true, mensagem: 'Mensagens salvas.' } : { ok: false, mensagem: r.erro },
      );
      if (r.ok) setModelos(r.dados.modelos);
    });
  }

  return (
    <form onSubmit={salvar} className="flex flex-col gap-6 text-sm">
      <Secao
        titulo="Notificações no app do cliente (push)"
        descricao="Chegam no celular de quem usa o app e ativou as notificações."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Campo
            rotulo="Lembrete do horário"
            ajuda="Vai para todos os clientes com notificações ativas."
          >
            <select
              value={lembrete ?? ''}
              onChange={(e) => {
                setRetorno(null);
                setLembrete(e.target.value ? Number(e.target.value) : null);
              }}
              className={classeInput}
            >
              {OPCOES_LEMBRETE.map((h) => (
                <option key={h ?? 'nao'} value={h ?? ''}>
                  {h ? `${horasTexto(h)} antes` : 'Não enviar'}
                </option>
              ))}
            </select>
          </Campo>
          <Campo
            rotulo="Pedido de avaliação"
            ajuda="Depois do fechamento da comanda. Pode ser desligado por cliente, na ficha dele."
          >
            <select
              value={avaliacao ?? ''}
              onChange={(e) => {
                setRetorno(null);
                setAvaliacao(e.target.value ? Number(e.target.value) : null);
              }}
              className={classeInput}
            >
              {OPCOES_AVALIACAO.map((h) => (
                <option key={h ?? 'nao'} value={h ?? ''}>
                  {h ? `${horasTexto(h)} depois` : 'Não pedir por push'}
                </option>
              ))}
            </select>
          </Campo>
        </div>
      </Secao>

      <Secao
        titulo="Textos do WhatsApp"
        descricao="Usados nos botões de WhatsApp da agenda, da comanda e da ficha do cliente. O WhatsApp abre com o texto pronto e você só confere e envia."
      >
        {MODELOS_MENSAGEM.map((m) => (
          <div
            key={m}
            className="flex flex-col gap-2 border-t border-borda pt-4 first:border-0 first:pt-0"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium">{ROTULO_MODELO[m].rotulo}</p>
              {modelos[m] !== MODELOS_PADRAO[m] && (
                <button
                  type="button"
                  onClick={() => mudarModelo(m, MODELOS_PADRAO[m])}
                  className="text-xs text-primaria"
                >
                  Voltar ao texto padrão
                </button>
              )}
            </div>
            <textarea
              rows={3}
              maxLength={1000}
              value={modelos[m]}
              onChange={(e) => mudarModelo(m, e.target.value)}
              aria-label={`Texto: ${ROTULO_MODELO[m].rotulo}`}
              className={classeInput}
            />
            <p className="text-xs text-suave">
              Variáveis: {ROTULO_MODELO[m].variaveis.map((v) => `{${v}}`).join(' ')}
            </p>
            <p className="rounded-lg bg-[#dcf8c6] px-3 py-2 text-xs whitespace-pre-line text-neutral-800">
              {montarMensagem(modelos[m], exemplo(salao))}
            </p>
          </div>
        ))}
      </Secao>

      {retorno && <MensagemForm sucesso={retorno.ok} mensagem={retorno.mensagem} />}
      <button type="submit" disabled={pendente} className={`${classeBotaoPrimario} self-start`}>
        {pendente ? 'Salvando…' : 'Salvar mensagens'}
      </button>
    </form>
  );
}
