/**
 * Estado da instalação do app (PWA), compartilhado entre componentes do cliente.
 *
 * O Chrome/Android dispara `beforeinstallprompt` logo ao abrir a página — muito antes
 * do cliente terminar um agendamento. Por isso o evento é guardado aqui (pelo
 * `RegistrarPwa`, montado no layout raiz) e usado depois pelo convite.
 */

/** Evento não padronizado do Chromium (ainda sem tipo no lib.dom). */
export interface EventoInstalacao extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type Plataforma = 'ios' | 'android' | 'desktop';

export interface EstadoInstalacao {
  /** Já está rodando como app instalado (tela inicial). */
  instalado: boolean;
  /** Dá para instalar com um toque (Chrome/Edge/Samsung Internet). */
  podeInstalarDireto: boolean;
  plataforma: Plataforma;
}

let eventoGuardado: EventoInstalacao | null = null;
let instaladoAgora = false;
let estadoAtual: EstadoInstalacao | null = null;
const ouvintes = new Set<() => void>();

function notificar() {
  estadoAtual = null;
  ouvintes.forEach((ouvinte) => ouvinte());
}

export function guardarEventoInstalacao(evento: EventoInstalacao | null) {
  eventoGuardado = evento;
  notificar();
}

export function marcarInstalado() {
  instaladoAgora = true;
  eventoGuardado = null;
  notificar();
}

function detectarPlataforma(): Plataforma {
  const ua = navigator.userAgent;
  // iPadOS se apresenta como Mac; o toque denuncia.
  if (/iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) {
    return 'ios';
  }
  return /android/i.test(ua) ? 'android' : 'desktop';
}

function rodandoInstalado(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

// --- Para useSyncExternalStore ---

export function assinarInstalacao(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

/** Snapshot estável (mesmo objeto até algo mudar). */
export function estadoInstalacao(): EstadoInstalacao {
  estadoAtual ??= {
    instalado: instaladoAgora || rodandoInstalado(),
    podeInstalarDireto: eventoGuardado !== null,
    plataforma: detectarPlataforma(),
  };
  return estadoAtual;
}

/** No servidor não se sabe nada: o convite só aparece no navegador. */
export function estadoInstalacaoServidor(): EstadoInstalacao | null {
  return null;
}

/** Abre o diálogo nativo de instalação. Devolve true se o usuário aceitou. */
export async function instalarAgora(): Promise<boolean> {
  const evento = eventoGuardado;
  if (!evento) return false;
  await evento.prompt();
  const { outcome } = await evento.userChoice;
  // O evento só pode ser usado uma vez.
  guardarEventoInstalacao(null);
  if (outcome === 'accepted') marcarInstalado();
  return outcome === 'accepted';
}

// --- "Agora não" ---

const CHAVE_DISPENSADO = 'salonflow:convite-app-dispensado';
const DIAS_SEM_INSISTIR = 30;

export function conviteDispensadoRecentemente(): boolean {
  try {
    const quando = Number(localStorage.getItem(CHAVE_DISPENSADO));
    return !!quando && Date.now() - quando < DIAS_SEM_INSISTIR * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

export function dispensarConvite() {
  try {
    localStorage.setItem(CHAVE_DISPENSADO, String(Date.now()));
  } catch {
    // Sem armazenamento (aba anônima etc.): só esconde nesta visita.
  }
}
