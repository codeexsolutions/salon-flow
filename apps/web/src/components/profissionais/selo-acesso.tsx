import type { AcessoApp } from '@salonflow/shared';

const SELOS: Record<AcessoApp, { texto: string; classe: string; dica: string }> = {
  ATIVO: {
    texto: 'Usa o app',
    classe: 'bg-sucesso-suave text-sucesso',
    dica: 'Já entrou no app com o e-mail cadastrado',
  },
  PENDENTE: {
    texto: 'Convite pendente',
    classe: 'bg-alerta-suave text-alerta',
    dica: 'Ganha acesso quando entrar no app com o e-mail cadastrado',
  },
  SEM_ACESSO: {
    texto: 'Sem acesso',
    classe: 'bg-nude text-suave',
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
