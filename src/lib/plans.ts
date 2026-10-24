export type PlanId = 'esencial' | 'crecimiento' | 'piloto_automatico' | 'free';

export interface PlanFeatures {
  blogSeo: boolean;
  competitorSpy: boolean;
  adsGenerator: boolean;
  vipSupport: boolean;
}

export type SupportedPlatform = 'instagram' | 'facebook' | 'linkedin' | 'tiktok';

export interface PlanConfig {
  id: PlanId;
  name: string;
  badge: string;
  priceClp: number;
  priceFormatted: string;
  priceNormalFormatted?: string;
  maxPostsPerMonth: number;
  maxReelsScripts: number;
  maxAiImagesPerMonth: number;
  allowedPlatforms: SupportedPlatform[];
  features: PlanFeatures;
  description: string;
}

export const PLAN_CONFIGS: Record<PlanId, PlanConfig> = {
  free: {
    id: 'free',
    name: 'Prueba Gratuita',
    badge: 'Demo',
    priceClp: 0,
    priceFormatted: '$0 CLP',
    maxPostsPerMonth: 5,
    maxReelsScripts: 0,
    maxAiImagesPerMonth: 5,
    allowedPlatforms: ['instagram', 'facebook'],
    features: {
      blogSeo: false,
      competitorSpy: false,
      adsGenerator: false,
      vipSupport: false,
    },
    description: 'Prueba de 7 días para conocer la plataforma.',
  },
  esencial: {
    id: 'esencial',
    name: 'Plan PyME Esencial',
    badge: 'Presencia Activa',
    priceClp: 59990,
    priceFormatted: '$59.990 + IVA/mes',
    priceNormalFormatted: '$89.990/mes',
    maxPostsPerMonth: 15,
    maxReelsScripts: 8,
    maxAiImagesPerMonth: 15,
    allowedPlatforms: ['instagram', 'facebook'],
    features: {
      blogSeo: false,
      competitorSpy: false,
      adsGenerator: false,
      vipSupport: false,
    },
    description: 'Para negocios y profesionales que necesitan redes activas, confiables y sin bloqueos.',
  },
  crecimiento: {
    id: 'crecimiento',
    name: 'Plan PyME Crecimiento',
    badge: 'Máquina de Ventas (Más Elegido)',
    priceClp: 99990,
    priceFormatted: '$99.990 + IVA/mes',
    priceNormalFormatted: '$149.990/mes',
    maxPostsPerMonth: 30,
    maxReelsScripts: 30,
    maxAiImagesPerMonth: 40,
    allowedPlatforms: ['instagram', 'facebook', 'linkedin', 'tiktok'],
    features: {
      blogSeo: true,
      competitorSpy: true,
      adsGenerator: true,
      vipSupport: false,
    },
    description: 'Para PyMEs establecidas que buscan captar clientes todos los días y superar a su competencia.',
  },
  piloto_automatico: {
    id: 'piloto_automatico',
    name: 'Plan Piloto Automático',
    badge: 'Done-With-You VIP',
    priceClp: 249990,
    priceFormatted: '$249.990 + IVA/mes',
    priceNormalFormatted: '$390.000/mes',
    maxPostsPerMonth: 60,
    maxReelsScripts: 60,
    maxAiImagesPerMonth: 120,
    allowedPlatforms: ['instagram', 'facebook', 'linkedin', 'tiktok'],
    features: {
      blogSeo: true,
      competitorSpy: true,
      adsGenerator: true,
      vipSupport: true,
    },
    description: 'Acompañamiento VIP integral con soporte prioritario 1-a-1 por WhatsApp.',
  },
};

/**
 * Normaliza cualquier identificador de plan (incluyendo nombres legacy de Firestore)
 * a uno de los 3 planes oficiales o fallback seguro a 'esencial' o 'free'.
 */
export function normalizePlanId(plan?: string | null): PlanId {
  if (!plan) return 'esencial';
  const clean = plan.toLowerCase().trim().replace(/[-\s]/g, '_');

  if (clean === 'free' || clean === 'demo' || clean === 'prueba') {
    return 'free';
  }
  if (clean === 'esencial' || clean === 'starter') {
    return 'esencial';
  }
  if (clean === 'crecimiento' || clean === 'growth' || clean === 'pro' || clean === 'elite') {
    return 'crecimiento';
  }
  if (
    clean === 'piloto_automatico' ||
    clean === 'business' ||
    clean === 'agency' ||
    clean === 'enterprise' ||
    clean === 'unlimited'
  ) {
    return 'piloto_automatico';
  }

  return 'esencial';
}

/**
 * Retorna la configuración completa del plan dado un string cualquiera.
 */
export function getPlanConfig(plan?: string | null): PlanConfig {
  const normalized = normalizePlanId(plan);
  return PLAN_CONFIGS[normalized] || PLAN_CONFIGS.esencial;
}

/**
 * Verifica si una red social específica está permitida en el plan.
 */
export function isPlatformAllowed(plan: string | null | undefined, platform: string): boolean {
  const config = getPlanConfig(plan);
  const normalizedPlatform = platform.toLowerCase().trim() as SupportedPlatform;
  return config.allowedPlatforms.includes(normalizedPlatform);
}

/**
 * Verifica si una feature exclusiva está habilitada en el plan.
 */
export function hasPlanFeature(plan: string | null | undefined, feature: keyof PlanFeatures): boolean {
  const config = getPlanConfig(plan);
  return Boolean(config.features[feature]);
}
