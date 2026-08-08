import { z } from 'zod';

export const ContactFormSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Correo electrónico inválido'),
  telefono: z.string().optional(),
  rubro: z.string().min(2, 'Por favor ingresa un rubro válido'),
  mensaje: z.string().optional(),
});

export const DemoFormSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Correo electrónico inválido'),
  rubro: z.string().min(2, 'Por favor ingresa un rubro válido'),
  promo: z.string().min(10, 'La promoción debe tener una descripción más larga'),
});

export type ContactFormData = z.infer<typeof ContactFormSchema>;
export type DemoFormData = z.infer<typeof DemoFormSchema>;
