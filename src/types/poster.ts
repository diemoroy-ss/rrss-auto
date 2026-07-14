// src/types/poster.ts
// Tipos estrictos para la configuración del Cartel Publicitario
// Cumple con .cursorrules: TypeScript estricto, sin 'any'

export type VisualStyle =
  | 'Moderno'
  | 'Minimalista'
  | 'Llamativo'
  | 'Elegante'
  | 'Profesional'
  | 'Vibrante';

export type ContactType = 'phone' | 'email' | 'whatsapp';

export interface PosterConfig {
  enabled: boolean;
  // Elementos a incluir en el cartel
  includeLogo: boolean;
  logoUrl?: string;           // Auto-filled desde activeProfile.logoUrl
  includeBusinessName: boolean;
  businessName?: string;      // Auto-filled desde activeProfile.name
  includePrice: boolean;
  priceText?: string;         // Ej: "50% OFF · Desde $9.990"
  includeContact: boolean;
  contactType?: ContactType;
  contactValue?: string;      // Auto-filled desde activeProfile
  includeSlogan: boolean;
  sloganText?: string;
  primaryColor?: string;      // Color hex del negocio
  // Estilo y CTA
  visualStyle: VisualStyle;
  ctaText: string;            // "¡Compra Ahora!", "Reserva Hoy", etc.
  additionalNotes?: string;
}

/**
 * Construye una descripción enriquecida del cartel para el generador de imágenes (n8n).
 * Esta descripción se añade a la idea visual del usuario para enriquecer el prompt.
 */
export function buildPosterPromptSuffix(config: PosterConfig): string {
  if (!config.enabled) return '';

  const parts: string[] = [
    `Estilo visual: ${config.visualStyle}.`,
  ];

  if (config.includeBusinessName && config.businessName) {
    parts.push(`Nombre del negocio visible: "${config.businessName}".`);
  }
  if (config.includeLogo && config.logoUrl) {
    parts.push('Incluir logo del negocio en el diseño.');
  }
  if (config.includePrice && config.priceText) {
    parts.push(`Mostrar precio/promoción: "${config.priceText}".`);
  }
  if (config.includeContact && config.contactValue) {
    const label =
      config.contactType === 'whatsapp' ? 'WhatsApp' :
      config.contactType === 'email' ? 'Email' : 'Teléfono';
    parts.push(`Incluir dato de contacto (${label}): ${config.contactValue}.`);
  }
  if (config.includeSlogan && config.sloganText) {
    parts.push(`Slogan/frase gancho: "${config.sloganText}".`);
  }
  if (config.primaryColor) {
    parts.push(`Color principal del diseño: ${config.primaryColor}.`);
  }
  if (config.ctaText) {
    parts.push(`Llamado a la acción (CTA): "${config.ctaText}".`);
  }
  if (config.additionalNotes) {
    parts.push(`Notas adicionales: ${config.additionalNotes}.`);
  }

  return ' ' + parts.join(' ');
}

/**
 * Valor por defecto para inicializar un PosterConfig vacío.
 */
export const DEFAULT_POSTER_CONFIG: PosterConfig = {
  enabled: false,
  includeLogo: false,
  includeBusinessName: true,
  includePrice: false,
  includeContact: false,
  contactType: 'whatsapp',
  includeSlogan: false,
  visualStyle: 'Moderno',
  ctaText: '¡Contáctanos ahora!',
};
