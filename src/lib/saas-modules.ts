/**
 * Arquitectura Modular del Ecosistema SaaS SocialPilot
 * Define los 3 productos independientes (Marketing, Carta QR, Fideliza),
 * su resolución retrocompatible multi-tenant, paquetes comerciales y permisos por rol.
 */

export type SaasModuleId = 'marketing' | 'qr' | 'fideliza';

export interface ContractedModules {
  marketing: boolean;
  qr: boolean;
  fideliza: boolean;
}

export type UserRole = 'admin' | 'owner' | 'collaborator' | 'vendedor' | 'user';

export type SubscriptionLifecycleStatus =
  | 'active'
  | 'trial'
  | 'manual'
  | 'suspended'
  | 'expired'
  | 'pending_payment';

export interface CustomUsageLimits {
  postsLimit?: number | null;
  aiImagesLimit?: number | null;
  videosLimit?: number | null;
  maxBusinesses?: number | null;
}

export interface CommercialSubscriptionMeta {
  planId: string;
  status: SubscriptionLifecycleStatus;
  billingCycle?: 'monthly' | 'annual' | 'custom';
  startDate?: string | null;
  endDate?: string | null;
  manualActivation?: boolean;
  commercialNotes?: string;
  customLimits?: CustomUsageLimits;
  updatedAt?: string;
  updatedBy?: string;
}

export interface BusinessCollaborator {
  email: string;
  name?: string;
  role: 'owner' | 'collaborator';
  profileIds?: string[]; // vacío o ['*'] significa acceso a todos los negocios de la cuenta
  addedAt: string;
  addedBy?: string;
}

export interface SaasModuleMetadata {
  id: SaasModuleId;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  badge: string;
  primaryRoute: string;
  publicDemoUrl: string;
  subdomain: string;
  accentColor: string;
  features: string[];
}

export interface ModulePackagePreset {
  id: string;
  name: string;
  shortDescription: string;
  modules: ContractedModules;
  recommendedFor: string;
}

export const GENERAL_ADMIN_EMAILS: readonly string[] = [
  'diemoroy@gmail.com',
  'admin@santisoft.cl',
  'spalezcom@gmail.com',
  'santisoftai@gmail.com',
];

export const SAAS_MODULES_CATALOG: Record<SaasModuleId, SaasModuleMetadata> = {
  marketing: {
    id: 'marketing',
    name: 'SocialPilot Marketing',
    shortName: 'Marketing',
    tagline: 'Contenido, calendario y publicación automática para tus redes',
    description:
      'Crea imágenes comerciales, textos persuasivos, Reels y promociones a partir de tu catálogo. Organiza tu calendario y programa en Instagram, Facebook, TikTok y LinkedIn con el apoyo de nuestros agentes especializados.',
    badge: 'Redes Sociales & Contenido',
    primaryRoute: '/automatizacion-rrss/panel',
    publicDemoUrl: '/demo-plan-mania',
    subdomain: 'marketing.socialpilot.cl',
    accentColor: 'orange',
    features: [
      'Creación de imágenes y textos comerciales con nuestros agentes',
      'Calendario editorial y programación automática multi-red',
      'Generación de guiones y videos cortos (Reels / TikTok)',
      'Conexión directa con tu catálogo de productos y promociones',
      'Radar de nicho y análisis de anuncios de la competencia',
    ],
  },
  qr: {
    id: 'qr',
    name: 'SocialPilot Carta QR',
    shortName: 'Carta QR',
    tagline: 'Carta digital interactiva y código QR listo para tus mesas',
    description:
      'Publica tu menú digital con categorías, fotografías, precios y promociones en tiempo real. Funciona de forma 100% independiente o sincronizado con tu catálogo central.',
    badge: 'Gastronomía & Comercios',
    primaryRoute: '/automatizacion-rrss/panel/menu-qr',
    publicDemoUrl: '/menu/AGdJLwdz0QNhBPcRp1FdWWMooAb2___default',
    subdomain: 'menu.socialpilot.cl',
    accentColor: 'amber',
    features: [
      'Carta digital responsive optimizada para celulares',
      'Categorías, fotografías, precios y ofertas del día en vivo',
      'Generador de código QR descargable listo para imprimir',
      '5 temas visuales personalizables con la identidad de tu local',
      'Buscador instantáneo y contacto directo a tu WhatsApp',
    ],
  },
  fideliza: {
    id: 'fideliza',
    name: 'SocialPilot Fideliza',
    shortName: 'Fideliza',
    tagline: 'Club de puntos, sellos y recompensas para que tus clientes vuelvan',
    description:
      'Transforma visitas ocasionales en clientes frecuentes. Configura tarjetas digitales de sellos o puntos por compra, valida en caja con PIN o código QR y evita usos duplicados.',
    badge: 'Retención & Club VIP',
    primaryRoute: '/automatizacion-rrss/panel/fidelizacion',
    publicDemoUrl: '/fideliza',
    subdomain: 'fideliza.socialpilot.cl',
    accentColor: 'emerald',
    features: [
      'Acumulación por visitas (sellos) o por monto de compra (puntos)',
      'Recompensas vinculadas directamente a productos de tu catálogo',
      'Validación antifraude con PIN de cajero, QR o terminal de caja',
      'Billetera digital sin necesidad de descargar aplicaciones',
      'Base de clientes registrados e historial de canjes en tiempo real',
    ],
  },
};

export const MODULE_PACKAGES: readonly ModulePackagePreset[] = [
  {
    id: 'only_marketing',
    name: 'Solo Marketing',
    shortDescription: 'Creación y programación de redes sociales',
    modules: { marketing: true, qr: false, fideliza: false },
    recommendedFor: 'Empresas de servicios, tiendas online y marcas personales',
  },
  {
    id: 'only_qr',
    name: 'Solo Carta QR',
    shortDescription: 'Carta digital interactiva y catálogo gastronómico',
    modules: { marketing: false, qr: true, fideliza: false },
    recommendedFor: 'Restaurantes, cafeterías y bares que buscan digitalizar su carta',
  },
  {
    id: 'only_fideliza',
    name: 'Solo Fideliza',
    shortDescription: 'Programa de puntos, sellos y recompensas',
    modules: { marketing: false, qr: false, fideliza: true },
    recommendedFor: 'Comercios físicos, cafeterías de especialidad, barberías y estética',
  },
  {
    id: 'marketing_qr',
    name: 'Marketing + Carta QR',
    shortDescription: 'Carta digital conectada con publicaciones automáticas',
    modules: { marketing: true, qr: true, fideliza: false },
    recommendedFor: 'Restaurantes que quieren difundir sus platos y promociones en redes',
  },
  {
    id: 'marketing_fideliza',
    name: 'Marketing + Fideliza',
    shortDescription: 'Atracción en redes sociales y retención en el local',
    modules: { marketing: true, qr: false, fideliza: true },
    recommendedFor: 'Comercios minoristas, gimnasios, clínicas y centros de servicios',
  },
  {
    id: 'qr_fideliza',
    name: 'Carta QR + Fideliza',
    shortDescription: 'Experiencia en mesa y club de clientes frecuentes',
    modules: { marketing: false, qr: true, fideliza: true },
    recommendedFor: 'Cafeterías y locales gastronómicos enfocados en atención en salón',
  },
  {
    id: 'full_ecosystem',
    name: 'Ecosistema Completo (3 Módulos)',
    shortDescription: 'Marketing + Carta QR + Fideliza integrados en un solo catálogo',
    modules: { marketing: true, qr: true, fideliza: true },
    recommendedFor: 'Negocios gastronómicos y comercios que buscan crecimiento integral',
  },
];

export interface ModuleResolutionUserInput {
  role?: string | null;
  email?: string | null;
  plan?: string | null;
  contractedModules?: Partial<ContractedModules> | null;
  menuDigitalEnabled?: boolean | null;
  fidelizacionEnabled?: boolean | null;
}

export interface ModuleResolutionProfileInput {
  id?: string;
  contractedModules?: Partial<ContractedModules> | null;
  menuDigitalEnabled?: boolean | null;
  fidelizacionEnabled?: boolean | null;
  fidelizacionConfig?: {
    enabled?: boolean | null;
  } | null;
}

/**
 * Determina si un usuario es Administrador General de SocialPilot.
 */
export function isGeneralAdmin(email?: string | null, role?: string | null): boolean {
  if (role === 'admin') return true;
  if (!email) return false;
  return GENERAL_ADMIN_EMAILS.includes(email.toLowerCase().trim());
}

/**
 * Resuelve de forma segura y retrocompatible qué módulos están activos para un negocio/usuario.
 *
 * Reglas de prioridad:
 * 1. Si el perfil del negocio define `contractedModules` explícito, se utiliza esa configuración.
 * 2. Si el documento del usuario define `contractedModules` explícito, se utiliza esa configuración
 *    (combinada con flags activos de QR o Fideliza del perfil si ya estaban encendidos).
 * 3. Para cuentas legacy (sin `contractedModules`), se conserva `marketing: true` por defecto
 *    y se activan `qr` / `fideliza` según sus flags existentes o si el plan es `piloto_automatico`.
 */
export function resolveContractedModules(
  userData?: ModuleResolutionUserInput | null,
  activeProfile?: ModuleResolutionProfileInput | null,
  forceAdminAll: boolean = false
): ContractedModules {
  if (forceAdminAll) {
    return { marketing: true, qr: true, fideliza: true };
  }

  // 1. Si el perfil del negocio tiene contractedModules explícito con al menos una clave definida
  const profileModules = activeProfile?.contractedModules;
  if (
    profileModules &&
    typeof profileModules === 'object' &&
    (typeof profileModules.marketing === 'boolean' ||
      typeof profileModules.qr === 'boolean' ||
      typeof profileModules.fideliza === 'boolean')
  ) {
    return {
      marketing: Boolean(profileModules.marketing),
      qr: Boolean(profileModules.qr),
      fideliza: Boolean(profileModules.fideliza),
    };
  }

  // 2. Si el usuario tiene contractedModules explícito en su documento raíz
  const userModules = userData?.contractedModules;
  if (
    userModules &&
    typeof userModules === 'object' &&
    (typeof userModules.marketing === 'boolean' ||
      typeof userModules.qr === 'boolean' ||
      typeof userModules.fideliza === 'boolean')
  ) {
    return {
      marketing: Boolean(userModules.marketing),
      qr: Boolean(userModules.qr),
      fideliza: Boolean(userModules.fideliza),
    };
  }

  // 3. Fallback retrocompatible para usuarios existentes previos a la migración modular
  const isPilotoAutomatico =
    userData?.plan?.toLowerCase().trim() === 'piloto_automatico' ||
    userData?.plan?.toLowerCase().trim() === 'business';

  const legacyQr = Boolean(
    activeProfile?.menuDigitalEnabled ||
      userData?.menuDigitalEnabled ||
      isPilotoAutomatico
  );

  const legacyFideliza = Boolean(
    activeProfile?.fidelizacionEnabled ||
      activeProfile?.fidelizacionConfig?.enabled ||
      userData?.fidelizacionEnabled ||
      isPilotoAutomatico
  );

  return {
    marketing: true,
    qr: legacyQr,
    fideliza: legacyFideliza,
  };
}

/**
 * Verifica si un módulo específico está contratado/activo.
 */
export function hasModuleAccess(
  modules: ContractedModules | null | undefined,
  moduleId: SaasModuleId
): boolean {
  if (!modules) return false;
  return Boolean(modules[moduleId]);
}

/**
 * Devuelve la lista de metadatos de los módulos activos.
 */
export function getActiveModulesList(modules: ContractedModules): SaasModuleMetadata[] {
  const list: SaasModuleMetadata[] = [];
  if (modules.marketing) list.push(SAAS_MODULES_CATALOG.marketing);
  if (modules.qr) list.push(SAAS_MODULES_CATALOG.qr);
  if (modules.fideliza) list.push(SAAS_MODULES_CATALOG.fideliza);
  return list;
}

/**
 * Devuelve la lista de metadatos de los módulos NO contratados (para mostrar discretamente como adicionales).
 */
export function getUncontractedModulesList(modules: ContractedModules): SaasModuleMetadata[] {
  const list: SaasModuleMetadata[] = [];
  if (!modules.marketing) list.push(SAAS_MODULES_CATALOG.marketing);
  if (!modules.qr) list.push(SAAS_MODULES_CATALOG.qr);
  if (!modules.fideliza) list.push(SAAS_MODULES_CATALOG.fideliza);
  return list;
}

/**
 * Obtiene la ruta principal de trabajo según los módulos contratados por el cliente.
 */
export function getPrimaryModuleRoute(modules: ContractedModules): string {
  if (modules.marketing) return SAAS_MODULES_CATALOG.marketing.primaryRoute;
  if (modules.qr) return SAAS_MODULES_CATALOG.qr.primaryRoute;
  if (modules.fideliza) return SAAS_MODULES_CATALOG.fideliza.primaryRoute;
  return '/automatizacion-rrss/panel/catalogo';
}

/**
 * Identifica si el paquete de módulos coincide con alguno de los presets comerciales.
 */
export function findMatchingPackagePreset(
  modules: ContractedModules
): ModulePackagePreset | undefined {
  return MODULE_PACKAGES.find(
    (preset) =>
      preset.modules.marketing === modules.marketing &&
      preset.modules.qr === modules.qr &&
      preset.modules.fideliza === modules.fideliza
  );
}
