export type MenuThemeId = 
  | 'dark_modern'
  | 'warm_cafe'
  | 'fresh_bistro'
  | 'vibrant_street'
  | 'minimal_clean';

export interface MenuTheme {
  id: MenuThemeId;
  name: string;
  tagline: string;
  emoji: string;
  recommendedFor: string;
  preview: {
    bg: string;
    card: string;
    accent: string;
    text: string;
  };
  styles: {
    pageBg: string;
    heroGradient: string;
    heroText: string;
    heroSubtext: string;
    heroCard: string;
    searchBox: string;
    searchInput: string;
    categoryActive: string;
    categoryInactive: string;
    categoryPromoActive: string;
    categoryPromoInactive: string;
    card: string;
    cardBorder: string;
    titleColor: string;
    descColor: string;
    priceColor: string;
    offerPriceColor: string;
    offerBadge: string;
    categoryTag: string;
    ctaButton: string;
    floatingBar: string;
    dividerColor: string;
    photoPlaceholder: string;
  };
}

export const MENU_THEMES: Record<MenuThemeId, MenuTheme> = {
  dark_modern: {
    id: 'dark_modern',
    name: 'Gourmet Dark & Lounge',
    tagline: 'Elegante, nocturno y contrastado con toques dorados',
    emoji: '🍸',
    recommendedFor: 'Bares, bistrós, hamburgueserías gourmet, parrilladas y pubs',
    preview: {
      bg: '#09090b',
      card: '#18181b',
      accent: '#f59e0b',
      text: '#fafafa',
    },
    styles: {
      pageBg: 'bg-zinc-950 text-zinc-100',
      heroGradient: 'bg-gradient-to-br from-black via-zinc-900 to-amber-950/40 text-white border-b border-zinc-800/80',
      heroText: 'text-white',
      heroSubtext: 'text-amber-200/90',
      heroCard: 'bg-zinc-900/80 backdrop-blur-md border border-zinc-800 text-zinc-300',
      searchBox: 'bg-zinc-900/95 backdrop-blur-md border border-zinc-800 text-zinc-100 shadow-xl',
      searchInput: 'text-zinc-100 placeholder-zinc-500 focus:ring-amber-500',
      categoryActive: 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20 font-black',
      categoryInactive: 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 border border-zinc-800',
      categoryPromoActive: 'bg-rose-600 text-white shadow-md shadow-rose-500/20 font-black',
      categoryPromoInactive: 'bg-rose-950/60 text-rose-300 border border-rose-800/60 hover:bg-rose-900/50',
      card: 'bg-zinc-900/90 backdrop-blur-sm border border-zinc-800/90 hover:border-amber-500/30 text-zinc-100 shadow-lg',
      cardBorder: 'border-zinc-800',
      titleColor: 'text-zinc-50 font-black',
      descColor: 'text-zinc-400',
      priceColor: 'text-amber-400 font-black',
      offerPriceColor: 'text-rose-400 font-black',
      offerBadge: 'bg-rose-600 text-white shadow-md',
      categoryTag: 'bg-zinc-800 text-amber-300 border border-zinc-700/60',
      ctaButton: 'bg-amber-500 hover:bg-amber-600 text-zinc-950 font-black shadow-md shadow-amber-500/20',
      floatingBar: 'bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 shadow-2xl shadow-amber-500/30 font-black',
      dividerColor: 'border-zinc-800',
      photoPlaceholder: 'bg-zinc-800 text-zinc-600',
    },
  },

  warm_cafe: {
    id: 'warm_cafe',
    name: 'Cafetería Cálida & Panadería',
    tagline: 'Tonos tostados, madera, lino y ambiente artesanal acogedor',
    emoji: '☕',
    recommendedFor: 'Cafeterías de autor, panaderías, pastelerías, brunchs y teterías',
    preview: {
      bg: '#faf6f0',
      card: '#ffffff',
      accent: '#c27803',
      text: '#443831',
    },
    styles: {
      pageBg: 'bg-[#faf6f0] text-[#3e2723]',
      heroGradient: 'bg-gradient-to-br from-[#3e2723] via-[#4e342e] to-[#6d4c41] text-amber-50 border-b border-[#5d4037]',
      heroText: 'text-amber-50',
      heroSubtext: 'text-amber-200',
      heroCard: 'bg-[#3e2723]/60 backdrop-blur-md border border-amber-900/40 text-amber-100',
      searchBox: 'bg-white/95 backdrop-blur-md border border-[#e6d5c3] text-[#3e2723] shadow-md',
      searchInput: 'text-[#3e2723] placeholder-[#8d6e63] focus:ring-[#8d6e63]',
      categoryActive: 'bg-[#8d6e63] text-white shadow-md shadow-[#8d6e63]/25 font-black',
      categoryInactive: 'bg-white text-[#5d4037] hover:bg-[#f5ebe1] border border-[#e6d5c3]',
      categoryPromoActive: 'bg-[#d97706] text-white shadow-md shadow-[#d97706]/25 font-black',
      categoryPromoInactive: 'bg-[#fef3c7] text-[#92400e] border border-[#fde68a] hover:bg-[#fde68a]',
      card: 'bg-white border border-[#ebdcd0] hover:border-[#8d6e63]/40 text-[#3e2723] shadow-sm hover:shadow-md',
      cardBorder: 'border-[#ebdcd0]',
      titleColor: 'text-[#3e2723] font-black',
      descColor: 'text-[#6d4c41]',
      priceColor: 'text-[#4e342e] font-black',
      offerPriceColor: 'text-[#d97706] font-black',
      offerBadge: 'bg-[#d97706] text-white shadow-xs',
      categoryTag: 'bg-[#f7ece1] text-[#6d4c41] border border-[#ebdcd0]',
      ctaButton: 'bg-[#8d6e63] hover:bg-[#6d4c41] text-white font-black shadow-sm',
      floatingBar: 'bg-[#5d4037] hover:bg-[#4e342e] text-white shadow-xl shadow-[#5d4037]/30 font-black',
      dividerColor: 'border-[#ebdcd0]',
      photoPlaceholder: 'bg-[#f5ebe1] text-[#a1887f]',
    },
  },

  fresh_bistro: {
    id: 'fresh_bistro',
    name: 'Fresco Botánico & Saludable',
    tagline: 'Verdes esmeralda, hojas y estética fresca y vibrante',
    emoji: '🥗',
    recommendedFor: 'Comida saludable, pizzerías, sushi, ensaladas, comida vegana y huertos',
    preview: {
      bg: '#f0fdf4',
      card: '#ffffff',
      accent: '#059669',
      text: '#064e3b',
    },
    styles: {
      pageBg: 'bg-[#f0fdf4] text-slate-800',
      heroGradient: 'bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#0f766e] text-emerald-50 border-b border-emerald-800',
      heroText: 'text-emerald-50',
      heroSubtext: 'text-emerald-200',
      heroCard: 'bg-emerald-950/40 backdrop-blur-md border border-emerald-800/40 text-emerald-100',
      searchBox: 'bg-white/95 backdrop-blur-md border border-emerald-200/80 text-slate-800 shadow-md',
      searchInput: 'text-slate-800 placeholder-emerald-700/60 focus:ring-emerald-600',
      categoryActive: 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 font-black',
      categoryInactive: 'bg-white text-emerald-900 hover:bg-emerald-50 border border-emerald-200/60',
      categoryPromoActive: 'bg-rose-600 text-white shadow-md shadow-rose-600/25 font-black',
      categoryPromoInactive: 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100',
      card: 'bg-white border border-emerald-100 hover:border-emerald-300 text-slate-800 shadow-sm hover:shadow-md',
      cardBorder: 'border-emerald-100',
      titleColor: 'text-emerald-950 font-black',
      descColor: 'text-slate-600',
      priceColor: 'text-emerald-700 font-black',
      offerPriceColor: 'text-rose-600 font-black',
      offerBadge: 'bg-rose-600 text-white shadow-xs',
      categoryTag: 'bg-emerald-50 text-emerald-800 border border-emerald-200/70',
      ctaButton: 'bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-sm',
      floatingBar: 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xl shadow-emerald-700/30 font-black',
      dividerColor: 'border-emerald-100',
      photoPlaceholder: 'bg-emerald-50 text-emerald-300',
    },
  },

  vibrant_street: {
    id: 'vibrant_street',
    name: 'Street Food & Enérgico',
    tagline: 'Fuego, contrastes audaces y apetitoso rojo/naranja',
    emoji: '🔥',
    recommendedFor: 'Comida rápida, tacos, empanadas, alitas, delivery y foodtrucks',
    preview: {
      bg: '#fff7ed',
      card: '#ffffff',
      accent: '#ea580c',
      text: '#1c1917',
    },
    styles: {
      pageBg: 'bg-[#fff7ed] text-slate-900',
      heroGradient: 'bg-gradient-to-br from-slate-950 via-[#991b1b] to-[#ea580c] text-white border-b border-orange-900',
      heroText: 'text-white',
      heroSubtext: 'text-orange-200',
      heroCard: 'bg-black/40 backdrop-blur-md border border-white/10 text-orange-100',
      searchBox: 'bg-white/95 backdrop-blur-md border-2 border-orange-200 text-slate-900 shadow-lg',
      searchInput: 'text-slate-900 placeholder-slate-400 focus:ring-orange-500',
      categoryActive: 'bg-orange-600 text-white shadow-md shadow-orange-600/30 font-black',
      categoryInactive: 'bg-white text-slate-800 hover:bg-orange-50 border border-slate-200',
      categoryPromoActive: 'bg-red-600 text-white shadow-md shadow-red-600/30 font-black',
      categoryPromoInactive: 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100',
      card: 'bg-white border-2 border-slate-100 hover:border-orange-300 text-slate-900 shadow-md hover:shadow-lg',
      cardBorder: 'border-slate-100',
      titleColor: 'text-slate-950 font-black',
      descColor: 'text-slate-600',
      priceColor: 'text-slate-900 font-black',
      offerPriceColor: 'text-red-600 font-black',
      offerBadge: 'bg-red-600 text-white shadow-md',
      categoryTag: 'bg-orange-50 text-orange-800 border border-orange-200',
      ctaButton: 'bg-orange-600 hover:bg-orange-700 text-white font-black shadow-md shadow-orange-600/20',
      floatingBar: 'bg-orange-600 hover:bg-orange-700 text-white shadow-xl shadow-orange-600/30 font-black',
      dividerColor: 'border-orange-100',
      photoPlaceholder: 'bg-orange-50 text-orange-300',
    },
  },

  minimal_clean: {
    id: 'minimal_clean',
    name: 'Minimalista & Blanco Puro',
    tagline: 'Limpio, sobrio y moderno con tonos neutros e índigo',
    emoji: '✨',
    recommendedFor: 'Boutiques, pastelerías finas, heladerías de diseño y servicios',
    preview: {
      bg: '#f8fafc',
      card: '#ffffff',
      accent: '#4f46e5',
      text: '#0f172a',
    },
    styles: {
      pageBg: 'bg-slate-50 text-slate-900',
      heroGradient: 'bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white border-b border-slate-800',
      heroText: 'text-white',
      heroSubtext: 'text-indigo-200',
      heroCard: 'bg-white/10 backdrop-blur-md border border-white/10 text-slate-300',
      searchBox: 'bg-white/95 backdrop-blur-md border border-slate-200/80 text-slate-900 shadow-md',
      searchInput: 'text-slate-900 placeholder-slate-400 focus:ring-indigo-600',
      categoryActive: 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 font-black',
      categoryInactive: 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200/70',
      categoryPromoActive: 'bg-rose-600 text-white shadow-md shadow-rose-600/25 font-black',
      categoryPromoInactive: 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100',
      card: 'bg-white border border-slate-200/80 hover:border-indigo-300 text-slate-900 shadow-xs hover:shadow-md',
      cardBorder: 'border-slate-200/80',
      titleColor: 'text-slate-900 font-black',
      descColor: 'text-slate-500',
      priceColor: 'text-slate-900 font-black',
      offerPriceColor: 'text-rose-600 font-black',
      offerBadge: 'bg-rose-600 text-white shadow-xs',
      categoryTag: 'bg-slate-100 text-slate-700 border border-slate-200/60',
      ctaButton: 'bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-sm',
      floatingBar: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-600/30 font-black',
      dividerColor: 'border-slate-100',
      photoPlaceholder: 'bg-slate-100 text-slate-300',
    },
  },
};

export const DEFAULT_MENU_THEME: MenuThemeId = 'minimal_clean';
