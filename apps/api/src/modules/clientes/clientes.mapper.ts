import type { ClienteResumo } from '@salonflow/shared';
import type { Cliente } from '../../generated/prisma/client.js';

export function paraClienteResumo(c: Cliente): ClienteResumo {
  return {
    id: c.id,
    nome: c.nome,
    telefone: c.telefone,
    email: c.email,
    usaApp: c.usuarioId !== null,
  };
}
