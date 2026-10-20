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

export type PosterLayout = 'auto' | 'top_banner' | 'split_left' | 'split_right' | 'recipe_ingredients';

export interface PosterSlideConfig {
  slideNumber: number;
  role?: string;
  imageExpectation?: string;
  imageUrl?: string;
  baseImageUrl?: string;
  mainText?: string;
  priceText?: string;
  sloganText?: string;
  ctaText?: string;
  layout?: PosterLayout;
  visualStyle?: VisualStyle;
  allowImageRetouch?: boolean;
  useSlide1Image?: boolean;
}

export interface PosterConfig {
  enabled: boolean;
  layout?: PosterLayout;
  layoutReasoning?: string;
  kickerText?: string;
  orientation?: 'square' | 'vertical';
  aspectRatio?: '1:1' | '9:16';
  // Carrusel slides 1 a 5
  slides?: PosterSlideConfig[];
  activeSlideIndex?: number;
  // Elementos a incluir en el cartel
  includeLogo: boolean;
  logoUrl?: string;           // Auto-filled desde activeProfile.logoUrl
  includeBusinessName: boolean;
  businessName?: string;      // Auto-filled desde activeProfile.name
  includeMainText: boolean;
  mainText?: string;          // Ej: "Gran Apertura", "Oferta de Locura"
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
  allowImageRetouch?: boolean;
  baseImageUrl?: string;
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

  // Directiva de composición según decisión de Dirección de Arte
  if (config.layout === 'split_left') {
    parts.push(
      'SPATIAL COMPOSITION: Asymmetrical split commercial layout. The hero product MUST be framed strictly within the right 50% of the image. The left 50% must be clean, dark, out-of-focus copyspace with expansive negative space for typography overlay. Product must never be centered.'
    );
  } else if (config.layout === 'split_right') {
    parts.push(
      'SPATIAL COMPOSITION: Asymmetrical split commercial layout. The hero product is framed strictly within the left 50% of the image. The right 50% has wide open clean negative space for graphic design.'
    );
  } else if (config.layout === 'recipe_ingredients') {
    parts.push(
      'SPATIAL COMPOSITION: Clean overhead flat-lay restaurant presentation with the dish centered in the middle third, leaving wide empty negative space at top and bottom margins for recipe cards.'
    );
  } else if (config.layout === 'top_banner') {
    parts.push(
      'SPATIAL COMPOSITION: Hero product framed in the lower-middle half of the image, leaving expansive clean copyspace at the top header for typography.'
    );
  }

  if (config.includeBusinessName && config.businessName) {
    parts.push(`Nombre del negocio visible: "${config.businessName}".`);
  }
  if (config.includeLogo && config.logoUrl) {
    parts.push('Incluir logo del negocio en el diseño.');
  }
  if (config.includeMainText && config.mainText) {
    parts.push(`Include the exact text "${config.mainText}" prominently as the main heading or message. Do not hallucinate extra words.`);
  }
  if (config.includePrice && config.priceText) {
    parts.push(`Include the exact text "${config.priceText}" prominently. Do not hallucinate extra words.`);
  }
  if (config.includeContact && config.contactValue) {
    const label =
      config.contactType === 'whatsapp' ? 'WhatsApp' :
      config.contactType === 'email' ? 'Email' : 'Teléfono';
    parts.push(`Include the exact text "${label}: ${config.contactValue}".`);
  }
  if (config.includeSlogan && config.sloganText) {
    parts.push(`Include the exact phrase "${config.sloganText}".`);
  }
  if (config.primaryColor) {
    parts.push(`Color principal del diseño: ${config.primaryColor}.`);
  }
  if (config.ctaText) {
    parts.push(`Include the exact Call-to-Action text: "${config.ctaText}".`);
  }
  if (config.additionalNotes) {
    parts.push(`Notas adicionales: ${config.additionalNotes}.`);
  }

  return ' ' + parts.join(' ');
}

export const DEFAULT_POSTER_SLIDES: PosterSlideConfig[] = [
  { slideNumber: 1, role: "Portada / Gancho", mainText: "", priceText: "", sloganText: "", ctaText: "" },
  { slideNumber: 2, role: "Problema / Contexto", mainText: "", priceText: "", sloganText: "", ctaText: "" },
  { slideNumber: 3, role: "Solución / Beneficio", mainText: "", priceText: "", sloganText: "", ctaText: "" },
  { slideNumber: 4, role: "Detalles / Características", mainText: "", priceText: "", sloganText: "", ctaText: "" },
  { slideNumber: 5, role: "Oferta + Llamado a la Acción", mainText: "", priceText: "", sloganText: "", ctaText: "¡Contáctanos ahora!" },
];

/**
 * Valor por defecto para inicializar un PosterConfig vacío.
 */
export const DEFAULT_POSTER_CONFIG: PosterConfig = {
  enabled: false,
  layout: 'auto',
  slides: DEFAULT_POSTER_SLIDES,
  activeSlideIndex: 0,
  includeLogo: false,
  includeBusinessName: true,
  includeMainText: false,
  includePrice: false,
  includeContact: false,
  contactType: 'whatsapp',
  includeSlogan: false,
  visualStyle: 'Moderno',
  ctaText: '¡Contáctanos ahora!',
};
