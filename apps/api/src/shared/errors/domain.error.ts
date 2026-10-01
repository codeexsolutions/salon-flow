/**
 * Erros de domínio/aplicação. Services e regras de domínio lançam estes erros
 * (sem depender do HTTP); o DomainExceptionFilter traduz para o status adequado.
 */
export abstract class DomainError extends Error {
  abstract readonly statusCode: number;

  constructor(
    readonly codigo: string,
    mensagem: string,
    readonly detalhes?: unknown,
  ) {
    super(mensagem);
    this.name = new.target.name;
  }
}

export class NaoEncontradoError extends DomainError {
  readonly statusCode = 404;
  constructor(recurso: string) {
    super('NAO_ENCONTRADO', `${recurso} não encontrado(a)`);
  }
}

export class RegraDeNegocioError extends DomainError {
  readonly statusCode = 422;
}

export class ConflitoError extends DomainError {
  readonly statusCode = 409;
}

export class AcessoNegadoError extends DomainError {
  readonly statusCode = 403;
  constructor(mensagem = 'Você não tem permissão para esta ação') {
    super('ACESSO_NEGADO', mensagem);
  }
}
