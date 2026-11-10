'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { cadastrarCliente } from '@/app/admin/(painel)/clientes/actions';
import { Campo, classeBotaoPrimario, classeInput, MensagemForm } from '@/components/ui/campo';

const VAZIO = {
  nome: '',
  telefone: '',
  email: '',
  nascimento: '',
  observacoes: '',
  recebeNotificacoes: true,
};

/**
 * Cadastro de cliente pelo painel. Com acesso ao histórico, abre a ficha do
 * cliente criado; só com cadastro, limpa o formulário para o próximo.
 */
export function NovoCliente({ abrirFicha }: { abrirFicha: boolean }) {
  const router = useRouter();
  const [d, setD] = useState(VAZIO);
  const [retorno, setRetorno] = useState<{ ok: boolean; mensagem: string } | null>(null);
  const [pendente, iniciar] = useTransition();

  const mudar = <K extends keyof typeof VAZIO>(campo: K, valor: (typeof VAZIO)[K]) => {
    setRetorno(null);
    setD((x) => ({ ...x, [campo]: valor }));
  };

  function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    iniciar(async () => {
      const r = await cadastrarCliente(d);
      if (!r.ok) {
        setRetorno({ ok: false, mensagem: r.erro });
        return;
      }
      if (abrirFicha) {
        router.push(`/admin/clientes/${r.dados.id}`);
        return;
      }
      setD(VAZIO);
      setRetorno({ ok: true, mensagem: `${r.dados.nome} cadastrado(a).` });
    });
  }

  return (
    <form onSubmit={salvar} className="flex flex-col gap-3 text-sm">
      <Campo rotulo="Nome completo">
        <input
          required
          minLength={2}
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
            placeholder="(85) 99999-9999"
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
      <Campo rotulo="Observações" ajuda="Ex.: alergias, preferências.">
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
        {pendente ? 'Cadastrando…' : 'Cadastrar cliente'}
      </button>
    </form>
  );
}
