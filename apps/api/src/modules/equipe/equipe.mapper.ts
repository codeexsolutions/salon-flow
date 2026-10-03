import type { ConviteAcessoPendente, EquipeSalao, MembroEquipe } from '@salonflow/shared';
import type { EquipeService } from './equipe.service.js';

type Equipe = Awaited<ReturnType<EquipeService['listar']>>;

export function paraEquipeSalao({ membros, convites }: Equipe, usuarioLogadoId: string): EquipeSalao {
  return {
    membros: membros.map(
      (m): MembroEquipe => ({
        id: m.id,
        nome: m.usuario.nome,
        email: m.usuario.email,
        papel: m.papel,
        ativo: m.ativo,
        ehProfissional: m.usuario.profissionais.length > 0,
        ehVoce: m.usuario.id === usuarioLogadoId,
        criadoEm: m.criadoEm.toISOString(),
      }),
    ),
    convites: convites.map(
      (c): ConviteAcessoPendente => ({
        id: c.id,
        nome: c.nome,
        email: c.email,
        papel: c.papel,
        criadoEm: c.criadoEm.toISOString(),
      }),
    ),
  };
}
