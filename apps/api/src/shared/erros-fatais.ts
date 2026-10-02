import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { Logger } from '@nestjs/common';

const ARQUIVO = join(process.cwd(), 'logs', 'erros.log');
const logger = new Logger('ErroFatal');

function registrar(tipo: string, erro: unknown) {
  const detalhe = erro instanceof Error ? (erro.stack ?? erro.message) : String(erro);
  logger.error(`${tipo}: ${detalhe}`);
  try {
    mkdirSync(join(process.cwd(), 'logs'), { recursive: true });
    appendFileSync(ARQUIVO, `[${new Date().toISOString()}] ${tipo}\n${detalhe}\n\n`);
  } catch {
    // Sem disco gravável (ex.: alguns ambientes de deploy): fica só o log do console.
  }
}

/**
 * Registra erros que derrubariam o processo sem deixar rastro (promessa rejeitada sem
 * tratamento, exceção fora de requisição). Exceção não tratada continua encerrando o
 * processo — o estado pode estar inconsistente — mas agora com o motivo registrado.
 */
export function registrarErrosFatais() {
  process.on('unhandledRejection', (motivo) => registrar('unhandledRejection', motivo));
  process.on('uncaughtException', (erro) => {
    registrar('uncaughtException', erro);
    process.exit(1);
  });
}
