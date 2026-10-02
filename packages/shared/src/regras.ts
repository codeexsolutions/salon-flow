/**
 * Regras de negócio com valores fixos por enquanto (no futuro, configuráveis por salão).
 * Compartilhadas para a API aplicar e o front exibir os mesmos números.
 */

/** O cliente só agenda pelo app com pelo menos esta antecedência. */
export const ANTECEDENCIA_MINIMA_APP_MIN = 30;

/** Até quantos dias à frente o cliente pode agendar pelo app. */
export const JANELA_AGENDAMENTO_APP_DIAS = 60;

/** O cliente pode cancelar pelo app até este tempo antes do horário. */
export const PRAZO_CANCELAMENTO_CLIENTE_MIN = 120;

/** Máximo de agendamentos em aberto (futuros) por cliente em um mesmo salão. */
export const MAX_AGENDAMENTOS_ABERTOS_POR_CLIENTE = 3;
