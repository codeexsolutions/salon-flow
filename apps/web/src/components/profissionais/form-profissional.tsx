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
  const usuarioTravado = profissional?.acessoApp === 'ATIVO';

  return (
    <form action={acao} className="flex flex-col gap-4">
      <Campo rotulo="Nome" erro={estado.erros?.nome}>
        <input name="nome" required defaultValue={profissional?.nome} className={classeInput} />
      </Campo>

      <Campo
        rotulo="Usuário de acesso ao app"
        erro={estado.erros?.usuario}
        ajuda={
          usuarioTravado
            ? 'Já entra no app com este usuário.'
            : 'Opcional. Letras, números, ponto ou _ (ex.: joao.barbeiro). Com ele, o profissional vê a própria agenda e comissões.'
        }
      >
        <input
          name="usuario"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          readOnly={usuarioTravado}
          defaultValue={profissional?.usuario ?? ''}
          className={`${classeInput} ${usuarioTravado ? 'opacity-60' : ''}`}
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
