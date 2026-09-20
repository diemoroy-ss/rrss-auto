/**
 * Tipos compartidos del Dashboard de Publicaciones.
 * Centralizados aquí para evitar duplicación entre page.tsx y sus subcomponentes.
 */

export interface SocialPost {
  id: string;
  idea: string;
  text?: string;
  copy?: string;
  postText?: string;
  title?: string;
  type?: string;
  format?: string;
  scheduledFor: any; // Firestore Timestamp
  networks: string[]; // ['facebook', 'instagram', ...]
  status: 'pending' | 'confirmed' | 'published' | 'error' | 'publishing' | 'draft' | 'strategy_draft';
  imageUrl?: string;
  imageUrls?: string[];
  baseImageUrl?: string;
  visualStyle?: string;
  promptTemplateId?: string;
  previewUrl?: string;
  imageDirection?: string;
  imageSource?: string;
  carouselCount?: number;
  isGeneratingImage?: boolean;
  publishError?: string;
  publishInfo?: string;
  videoUrl?: string;
  scenes?: any[];
  audioScript?: string;
  publishedIn?: string[];
  isTestMode?: boolean;
  testMode?: boolean;
  testAccountUser?: string;
  publishedAt?: any;
  createdAt?: any;
  profileId?: string;
  userId?: string;
}

/** Configuración visual por estado de un post */
export type PostStatus = SocialPost['status'];

export interface StatusConfig {
  color: string;
  text: string;
}

export const STATUS_CONFIG: Record<string, StatusConfig> = {
  pending: {
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    text: '⏸️ Pausado / Borrador',
  },
  draft: {
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    text: '⏸️ Pausado / Borrador',
  },
  strategy_draft: {
    color: 'text-amber-600 bg-amber-50 border-amber-200',
    text: '⏸️ Pausado / Borrador',
  },
  confirmed: {
    color: 'text-indigo-600 bg-indigo-50 border-indigo-200',
    text: '⏳ Agendado por Santisoft',
  },
  publishing: {
    color: 'text-blue-600 bg-blue-50 border-blue-200 shadow-sm animate-pulse',
    text: '⚡ Publicando...',
  },
  published: {
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    text: '✅ Publicado',
  },
  error: {
    color: 'text-rose-600 bg-rose-50 border-rose-200',
    text: '❌ Error',
  },
  quota_exceeded: {
    color: 'text-amber-700 bg-amber-50 border-amber-300',
    text: '⚠️ Cuota Excedida (Reagendar)',
  },
};

/** Devuelve la config de status, con fallback a 'pending' */
export function getStatusConfig(status: string, isBlog?: boolean): StatusConfig {
  if (isBlog && status !== 'published') {
    return STATUS_CONFIG['confirmed'];
  }
  return STATUS_CONFIG[status] ?? { color: 'text-slate-600 bg-slate-50 border-slate-200', text: status };
}

/** Utilidad para extraer las redes de un post (soporta array y objeto legacy) */
export function getPostNetworks(post: SocialPost): string[] {
  if (Array.isArray(post.networks)) return post.networks;
  return Object.entries(post.networks || {})
    .filter(([, v]) => v)
    .map(([k]) => k);
}

/** Devuelve si un post es de tipo blog */
export function isBlogPost(post: SocialPost): boolean {
  return getPostNetworks(post).includes('blog');
}

/** Devuelve la etiqueta de tipo de post (para la badge de formato) */
export function getPostTypeLabel(post: SocialPost): string {
  const type = post.type?.toLowerCase() ?? '';
  const fmt = post.format?.toLowerCase() ?? '';

  if (type.includes('reel') || type.includes('video') || fmt.includes('reel') || fmt.includes('short')) {
    return '🎬 Reel / Short';
  }
  if (type.includes('carrusel') || type.includes('carousel')) {
    return '📑 Carrusel';
  }
  if (type.includes('stor') || type.includes('historia')) {
    return '📱 Historia';
  }
  if (type === 'blog') {
    return '📝 Blog';
  }
  return '🖼️ Post';
}
