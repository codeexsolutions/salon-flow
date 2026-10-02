import type { AcessoApp } from '@salonflow/shared';

const SELOS: Record<AcessoApp, { texto: string; classe: string; dica: string }> = {
  ATIVO: {
    texto: 'Usa o app',
    classe: 'bg-green-100 text-green-800',
    dica: 'Já entrou no app com o e-mail cadastrado',
  },
  PENDENTE: {
    texto: 'Convite pendente',
    classe: 'bg-amber-100 text-amber-800',
    dica: 'Ganha acesso quando entrar no app com o e-mail cadastrado',
  },
  SEM_ACESSO: {
    texto: 'Sem acesso',
    classe: 'bg-neutral-100 text-neutral-600',
    dica: 'Cadastre um e-mail para liberar o app',
  },
};

export function SeloAcesso({ acesso }: { acesso: AcessoApp }) {
  const selo = SELOS[acesso];
  return (
    <span
      title={selo.dica}
      className={`rounded-full px-2 py-0.5 text-xs font-medium ${selo.classe}`}
    >
      {selo.texto}
    </span>
  );
}
