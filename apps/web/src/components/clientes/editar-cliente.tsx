'use client';

import { useState, useTransition } from 'react';
import type { ClienteDetalhe } from '@salonflow/shared';
import { atualizarCliente } from '@/app/admin/(painel)/clientes/actions';
import { Campo, classeBotaoPrimario, classeInput, MensagemForm } from '@/components/ui/campo';

/** Dados de contato, aniversário e a chave de notificações/feedback do cliente. */
export function EditarCliente({ cliente }: { cliente: ClienteDetalhe }) {
  const [d, setD] = useState({
    nome: cliente.nome,
    telefone: cliente.telefone ?? '',
    email: cliente.email ?? '',
    nascimento: cliente.nascimento ?? '',
    observacoes: cliente.observacoes ?? '',
    recebeNotificacoes: cliente.recebeNotificacoes,
  });
  const [retorno, setRetorno] = useState<{ ok: boolean; mensagem: string } | null>(null);
  const [pendente, iniciar] = useTransition();

  const mudar = <K extends keyof typeof d>(campo: K, valor: (typeof d)[K]) => {
    setRetorno(null);
    setD((x) => ({ ...x, [campo]: valor }));
  };

  function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    iniciar(async () => {
      const r = await atualizarCliente(cliente.id, d);
      setRetorno(r.ok ? { ok: true, mensagem: 'Dados salvos.' } : { ok: false, mensagem: r.erro });
    });
  }

  return (
    <form onSubmit={salvar} className="flex flex-col gap-3 text-sm">
      <Campo rotulo="Nome">
        <input
          required
          value={d.nome}
          onChange={(e) => mudar('nome', e.target.value)}
          className={classeInput}
        />
      </Campo>
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo rotulo="Telefone / WhatsApp">
          <input
            value={d.telefone}
            inputMode="tel"
            onChange={(e) => mudar('telefone', e.target.value)}
            className={classeInput}
          />
        </Campo>
        <Campo rotulo="Data de nascimento">
          <input
            type="date"
            value={d.nascimento}
            onChange={(e) => mudar('nascimento', e.target.value)}
            className={classeInput}
          />
        </Campo>
      </div>
      <Campo rotulo="E-mail">
        <input
          type="email"
          value={d.email}
          onChange={(e) => mudar('email', e.target.value)}
          className={classeInput}
        />
      </Campo>
      <Campo rotulo="Observações" ajuda="Ex.: alergias, preferências, como gosta de ser atendida.">
        <textarea
          rows={2}
          maxLength={500}
          value={d.observacoes}
          onChange={(e) => mudar('observacoes', e.target.value)}
          className={classeInput}
        />
      </Campo>
      <label className="flex items-start gap-2 rounded-xl border border-borda p-3">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={d.recebeNotificacoes}
          onChange={(e) => mudar('recebeNotificacoes', e.target.checked)}
        />
        <span>
          <span className="font-medium">Pedido de avaliação por push</span>
          <span className="block text-xs text-suave">
            Depois do atendimento, o app pede uma nota de 1 a 5. Desmarque se o cliente não quiser
            receber.
          </span>
        </span>
      </label>
      {retorno && <MensagemForm sucesso={retorno.ok} mensagem={retorno.mensagem} />}
      <button type="submit" disabled={pendente} className={`${classeBotaoPrimario} self-start`}>
        {pendente ? 'Salvando…' : 'Salvar dados'}
      </button>
    </form>
  );
}
