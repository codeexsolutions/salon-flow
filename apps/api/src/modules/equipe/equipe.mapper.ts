import {
  usuarioDeLogin,
  type ConviteAcessoPendente,
  type EquipeSalao,
  type MembroEquipe,
} from '@salonflow/shared';
import type { EquipeService } from './equipe.service.js';

type Equipe = Awaited<ReturnType<EquipeService['listar']>>;

export function paraEquipeSalao({ membros, convites }: Equipe, usuarioLogadoId: string): EquipeSalao {
  return {
    membros: membros.map(
      (m): MembroEquipe => ({
        id: m.id,
        nome: m.usuario.nome,
        usuario: usuarioDeLogin(m.usuario.email),
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
        usuario: usuarioDeLogin(c.email),
        papel: c.papel,
        criadoEm: c.criadoEm.toISOString(),
      }),
    ),
  };
}
