import type { StatusContrato } from '@salonflow/shared';

const ESTILO: Record<StatusContrato | 'SEM', { rotulo: string; classe: string }> = {
  SEM: { rotulo: 'Sem contrato', classe: 'bg-perigo-suave text-perigo' },
  RASCUNHO: { rotulo: 'Rascunho', classe: 'bg-alerta-suave text-alerta' },
  ATIVO: { rotulo: 'Ativo', classe: 'bg-sucesso-suave text-sucesso' },
  ENCERRADO: { rotulo: 'Encerrado', classe: 'bg-nude text-suave' },
};

export function StatusContratoBadge({ status }: { status: StatusContrato | null }) {
  const e = ESTILO[status ?? 'SEM'];
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${e.classe}`}>{e.rotulo}</span>
  );
}
