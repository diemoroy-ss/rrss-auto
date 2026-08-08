import { expect, test, describe } from 'vitest';
import { ContactFormSchema, DemoFormSchema } from './schemas';

describe('Zod Schemas', () => {
  test('ContactFormSchema validates correctly', () => {
    const validData = {
      nombre: 'Juan',
      email: 'juan@example.com',
      rubro: 'Restaurante',
    };
    const result = ContactFormSchema.safeParse(validData);
    expect(result.success).toBe(true);

    const invalidData = {
      nombre: 'J',
      email: 'not-an-email',
      rubro: '',
    };
    const invalidResult = ContactFormSchema.safeParse(invalidData);
    expect(invalidResult.success).toBe(false);
  });

  test('DemoFormSchema validates correctly', () => {
    const validData = {
      nombre: 'Maria',
      email: 'maria@example.com',
      rubro: 'Clinica',
      promo: 'Descuento del 10% en limpiezas dentales',
    };
    const result = DemoFormSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
});
