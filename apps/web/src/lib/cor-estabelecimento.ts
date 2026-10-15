import type { CSSProperties } from 'react';

/**
 * Tema da página de um estabelecimento a partir da cor que o dono escolheu.
 * Calcula as variações para o modo claro e o escuro garantindo contraste
 * (WCAG: 4,5:1 para texto, 3:1 para botões); o CSS em `.tema-salao` aplica.
 */

/** Cor do SalonFlow: quem escolhe "Grafite" (ou nada) fica com o tema padrão. */
const COR_PADRAO = '#1c1c1e';
const BRANCO = '#ffffff';
const QUASE_PRETO = '#1a1a1c';
const SUPERFICIE_ESCURA = '#1c1c1e';

type Rgb = [number, number, number];

const paraRgb = (hex: string): Rgb => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as Rgb;
const paraHex = (rgb: Rgb) =>
  `#${rgb.map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, '0')).join('')}`;

/** Mistura `a` com `b` (t = 0 → a, t = 1 → b). */
export function misturar(a: string, b: string, t: number): string {
  const [x, y] = [paraRgb(a), paraRgb(b)];
  return paraHex(x.map((c, i) => c + (y[i] - c) * t) as Rgb);
}

function luminancia(hex: string): number {
  const [r, g, b] = paraRgb(hex).map((c) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contraste(a: string, b: string): number {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** Aproxima `cor` de `alvo` aos poucos até ter o contraste mínimo com `fundo`. */
function ajustar(cor: string, fundo: string, minimo: number, alvo: string): string {
  let atual = cor;
  for (let t = 0.1; contraste(atual, fundo) < minimo && t <= 1; t += 0.1) {
    atual = misturar(cor, alvo, t);
  }
  return atual;
}

const melhorTexto = (fundo: string, opcoes: string[]) =>
  opcoes.reduce((melhor, c) => (contraste(c, fundo) > contraste(melhor, fundo) ? c : melhor));

export function variaveisDaCor(cor: string): Record<string, string> {
  const botao = cor;
  const escuro = luminancia(cor) < 0.2;
  const botaoEscuro = ajustar(cor, SUPERFICIE_ESCURA, 3, BRANCO);
  return {
    '--cs-botao': botao,
    '--cs-botao-hover': misturar(botao, escuro ? BRANCO : '#000000', 0.12),
    '--cs-contraste': melhorTexto(botao, [BRANCO, QUASE_PRETO]),
    '--cs-texto': ajustar(cor, BRANCO, 4.5, '#000000'),
    '--cs-nude': misturar(cor, BRANCO, 0.88),
    '--cs-botao-escuro': botaoEscuro,
    '--cs-botao-escuro-hover': misturar(botaoEscuro, BRANCO, 0.12),
    '--cs-contraste-escuro': melhorTexto(botaoEscuro, [BRANCO, '#121213']),
    '--cs-texto-escuro': ajustar(cor, SUPERFICIE_ESCURA, 4.5, BRANCO),
    '--cs-nude-escuro': misturar(cor, SUPERFICIE_ESCURA, 0.8),
  };
}

/** Classe e variáveis para envolver a página (ou o cartão) do estabelecimento. */
export function temaDoEstabelecimento(cor: string | null | undefined): {
  className?: string;
  style?: CSSProperties;
} {
  if (!cor || !/^#[0-9a-f]{6}$/i.test(cor) || cor.toLowerCase() === COR_PADRAO) return {};
  return { className: 'tema-salao', style: variaveisDaCor(cor.toLowerCase()) as CSSProperties };
}
