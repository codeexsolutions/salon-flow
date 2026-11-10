import { describe, expect, it } from 'vitest';
import { linkWhatsApp, montarMensagem, tituloComSalao } from './schemas/mensagens.schema.js';

describe('mensagens do WhatsApp', () => {
  it('monta o texto trocando as variáveis', () => {
    expect(
      montarMensagem('Oi, {nome}! Até {data} no {salao}.', {
        nome: 'Ana',
        data: '12/11',
        salao: 'Studio',
      }),
    ).toBe('Oi, Ana! Até 12/11 no Studio.');
  });

  it('variável sem valor some sem deixar espaço duplo', () => {
    expect(montarMensagem('Agende: {link} Beijos', { link: null })).toBe('Agende: Beijos');
  });

  it('link do WhatsApp com DDI do Brasil e texto codificado', () => {
    expect(linkWhatsApp('(85) 99999-1234', 'Olá & até')).toBe(
      'https://wa.me/5585999991234?text=Ol%C3%A1%20%26%20at%C3%A9',
    );
    expect(linkWhatsApp('+351 912 345 678')).toBe('https://wa.me/351912345678');
    expect(linkWhatsApp('1234')).toBeNull();
    expect(linkWhatsApp(null)).toBeNull();
  });

  it('título da notificação sempre cita o salão', () => {
    expect(tituloComSalao('Semana da hidratação', 'Studio Bela')).toBe(
      'Studio Bela · Semana da hidratação',
    );
    expect(tituloComSalao('Como foi no Studio Bela?', 'Studio Bela')).toBe(
      'Como foi no Studio Bela?',
    );
    expect(tituloComSalao('  ', 'Studio Bela')).toBe('Studio Bela');
  });
});
