import type {
  AnotacaoCliente,
  ClienteNaLista,
  ClienteResumo,
  IndicadoresCliente,
} from '@salonflow/shared';
import type { Cliente } from '../../generated/prisma/client.js';

/** Coluna DATE -> AAAA-MM-DD. */
export const dataDoBanco = (d: Date) => d.toISOString().slice(0, 10);

export function paraClienteResumo(c: Cliente): ClienteResumo {
  return {
    id: c.id,
    nome: c.nome,
    telefone: c.telefone,
    email: c.email,
    usaApp: c.usuarioId !== null,
  };
}

export function paraClienteNaLista(c: Cliente, indicadores: IndicadoresCliente): ClienteNaLista {
  return {
    ...paraClienteResumo(c),
    ...indicadores,
    nascimento: c.nascimento ? dataDoBanco(c.nascimento) : null,
    recebeNotificacoes: c.recebeNotificacoes,
    criadoEm: c.criadoEm.toISOString(),
  };
}

interface AnotacaoDoBanco {
  id: string;
  data: Date;
  texto: string;
  autorId: string | null;
  criadoEm: Date;
  servico: { id: string; nome: string } | null;
  profissional: { id: string; nome: string } | null;
}

/** `podeEditar`: quem escreveu, ou o dono do salão. */
export function paraAnotacao(a: AnotacaoDoBanco, podeEditar: boolean): AnotacaoCliente {
  return {
    id: a.id,
    data: dataDoBanco(a.data),
    texto: a.texto,
    servico: a.servico,
    profissional: a.profissional,
    autorId: a.autorId,
    podeEditar,
    criadoEm: a.criadoEm.toISOString(),
  };
}
