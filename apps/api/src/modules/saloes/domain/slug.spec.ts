import { gerarSlug } from './slug.js';

describe('gerarSlug', () => {
  it('remove acentos, símbolos e espaços', () => {
    expect(gerarSlug('Studio Bela Vista & Cia')).toBe('studio-bela-vista-cia');
    expect(gerarSlug('Salão da Conceição')).toBe('salao-da-conceicao');
  });

  it('remove hífens nas pontas', () => {
    expect(gerarSlug('  --Barbearia do Zé!-- ')).toBe('barbearia-do-ze');
  });

  it('limita a 60 caracteres sem terminar em hífen', () => {
    const slug = gerarSlug(`${'a'.repeat(59)} b`);
    expect(slug.length).toBeLessThanOrEqual(60);
    expect(slug.endsWith('-')).toBe(false);
  });
});
