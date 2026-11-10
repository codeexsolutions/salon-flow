'use client';

import { useState, useTransition } from 'react';
import type { PerfilCliente } from '@salonflow/shared';
import { salvarMeusDados } from '@/app/(cliente)/conta/dados/actions';
import { Campo, classeBotaoPrimario, classeInput, MensagemForm } from '@/components/ui/campo';

/** Cadastro opcional do cliente: vale para todos os salões em que ele agenda. */
export function FormPerfilCliente({ perfil }: { perfil: PerfilCliente }) {
  const [d, setD] = useState({
    nome: perfil.nome ?? '',
    telefone: perfil.telefone ?? '',
    email: perfil.email ?? '',
    nascimento: perfil.nascimento ?? '',
  });
  const [retorno, setRetorno] = useState<{ ok: boolean; mensagem: string } | null>(null);
  const [pendente, iniciar] = useTransition();

  const mudar = (campo: keyof typeof d, valor: string) => {
    setRetorno(null);
    setD((x) => ({ ...x, [campo]: valor }));
  };

  function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    iniciar(async () => {
      const r = await salvarMeusDados(d);
      setRetorno(
        r.ok
          ? {
              ok: true,
              mensagem:
                r.dados.saloes > 0
                  ? `Dados salvos e enviados para ${r.dados.saloes} salão(ões).`
                  : 'Dados salvos. Eles vão para o salão no seu próximo agendamento.',
            }
          : { ok: false, mensagem: r.erro },
      );
    });
  }

  return (
    <form onSubmit={salvar} className="flex flex-col gap-3 text-sm">
      <Campo rotulo="Nome completo">
        <input
          value={d.nome}
          autoComplete="name"
          onChange={(e) => mudar('nome', e.target.value)}
          className={classeInput}
        />
      </Campo>
      <div className="grid gap-3 sm:grid-cols-2">
        <Campo rotulo="Celular / WhatsApp">
          <input
            value={d.telefone}
            inputMode="tel"
            autoComplete="tel"
            placeholder="(85) 99999-9999"
            onChange={(e) => mudar('telefone', e.target.value)}
            className={classeInput}
          />
        </Campo>
        <Campo rotulo="Data de nascimento">
          <input
            type="date"
            value={d.nascimento}
            autoComplete="bday"
            onChange={(e) => mudar('nascimento', e.target.value)}
            className={classeInput}
          />
        </Campo>
      </div>
      <Campo rotulo="E-mail" ajuda="Para receber lembretes e novidades dos salões.">
        <input
          type="email"
          value={d.email}
          autoComplete="email"
          onChange={(e) => mudar('email', e.target.value)}
          className={classeInput}
        />
      </Campo>
      {retorno && <MensagemForm sucesso={retorno.ok} mensagem={retorno.mensagem} />}
      <button type="submit" disabled={pendente} className={`${classeBotaoPrimario} self-start`}>
        {pendente ? 'Salvando…' : 'Salvar meus dados'}
      </button>
    </form>
  );
}
