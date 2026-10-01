/** Formato padrão de erro devolvido pela API. */
export interface ApiErro {
  statusCode: number;
  codigo: string;
  mensagem: string;
  detalhes?: unknown;
}

/** Resposta paginada padrão. */
export interface Paginado<T> {
  itens: T[];
  total: number;
  pagina: number;
  porPagina: number;
}

/** Header que o front envia para indicar em qual salão o usuário está operando. */
export const HEADER_SALAO_ID = 'x-salao-id';
