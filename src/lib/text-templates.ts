export type TypographyStyle = "bold_modern" | "script_handwritten" | "elegant_serif" | "clean_minimal";

export interface TextTemplate {
  id: string;
  name: string;
  description: string;
  category: "Promociones & Combos" | "Lanzamientos" | "Ofertas Flash" | "Delivery" | "Lifestyle & Marca" | "Gourmet & Menú";
  badgeText: string;
  badgeBgColor: string;
  badgeTextColor: string;
  headlinePattern: string; // e.g. "{PRODUCTO}" or "COMBO {PRODUCTO}"
  headlineFont: TypographyStyle;
  headlineColor: string;
  subheadlinePattern: string;
  priceBadgePattern?: string; // e.g. "{PRECIO}" or "20% OFF"
  priceBgColor?: string;
  priceTextColor?: string;
  taglineOrBenefits?: string[];
  ctaText: string;
  ctaBgColor: string;
  ctaTextColor: string;
  previewSampleImage?: string;
  isDefault?: boolean;
}

export const TEXT_TEMPLATE_CATEGORIES = [
  "Todas",
  "Promociones & Combos",
  "Lanzamientos",
  "Ofertas Flash",
  "Delivery",
  "Lifestyle & Marca",
  "Gourmet & Menú",
] as const;

export const DEFAULT_TEXT_TEMPLATES: TextTemplate[] = [
  {
    id: "tpl-combo-promo",
    name: "Combo Promocional & Precio",
    description: "Ideal para promociones de plato + acompañamiento + bebida con precio en ribbon amarillo de alto impacto.",
    category: "Promociones & Combos",
    badgeText: "BURGER + PAPAS + BEBIDA",
    badgeBgColor: "#0f172a",
    badgeTextColor: "#ffffff",
    headlinePattern: "COMBO {PRODUCTO}",
    headlineFont: "bold_modern",
    headlineColor: "#ffffff",
    subheadlinePattern: "EL PLAN PERFECTO",
    priceBadgePattern: "{PRECIO}",
    priceBgColor: "#fbbf24",
    priceTextColor: "#0f172a",
    taglineOrBenefits: ["Acompañamiento incluido", "Bebida helada"],
    ctaText: "¡ORDENA AHORA!",
    ctaBgColor: "#fbbf24",
    ctaTextColor: "#0f172a",
    previewSampleImage: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=600&q=80",
    isDefault: true,
  },
  {
    id: "tpl-new-dish",
    name: "Lanzamiento de Nuevo Plato",
    description: "Presenta una nueva incorporación en tu carta con estética editorial, badges de receta auténtica y CTA de prueba.",
    category: "Lanzamientos",
    badgeText: "NUEVO EN NUESTRO MENÚ",
    badgeBgColor: "rgba(15, 23, 42, 0.85)",
    badgeTextColor: "#ffffff",
    headlinePattern: "{PRODUCTO}",
    headlineFont: "elegant_serif",
    headlineColor: "#ffffff",
    subheadlinePattern: "CREMOSO. AUTÉNTICO. DELICIOSO.",
    priceBadgePattern: "{PRECIO}",
    priceBgColor: "#10b981",
    priceTextColor: "#ffffff",
    taglineOrBenefits: ["INGREDIENTES NATURALES", "RECETA AUTÉNTICA", "UN SABOR INOLVIDABLE"],
    ctaText: "¡PRUÉBALO HOY!",
    ctaBgColor: "#fbbf24",
    ctaTextColor: "#0f172a",
    previewSampleImage: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80",
    isDefault: true,
  },
  {
    id: "tpl-hero-irresistible",
    name: "Póster de Alto Impacto (Irresistible)",
    description: "Enfatiza la tentación y sabor con titular mixto y sticker circular amarillo de llamado a la acción.",
    category: "Promociones & Combos",
    badgeText: "⭐ 100% ARTESANAL",
    badgeBgColor: "#f59e0b",
    badgeTextColor: "#0f172a",
    headlinePattern: "{PRODUCTO} Irresistible",
    headlineFont: "script_handwritten",
    headlineColor: "#fbbf24",
    subheadlinePattern: "INGREDIENTES FRESCOS. SABOR PERFECTO.",
    priceBadgePattern: "{PRECIO}",
    priceBgColor: "#fbbf24",
    priceTextColor: "#0f172a",
    ctaText: "¡ORDENA AHORA!",
    ctaBgColor: "#fbbf24",
    ctaTextColor: "#0f172a",
    previewSampleImage: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80",
    isDefault: true,
  },
  {
    id: "tpl-menu-gourmet",
    name: "Ficha Editorial de Carta & Menú",
    description: "Tipografía caligráfica con atributos de cocina tradicional, precio destacado y composición despejada.",
    category: "Gourmet & Menú",
    badgeText: "ESPECIALIDAD DE LA CASA",
    badgeBgColor: "rgba(15, 23, 42, 0.8)",
    badgeTextColor: "#ffffff",
    headlinePattern: "{PRODUCTO}",
    headlineFont: "script_handwritten",
    headlineColor: "#ffffff",
    subheadlinePattern: "Tradición en cada bocado",
    priceBadgePattern: "{PRECIO}",
    priceBgColor: "#0f172a",
    priceTextColor: "#fbbf24",
    taglineOrBenefits: ["ESPECIAS NATURALES", "RECETA TRADICIONAL", "SABOR INOLVIDABLE"],
    ctaText: "PÍDELO AQUÍ",
    ctaBgColor: "#fbbf24",
    ctaTextColor: "#0f172a",
    previewSampleImage: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80",
    isDefault: true,
  },
  {
    id: "tpl-cafe-lifestyle",
    name: "Cafetería & Momentos Lifestyle",
    description: "Enfoque emocional y relajado con subtítulo con corazón, frase de ritmo y badges de especialidad.",
    category: "Lifestyle & Marca",
    badgeText: "CAFÉ DE ESPECIALIDAD",
    badgeBgColor: "#78350f",
    badgeTextColor: "#fef3c7",
    headlinePattern: "BUEN CAFÉ, DÍAS MÁS LINDOS",
    headlineFont: "clean_minimal",
    headlineColor: "#ffffff",
    subheadlinePattern: "Un momento para ti ♡",
    priceBadgePattern: "{PRECIO}",
    priceBgColor: "#fef3c7",
    priceTextColor: "#78350f",
    taglineOrBenefits: ["BUENOS MOMENTOS", "SIEMPRE UNA BUENA IDEA", "PAUSA. DISFRUTA. REPITE."],
    ctaText: "DISFRÚTALO HOY",
    ctaBgColor: "#fef3c7",
    ctaTextColor: "#78350f",
    previewSampleImage: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&q=80",
    isDefault: true,
  },
  {
    id: "tpl-delivery-express",
    name: "Delivery & Para Llevar",
    description: "Convierte cualquier foto de pedido en un anuncio de entrega rápida a domicilio con badges de confianza.",
    category: "Delivery",
    badgeText: "🛵 A DOMICILIO",
    badgeBgColor: "#0284c7",
    badgeTextColor: "#ffffff",
    headlinePattern: "TU COMIDA FAVORITA EN TU CASA",
    headlineFont: "bold_modern",
    headlineColor: "#fbbf24",
    subheadlinePattern: "CALIENTE, FRESCO Y AL INSTANTE",
    taglineOrBenefits: ["RÁPIDO", "SEGURO", "A TIEMPO"],
    ctaText: "¡ORDENA AHORA! ➔",
    ctaBgColor: "#fbbf24",
    ctaTextColor: "#0f172a",
    previewSampleImage: "https://images.unsplash.com/photo-1526367790999-0150786686a2?w=600&q=80",
    isDefault: true,
  },
  {
    id: "tpl-special-offer",
    name: "Oferta Especial & Descuento Flash",
    description: "Genera sentido de urgencia inmediato con insignia roja de oferta, vigencia limitada y botón llamativo.",
    category: "Ofertas Flash",
    badgeText: "🚨 ¡OFERTA ESPECIAL!",
    badgeBgColor: "#dc2626",
    badgeTextColor: "#ffffff",
    headlinePattern: "20% DE DESCUENTO",
    headlineFont: "bold_modern",
    headlineColor: "#fbbf24",
    subheadlinePattern: "EN TODA LA CARTA • POR TIEMPO LIMITADO",
    priceBadgePattern: "{PRECIO}",
    priceBgColor: "#dc2626",
    priceTextColor: "#ffffff",
    ctaText: "¡ORDENA AHORA! ➔",
    ctaBgColor: "#fbbf24",
    ctaTextColor: "#0f172a",
    previewSampleImage: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&q=80",
    isDefault: true,
  },
  {
    id: "tpl-brand-experience",
    name: "Experiencia de Marca & Restaurante",
    description: "Branding gastronómico de prestigio que posiciona el ambiente y los momentos memorables de tu local.",
    category: "Lifestyle & Marca",
    badgeText: "EXPERIENCIA GASTRONÓMICA",
    badgeBgColor: "rgba(15, 23, 42, 0.85)",
    badgeTextColor: "#ffffff",
    headlinePattern: "BUENA COMIDA, MEJORES MOMENTOS",
    headlineFont: "bold_modern",
    headlineColor: "#fbbf24",
    subheadlinePattern: "EXPERIENCIAS QUE HACEN VOLVER",
    taglineOrBenefits: ["BUENA COMIDA GRANDES HISTORIAS", "ATENCIÓN DE PRIMER NIVEL"],
    ctaText: "¡VISÍTANOS HOY! ➔",
    ctaBgColor: "#fbbf24",
    ctaTextColor: "#0f172a",
    previewSampleImage: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80",
    isDefault: true,
  },
];

/**
 * Reemplaza variables como {PRODUCTO} y {PRECIO} con los valores reales del catálogo
 */
export function formatTemplateText(
  pattern: string,
  data: { productName?: string; price?: string; businessName?: string }
): string {
  let result = pattern;
  if (data.productName) {
    result = result.replace(/\{PRODUCTO\}/gi, data.productName);
    result = result.replace(/\{PLATO\}/gi, data.productName);
  }
  if (data.price) {
    result = result.replace(/\{PRECIO\}/gi, data.price);
  }
  if (data.businessName) {
    result = result.replace(/\{NEGOCIO\}/gi, data.businessName);
  }
  return result;
}
