export interface ExtractedProductItem {
  name: string;
  description?: string;
  estimatedPrice?: string;
  isPromotion?: boolean;
}

export interface FeedAuditDiagnosis {
  overallScore: number; // 0 a 100
  brandAestheticSummary: string;
  detectedStrengths: string[]; // 3 aciertos actuales
  detectedFlaws: string[];     // 3 fugas de venta o fallas visuales detectadas
  suggestedPillars: string[];  // 3 a 4 pilares recomendados para el negocio
  extractedProducts: ExtractedProductItem[];
}

export interface PlanDayArtDirection {
  layout: "split_left" | "split_right" | "top_banner" | "bottom_third" | "recipe_ingredients" | "clean_photo";
  layoutLabel: string;
  fontStyle: "bold_modern" | "elegant_serif" | "serif_script_mix" | "clean_minimal" | "script_handwritten";
  fontLabel: string;
  reasoning: string;
}

export interface PlanDayPost {
  format: "Post" | "Reel" | "Carrusel";
  headline: string;
  productName: string;
  price: string;
  isPromo: boolean;
  hasText: boolean;
  artDirection: PlanDayArtDirection;
  hook: string;
  copy: string;
  cta: string;
  imageUrl?: string;
  compositionDirective: string;
  isRendered: boolean;
}

export interface PlanDayStory {
  time: string;
  objective: string;
  hook: string;
  interactiveType: "Encuesta" | "Deslizador" | "Caja de Preguntas" | "Cuenta Regresiva" | "Link WhatsApp" | "Votación 2x1";
  interactiveLabel: string;
  slideTexts: string[];
  visualRecommendation: string;
}

export interface Plan14DayItem {
  day: number;
  weekday: string;
  nicheTrend: string;
  nicheInsight: string;
  post: PlanDayPost;
  story: PlanDayStory;
}

export interface FullDemoPlanData {
  id?: string;
  prospectName: string;
  prospectBusiness: string;
  prospectPhone?: string;
  rubro: string;
  feedScreenshotUrl?: string;
  feedAudit?: FeedAuditDiagnosis;
  plan14Days: Plan14DayItem[];
  anchorRenderedDays: number[]; // Días generados de inmediato (ej: [1, 3, 5, 7])
  sellerName?: string;
  sellerPhone?: string;
  sellerEmail?: string;
  createdAt: string;
  status?: "borrador" | "generada" | "enviada";
}
