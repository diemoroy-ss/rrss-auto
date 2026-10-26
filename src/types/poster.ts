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

export type MixboardPresetId =
  | 'dark_saas'
  | 'retail_promo'
  | 'editorial_clean'
  | 'gastro_warm'
  | 'corporate_pro';

export interface MixboardPreset {
  id: MixboardPresetId;
  label: string;
  emoji: string;
  description: string;
  backgroundPalette: string;
  paletteColors: string[];
  visualStyle: VisualStyle;
}

export const MIXBOARD_PRESETS: MixboardPreset[] = [
  {
    id: 'dark_saas',
    label: 'Dark Tech & SaaS',
    emoji: '⚡',
    description: 'Fondo oscuro tecnológico, glassmorphism 3D, líneas de neón y badges luminosos',
    backgroundPalette: 'Dark navy tech background (#0B1120) with subtle grid and cyan/indigo glows',
    paletteColors: ['#0B1120', '#4F46E5', '#06B6D4', '#FF5500', '#FFFFFF'],
    visualStyle: 'Moderno'
  },
  {
    id: 'retail_promo',
    label: 'Alto Impacto Retail',
    emoji: '🛍️',
    description: 'Comercial vibrante, badges contrastados de precio y oferta, sombras suaves y energía de compra',
    backgroundPalette: 'Clean vibrant gradient with soft ambient studio lighting and high-contrast badges',
    paletteColors: ['#FAFAFA', '#EF4444', '#F59E0B', '#10B981', '#0F172A'],
    visualStyle: 'Llamativo'
  },
  {
    id: 'editorial_clean',
    label: 'Minimalismo Editorial',
    emoji: '✨',
    description: 'Estética limpia, espacios negativos amplios, tipografía refinada y luz de estudio suave',
    backgroundPalette: 'Sophisticated warm off-white studio background with soft natural architectural shadows',
    paletteColors: ['#F8F9FA', '#18181B', '#71717A', '#D97706', '#E4E4E7'],
    visualStyle: 'Minimalista'
  },
  {
    id: 'gastro_warm',
    label: 'Gastronomía & Texturas',
    emoji: '🍔',
    description: 'Iluminación cálida y dramática, texturas ricas (madera, pizarra), enfoque apetitoso y badges rústicos',
    backgroundPalette: 'Dark slate or rustic wooden table backdrop with dramatic warm directional spotlighting',
    paletteColors: ['#1C1917', '#EA580C', '#EAB308', '#78350F', '#FEF3C7'],
    visualStyle: 'Vibrante'
  },
  {
    id: 'corporate_pro',
    label: 'Corporativo Moderno',
    emoji: '💼',
    description: 'Líneas ejecutivas limpias, azul profesional, sensación de confianza y datos estructurados',
    backgroundPalette: 'Crisp corporate gradient from cool gray to deep corporate navy blue with clean angled accents',
    paletteColors: ['#0F172A', '#1E40AF', '#38BDF8', '#F1F5F9', '#FFFFFF'],
    visualStyle: 'Profesional'
  }
];

export type ContactType = 'phone' | 'email' | 'whatsapp';

export type PosterLayout = 'auto' | 'top_banner' | 'split_left' | 'split_right' | 'recipe_ingredients';

export interface TextElementTransform {
  x: number; // Coordenada horizontal en porcentaje del ancho del lienzo (0-100%)
  y: number; // Coordenada vertical en porcentaje de la altura del lienzo (0-100%)
  fontSize?: number; // Tamaño de fuente en píxeles (ej: 14)
  rotation?: number; // Ángulo de rotación en grados (-180 a 180)
}

export interface PosterElementTransforms {
  brand?: TextElementTransform;
  title?: TextElementTransform;
  slogan?: TextElementTransform;
  price?: TextElementTransform;
  cta?: TextElementTransform;
  contact?: TextElementTransform;
}

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
  businessName?: string;
  layout?: PosterLayout;
  visualStyle?: VisualStyle;
  allowImageRetouch?: boolean;
  useSlide1Image?: boolean;
  // Visibilidad independiente de textos por slide (Carrusel)
  includeMainText?: boolean;
  includePrice?: boolean;
  includeSlogan?: boolean;
  includeCta?: boolean;
  includeBusinessName?: boolean;
  includeLogo?: boolean;
  // Campos exclusivos del Laboratorio Mixboard:
  styleReferenceUrl?: string;
  styleReferenceTraits?: ('palette' | 'lighting' | 'typography' | 'layout')[];
  lockStyleFromSlide1?: boolean;
  lastRetouchInstruction?: string;
  // Transformaciones interactivas (Drag & Drop, tamaño y rotación)
  elementTransforms?: PosterElementTransforms;
}

export interface PosterConfig {
  enabled: boolean;
  isLabMode?: boolean;
  mixboardPreset?: MixboardPresetId;
  layout?: PosterLayout;
  layoutReasoning?: string;
  kickerText?: string;
  orientation?: 'square' | 'vertical';
  aspectRatio?: '1:1' | '9:16';
  // Carrusel slides 1 a 5
  slides?: PosterSlideConfig[];
  activeSlideIndex?: number;
  // Referencia de estilo para modo Laboratorio
  styleReferenceUrl?: string;
  styleReferenceTraits?: ('palette' | 'lighting' | 'typography' | 'layout')[];
  lockStyleFromSlide1?: boolean;
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
  includeCta?: boolean;
  allowImageRetouch?: boolean;
  baseImageUrl?: string;
  imageUrl?: string;
  additionalNotes?: string;
  // Transformaciones interactivas (Drag & Drop, tamaño y rotación)
  elementTransforms?: PosterElementTransforms;
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

  if (config.primaryColor) {
    parts.push(`Color principal del diseño: ${config.primaryColor}.`);
  }
  if (config.includeContact && config.contactValue) {
    const label =
      config.contactType === 'whatsapp' ? 'WhatsApp' :
      config.contactType === 'email' ? 'Email' : 'Teléfono';
    parts.push(`Include contact info: "${label}: ${config.contactValue}".`);
  }
  if (config.additionalNotes) {
    parts.push(`Notas adicionales: ${config.additionalNotes}.`);
  }
  if (config.isLabMode) {
    parts.push('MIXBOARD LAB COMPOSITION: Multi-element commercial advertising design with precise graphic layout, integrated Spanish typography, high contrast, studio quality rendering, and seamless visual branding.');
    if (config.mixboardPreset) {
      const preset = MIXBOARD_PRESETS.find(p => p.id === config.mixboardPreset);
      if (preset) {
        parts.push(`Art Direction Mood: ${preset.label} (${preset.backgroundPalette}). Recommended accent colors: ${preset.paletteColors.join(', ')}.`);
      }
    }
  }

  // ═══════════════════════════════════════════════════════════════
  // ESTRUCTURA UNIVERSAL DE ZONA SEGURA (POST INDIVIDUAL Y CARRUSEL)
  // ═══════════════════════════════════════════════════════════════
  const typographyParts: string[] = [
    '\n\nTYPOGRAPHY & LAYOUT (Exact Spanish text):',
    '- CENTRAL COMPOSITION: All typography, headlines and badges must be compact and centered horizontally, with wide empty negative space around all canvas borders.',
    '- MANDATORY NEGATIVE INSTRUCTION: ABSOLUTELY DO NOT RENDER ANY MEASUREMENT ARROWS, LABELS, NUMBERS, PERCENTAGES, RED OR ORANGE GUIDELINES, DRAFTING MARKS, WIREFRAME BOXES, TECHNICAL RULERS, OR BOUNDING BOXES ON THE IMAGE. RENDER ONLY THE PRISTINE COMMERCIAL GRAPHIC ARTWORK AND TEXT.'
  ];

  const badgeText = config.includeSlogan && config.sloganText ? config.sloganText : '';
  if (badgeText) {
    typographyParts.push(`- TOP CENTER (Small glowing pill badge): "${badgeText}".`);
  }

  const headline = (config.includeMainText && config.mainText) ? config.mainText : (config.mainText || (config.includePrice && config.priceText ? config.priceText : ''));
  if (headline) {
    typographyParts.push(`- UPPER CENTER (Large bold headline, high contrast, clean typography): "${headline}".`);
  }

  if (config.includePrice && config.priceText && config.priceText !== headline) {
    typographyParts.push(`- HIGHLIGHT BADGE (Clean floating badge): "${config.priceText}".`);
  }

  const shouldIncludeCta = config.includeCta !== false && config.ctaText;
  if (shouldIncludeCta) {
    typographyParts.push(`- LOWER CENTER (Clean button placed horizontally in lower center): "${config.ctaText}".`);
  }

  typographyParts.push('Ultra-sharp vector typography, commercial graphic design, compact centered clean composition, professional studio advertising layout, 8k.');

  parts.push(typographyParts.join('\n'));

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
  isLabMode: false,
  mixboardPreset: 'dark_saas',
  layout: 'auto',
  orientation: 'square',
  aspectRatio: '1:1',
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
