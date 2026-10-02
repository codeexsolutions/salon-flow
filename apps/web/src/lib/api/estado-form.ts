import { ApiError } from './client';

/** Estado devolvido pelas Server Actions de formulário (usado com useActionState). */
export interface EstadoForm {
  erros?: Record<string, string[] | undefined>;
  mensagem?: string;
  sucesso?: boolean;
}

/**
 * Converte um erro da API em estado de formulário.
 * `campoPorCodigo` liga códigos de erro da API a um campo (ex.: EMAIL_EM_USO -> email).
 */
export function estadoDeErro(
  erro: unknown,
  campoPorCodigo: Record<string, string> = {},
): EstadoForm {
  if (!(erro instanceof ApiError)) {
    return { mensagem: 'Algo deu errado. Tente novamente.' };
  }
  const campo = campoPorCodigo[erro.erro.codigo];
  if (campo) return { erros: { [campo]: [erro.message] } };
  if (erro.erro.codigo === 'DADOS_INVALIDOS') {
    return { erros: erro.erro.detalhes as EstadoForm['erros'], mensagem: 'Confira os campos.' };
  }
  return { mensagem: erro.message };
}
