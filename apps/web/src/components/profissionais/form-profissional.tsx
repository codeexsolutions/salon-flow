'use client';

import { useActionState } from 'react';
import type { ProfissionalResumo } from '@salonflow/shared';
import {
  atualizarProfissional,
  criarProfissional,
} from '@/app/admin/(painel)/profissionais/actions';
import type { EstadoForm } from '@/lib/api/estado-form';
import { Campo, classeBotaoPrimario, classeInput, MensagemForm } from '@/components/ui/campo';

/** Cadastro (sem `profissional`) ou edição (com `profissional`). */
export function FormProfissional({ profissional }: { profissional?: ProfissionalResumo }) {
  const acaoServidor = profissional
    ? atualizarProfissional.bind(null, profissional.id)
    : criarProfissional;
  const [estado, acao, enviando] = useActionState<EstadoForm, FormData>(acaoServidor, {});
  const emailTravado = profissional?.acessoApp === 'ATIVO';

  return (
    <form action={acao} className="flex flex-col gap-4">
      <Campo rotulo="Nome" erro={estado.erros?.nome}>
        <input name="nome" required defaultValue={profissional?.nome} className={classeInput} />
      </Campo>

      <Campo
        rotulo="E-mail"
        erro={estado.erros?.email}
        ajuda={
          emailTravado
            ? 'Já usa o app com este e-mail.'
            : 'Opcional. Com ele, o profissional entra no app e vê a própria agenda e comissões.'
        }
      >
        <input
          name="email"
          type="email"
          readOnly={emailTravado}
          defaultValue={profissional?.email ?? ''}
          className={`${classeInput} ${emailTravado ? 'opacity-60' : ''}`}
        />
      </Campo>

      <div className="grid grid-cols-[1fr_auto] gap-3">
        <Campo rotulo="Telefone" erro={estado.erros?.telefone}>
          <input
            name="telefone"
            type="tel"
            defaultValue={profissional?.telefone ?? ''}
            className={classeInput}
          />
        </Campo>
        <Campo rotulo="Cor na agenda" erro={estado.erros?.corAgenda}>
          <input
            name="corAgenda"
            type="color"
            defaultValue={profissional?.corAgenda ?? '#7c3aed'}
            className="h-10 w-16 rounded-lg border border-borda bg-transparent"
          />
        </Campo>
      </div>

      <MensagemForm sucesso={estado.sucesso} mensagem={estado.mensagem} />

      <button type="submit" disabled={enviando} className={`${classeBotaoPrimario} self-start`}>
        {enviando ? 'Salvando…' : profissional ? 'Salvar dados' : 'Cadastrar profissional'}
      </button>
    </form>
  );
}
