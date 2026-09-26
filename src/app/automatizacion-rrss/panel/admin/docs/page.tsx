"use client";

import { useEffect, useState } from "react";
import { auth } from "../../../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ADMIN_EMAILS = ["diemoroy@gmail.com", "spalezcom@gmail.com", "santisoftai@gmail.com"];

// ─── DATA ────────────────────────────────────────────────────────────────────

const APP_SUMMARY = {
  name: "Santisoft Automatización",
  version: "2.0",
  domain: "https://rrss.santisoft.cl",
  description:
    "Plataforma SaaS de automatización de marketing en redes sociales. Genera, calendariza y publica contenido en Meta, LinkedIn, TikTok y Twitter usando agentes especializados (Gemini + Vertex AI + LangGraph). Incluye análisis de métricas, estrategias de nicho, generación de video, blog SEO, módulo de prospección comercial y panel administrativo completo.",
  stack: [
    { label: "Frontend", value: "Next.js 14 App Router + React 18 + TypeScript" },
    { label: "Estilos", value: "Tailwind CSS" },
    { label: "Auth & DB", value: "Firebase Auth + Firestore + Firebase Storage" },
    { label: "Agentes IA", value: "Gemini API (gemini-flash) + Vertex AI (gemini-2.5-flash) + LangGraph" },
    { label: "Video", value: "Remotion (programático) + n8n Webhook (image-to-video)" },
    { label: "Audio", value: "ElevenLabs TTS" },
    { label: "Tareas BG", value: "Google Cloud Tasks" },
    { label: "Pagos", value: "MercadoPago API" },
    { label: "Automatización", value: "n8n (webhooks: generate-image, image-to-video)" },
    { label: "Reportes", value: "Recharts + jsPDF + html2canvas + @react-pdf/renderer" },
  ],
};

const PAGES = [
  {
    category: "Páginas Públicas",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
    items: [
      {
        path: "/",
        name: "Landing Page",
        description: "Página principal de marketing: propuesta de valor, planes, testimonios, formulario de contacto y chat bot.",
        components: ["HeroSection", "PricingPlans", "TestimonialsSection", "DemoForm", "WebChatWidget", "BrandHeader", "BrandFooter", "DotCanvas"],
        features: ["Tour interactivo con InternalTour", "Sección WhatsApp bot", "Promo modal", "Dark mode toggle"],
      },
      { path: "/login", name: "Login", description: "Autenticación con Google OAuth vía Firebase Auth.", components: ["SantisoftLogo", "PageTracker"], features: ["Sign-in con Google", "Redirección post-login al panel"] },
      { path: "/registro", name: "Registro", description: "Flujo de creación de cuenta con email/password + Google.", components: ["SantisoftLogo"], features: ["Creación de usuario en Firestore", "Redirección a onboarding"] },
      { path: "/onboarding", name: "Onboarding", description: "Wizard de configuración inicial de cuenta: rubro, nombre del negocio, redes sociales objetivo.", components: ["SantisoftLogo", "NetworkSwitcher"], features: ["Multi-paso", "Guardado en Firestore users"] },
      { path: "/agendar", name: "Agendar Reunión", description: "Formulario público para agendar reunión con el equipo Santisoft.", components: ["ContactForm", "BrandHeader"], features: ["Selección de fecha/hora", "Bloqueo de horarios ocupados", "Confirmación por email"] },
      { path: "/m/[id]", name: "Demo Pública Prospecto", description: "Propuesta comercial personalizada generada por el Generador de Muestras.", components: [], features: ["Imagen con watermark", "Video preview", "Copy sugerido con 1-click copy", "CTA a WhatsApp"] },
      { path: "/render/preview", name: "Preview Butterfly Social", description: "Endpoint visual que Butterfly Social usa para renderizar diseños de posts.", components: [], features: ["textLayers + logoUrl vía query params", "Watermark Santisoft", "Full-bleed 1080×1080"] },
      { path: "/blog, /blog/[slug]", name: "Blog Público", description: "Listado de artículos SEO generados por agentes + página individual.", components: ["BrandHeader", "BrandFooter"], features: ["Paginación", "Schema SEO", "Imagen de portada IA"] },
      { path: "/privacidad, /terminos", name: "Legales", description: "Políticas de privacidad y términos de servicio bilingüe (ES + EN).", components: ["BrandHeader", "BrandFooter"], features: ["Bilingüe ES/EN"] },
    ],
  },
  {
    category: "Panel de Usuario",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
    items: [
      { path: "/panel", name: "Dashboard", description: "Vista central: posts recientes, métricas rápidas, accesos directos.", components: ["DashboardHeader", "PostCard", "PostGrid", "PostFilters", "BulkActionBar", "NetworkSwitcher"], features: ["Lista de posts publicados y borradores", "Filtros por red social", "Acciones en lote", "Vista carrusel"] },
      { path: "/panel/crear", name: "Crear Contenido", description: "Generador principal de posts: wizard multi-paso con agentes para copy e imagen.", components: ["PostConfigForm", "CanvasEditor", "AIOptionsModal", "GeneratingModal", "CarouselWizard", "PromptStylePickerModal"], features: ["Copy con frameworks PAS/AIDA/HSO", "Imagen con Vertex AI", "Canvas editor client-side", "Estilos visuales predefinidos", "Publicación directa o programada"] },
      { path: "/panel/estrategia", name: "Estrategia", description: "Generación automática de estrategia mensual/semanal con LangGraph.", components: ["PromptStyleSelector"], features: ["Análisis de rubro y audiencia", "Calendario de contenido sugerido"] },
      { path: "/panel/radar", name: "Radar de Nicho", description: "Análisis competitivo y tendencias del nicho del cliente.", components: [], features: ["Tendencias por rubro", "Análisis de competencia", "Ángulos de contenido"] },
      { path: "/panel/metricas", name: "Métricas", description: "Dashboard de analytics: alcance, impresiones, engagement por red social.", components: ["ReporteAnalyticsPDF"], features: ["Gráficos Recharts", "Exportación PDF", "Sync Meta/LinkedIn API"] },
      { path: "/panel/poc-video", name: "POC Image-to-Video", description: "Laboratorio de generación de video: Remotion vs. n8n Webhook.", components: ["RemotionReelPlayer"], features: ["Switch ⚡ Remotion / ✨ n8n Webhook", "Polling asíncrono", "Preview + guardado en Storage"] },
      { path: "/panel/ads", name: "Meta Ads", description: "Gestión de campañas en Meta Ads (Facebook/Instagram).", components: ["AdsWizard"], features: ["Creación guiada", "Copy con agentes", "Meta Ads API"] },
      { path: "/panel/planes", name: "Planes", description: "Vista de planes y gestión de suscripción activa.", components: ["PricingPlans", "UpgradeModal"], features: ["Checkout MercadoPago", "Upgrade/downgrade", "Historial de pagos"] },
      { path: "/panel/catalogo", name: "Catálogo", description: "Gestión del catálogo de productos/servicios del cliente.", components: [], features: ["CRUD de productos", "Upload de imágenes", "Contexto en generación de posts"] },
      { path: "/panel/blog", name: "Blog (Panel)", description: "Gestión de artículos SEO generados por agentes.", components: [], features: ["Generación automática con imagen", "Edición antes de publicar"] },
      { path: "/panel/biblioteca", name: "Biblioteca", description: "Repositorio de imágenes, videos y assets generados.", components: [], features: ["Galería con filtros", "Descarga directa", "Reutilización en posts"] },
      { path: "/panel/configuracion", name: "Configuración", description: "Ajustes de cuenta, conexión de redes sociales y preferencias.", components: ["NetworkSwitcher"], features: ["OAuth Meta, LinkedIn, TikTok, Twitter/X, YouTube", "Datos del negocio"] },
    ],
  },
  {
    category: "Panel Administrativo",
    badge: "bg-indigo-50 text-indigo-700 border-indigo-200",
    dot: "bg-indigo-600",
    items: [
      { path: "/admin", name: "Usuarios", description: "Lista completa de usuarios con gestión de planes, estado de cuenta y permisos.", components: ["StatusModal"], features: ["Cambiar plan", "Activar/desactivar cuenta", "Ver uso mensual", "Promover a admin"] },
      { path: "/admin/muestras", name: "Generador de Muestras", description: "Crea demos visuales personalizadas para prospectos: imagen, video, copy y link compartible.", components: [], features: ["Upload logo + foto", "Render Canvas con watermark", "Copy adaptado al plato/producto", "Video image-to-video", "Link /m/[id] por WhatsApp"] },
      { path: "/admin/agenda", name: "Agenda", description: "Gestión del calendario de reuniones con prospectos y clientes.", components: [], features: ["Slots disponibles", "Confirmación por email", "Bloqueo de horarios"] },
      { path: "/admin/agentes", name: "Agentes", description: "Monitor y configuración de los agentes de IA del sistema.", components: [], features: ["Estado de cada agente", "Logs de ejecución", "Config de prompts base"] },
      { path: "/admin/modelos-ia", name: "Modelos IA", description: "Configuración dinámica de modelos en producción sin re-deploy.", components: [], features: ["Cambiar modelo por taskKey", "Test de modelos en vivo", "Fallback chain configurable"] },
      { path: "/admin/logs", name: "Logs de Sistema", description: "Visor de logs con filtros por período: último día, semana o rango de fechas.", components: [], features: ["Filtro por período/estado/cliente", "Stats en tiempo real", "Filas expandibles con detalle"] },
      { path: "/admin/analitica", name: "Analítica Global", description: "Métricas globales de uso de la plataforma.", components: [], features: ["Posts generados por período", "Usuarios activos", "Uso por plan"] },
      { path: "/admin/pagos", name: "Pagos", description: "Historial y gestión de pagos de todos los usuarios.", components: [], features: ["Listado transacciones", "Estado MercadoPago", "Refunds manuales"] },
      { path: "/admin/planes", name: "Planes", description: "Configuración de los planes de suscripción disponibles.", components: [], features: ["CRUD de planes", "Límites por plan", "Seed inicial"] },
      { path: "/admin/whatsapp", name: "WhatsApp Bot", description: "Gestión del bot de WhatsApp para atención a clientes.", components: [], features: ["Conversaciones activas", "Respuestas automáticas", "Monitor de mensajes"] },
      { path: "/admin/workflows", name: "Workflows n8n", description: "Gestión y monitoreo de los flujos de automatización en n8n.", components: [], features: ["Listar workflows activos", "Trigger manual", "Historial de ejecuciones"] },
      { path: "/admin/docs", name: "Documentación ← Aquí", description: "Mapa completo de la app: páginas, componentes, APIs y funcionalidades.", components: [], features: ["Listado de páginas", "Componentes usados", "APIs disponibles", "Arquitectura general"] },
    ],
  },
];

const APIS = [
  {
    group: "IA & Generación",
    badge: "bg-violet-50 text-violet-700 border-violet-200",
    routes: [
      { method: "POST", path: "/api/ai/generate-post", desc: "Post completo (copy + imagen) desde idea." },
      { method: "POST", path: "/api/ai/generate-prompt", desc: "Prompt optimizado para imagen." },
      { method: "POST", path: "/api/ai/copywriter", desc: "3 variantes de copy (PAS, AIDA, HSO)." },
      { method: "POST", path: "/api/ai/prospect-copy", desc: "Copy humanizado para demos de prospectos." },
      { method: "POST", path: "/api/ai/image-to-video", desc: "Proxy a n8n para generación de video asíncrona." },
      { method: "POST", path: "/api/ai/retouch-prompt", desc: "Retoque de imagen con prompt descriptivo." },
      { method: "POST", path: "/api/ai/generate-strategy", desc: "Estrategia mensual de contenido." },
      { method: "POST", path: "/api/ai/analyze-metrics", desc: "Análisis de métricas con insights accionables." },
      { method: "POST", path: "/api/ai/seo-write-now", desc: "Artículo SEO completo." },
      { method: "POST", path: "/api/ai/langgraph", desc: "Agente LangGraph multi-paso para flujos complejos." },
      { method: "POST", path: "/api/ai/improve-idea", desc: "Mejora una idea con sugerencias de los agentes." },
      { method: "POST", path: "/api/ai/banner-text", desc: "Texto para banners y piezas gráficas." },
      { method: "POST", path: "/api/ai/translate-prompt", desc: "Traduce prompt ES→EN para modelos de imagen." },
    ],
  },
  {
    group: "n8n & Webhooks",
    badge: "bg-orange-50 text-orange-700 border-orange-200",
    routes: [
      { method: "POST", path: "/api/n8n/request-image", desc: "Solicita a n8n la generación de imagen con Vertex AI." },
      { method: "POST", path: "/api/n8n/update-image", desc: "n8n notifica que la imagen está lista; actualiza Firestore." },
      { method: "POST", path: "/api/n8n/send-report", desc: "Envía reporte de métricas vía n8n." },
      { method: "POST", path: "/api/n8n/decrypt", desc: "Descifra payload cifrado recibido de n8n." },
    ],
  },
  {
    group: "Publicación en Redes",
    badge: "bg-pink-50 text-pink-700 border-pink-200",
    routes: [
      { method: "POST", path: "/api/publish-now", desc: "Publica un post inmediatamente en la red seleccionada." },
      { method: "POST", path: "/api/publish-story", desc: "Publica una story en Instagram." },
      { method: "POST", path: "/api/tasks/schedule", desc: "Programa post para publicación futura via GCP Tasks." },
      { method: "POST", path: "/api/tasks/execute-post", desc: "Ejecuta publicación de post (llamado por GCP Tasks)." },
      { method: "POST", path: "/api/cron/auto-publish", desc: "Cron job: publica posts programados automáticamente." },
    ],
  },
  {
    group: "Autenticación Social",
    badge: "bg-sky-50 text-sky-700 border-sky-200",
    routes: [
      { method: "GET/POST", path: "/api/auth/meta + /callback + /pages", desc: "OAuth Meta (Facebook/Instagram)." },
      { method: "GET/POST", path: "/api/auth/tiktok + /callback", desc: "OAuth TikTok." },
      { method: "GET/POST", path: "/api/auth/linkedin/pages", desc: "OAuth LinkedIn + lista de páginas." },
      { method: "GET", path: "/api/social-auth/x/redirect + /callback", desc: "OAuth Twitter/X." },
      { method: "GET", path: "/api/social-auth/youtube/redirect + /callback", desc: "OAuth YouTube." },
    ],
  },
  {
    group: "Admin",
    badge: "bg-rose-50 text-rose-700 border-rose-200",
    routes: [
      { method: "GET", path: "/api/admin/users", desc: "Lista todos los usuarios con datos de plan y uso." },
      { method: "POST", path: "/api/admin/users/update", desc: "Actualiza datos de un usuario." },
      { method: "POST", path: "/api/admin/users/status", desc: "Activa o desactiva una cuenta." },
      { method: "GET", path: "/api/admin/analytics", desc: "Métricas globales de la plataforma." },
      { method: "POST", path: "/api/admin/ai-models", desc: "Configura modelos IA por taskKey en Firestore." },
      { method: "POST", path: "/api/admin/ai-models/test", desc: "Prueba un modelo IA en vivo." },
      { method: "GET/POST", path: "/api/admin/whatsapp", desc: "Gestión del bot WhatsApp." },
    ],
  },
  {
    group: "Pagos",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    routes: [
      { method: "POST", path: "/api/payments/create-preference", desc: "Crea preferencia de pago en MercadoPago." },
      { method: "POST", path: "/api/payments/webhook", desc: "Webhook de notificación de pago de MercadoPago." },
      { method: "GET", path: "/api/payments/history", desc: "Historial de pagos del usuario." },
    ],
  },
  {
    group: "Video",
    badge: "bg-teal-50 text-teal-700 border-teal-200",
    routes: [
      { method: "POST", path: "/api/poc/video", desc: "Inicia generación de video POC." },
      { method: "POST", path: "/api/poc/video/render", desc: "Renderiza video con Remotion." },
      { method: "GET", path: "/api/video-proxy", desc: "Proxy para videos externos (evita CORS)." },
    ],
  },
  {
    group: "Otros",
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    routes: [
      { method: "POST", path: "/api/agendar", desc: "Reserva slot de reunión." },
      { method: "POST", path: "/api/contact", desc: "Formulario de contacto público." },
      { method: "POST", path: "/api/analyze-logo", desc: "Analiza un logo con visión IA." },
      { method: "POST", path: "/api/catalogo", desc: "CRUD del catálogo de productos." },
      { method: "POST", path: "/api/track", desc: "Tracking de eventos analytics interno." },
      { method: "POST", path: "/api/whatsapp/webhook", desc: "Webhook principal del bot WhatsApp." },
      { method: "POST", path: "/api/nicho/radar", desc: "Análisis de radar de nicho competitivo." },
      { method: "POST", path: "/api/sync-metrics", desc: "Sincroniza métricas de redes sociales." },
    ],
  },
];

const FIRESTORE_COLLECTIONS = [
  { name: "users", desc: "Usuarios: plan, role, redes OAuth, uso mensual, tokens cifrados.", icon: "👤" },
  { name: "posts", desc: "Posts generados: copy, imageUrl, videoUrl, red social, estado, programación.", icon: "📝" },
  { name: "strategies", desc: "Estrategias de contenido generadas por los agentes.", icon: "🚀" },
  { name: "admin_prospect_demos", desc: "Demos para prospectos: imagen, video, copy, link /m/[id].", icon: "🎨" },
  { name: "preview_renders", desc: "Renders Butterfly Social: textLayers, logoUrl, outputUrl.", icon: "🖼️" },
  { name: "system_config", desc: "Config global: planes, taskKey → modelo IA.", icon: "⚙️" },
  { name: "ai_model_config", desc: "Modelos IA configurables dinámicamente por taskKey.", icon: "🧠" },
  { name: "meetings", desc: "Reuniones agendadas con prospectos.", icon: "📅" },
  { name: "payments", desc: "Historial de pagos y suscripciones.", icon: "💳" },
  { name: "catalogo", desc: "Productos/servicios del catálogo de cada cliente.", icon: "🛍️" },
  { name: "blog_articles", desc: "Artículos SEO generados.", icon: "🌐" },
  { name: "chat_history", desc: "Historial del webchat del landing.", icon: "💬" },
  { name: "whatsapp_conversations", desc: "Conversaciones del bot WhatsApp.", icon: "📱" },
];

const METHOD_COLOR: Record<string, string> = {
  GET: "bg-emerald-50 text-emerald-700 border-emerald-200",
  POST: "bg-blue-50 text-blue-700 border-blue-200",
  "GET/POST": "bg-amber-50 text-amber-700 border-amber-200",
};

type Tab = "resumen" | "paginas" | "apis" | "datos";

export default function AdminDocsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("resumen");
  const [expandedPage, setExpandedPage] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/automatizacion-rrss/panel"); return; }
      if (!ADMIN_EMAILS.includes(user.email ?? "")) { router.push("/automatizacion-rrss/panel"); return; }
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  const tabs: { id: Tab; label: string; emoji: string }[] = [
    { id: "resumen", label: "Resumen", emoji: "🧭" },
    { id: "paginas", label: "Páginas", emoji: "📄" },
    { id: "apis", label: "APIs", emoji: "⚡" },
    { id: "datos", label: "Datos", emoji: "🗄️" },
  ];

  const filteredApis = APIS.map((g) => ({
    ...g,
    routes: g.routes.filter(
      (r) =>
        r.path.toLowerCase().includes(search.toLowerCase()) ||
        r.desc.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((g) => g.routes.length > 0);

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">📚</span>
            <span className="text-[11px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
              Admin · Referencia
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Documentación Interna</h1>
          <p className="text-sm text-slate-500 mt-1">
            Mapa completo de la app — páginas, componentes, APIs y colecciones de datos.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl border border-slate-200">
            v{APP_SUMMARY.version}
          </span>
          <span className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-mono rounded-xl border border-slate-200">
            {APP_SUMMARY.domain}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mt-6 mb-6 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-bold rounded-t-xl border-b-2 transition-all -mb-px ${
              tab === t.id
                ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                : "border-transparent text-slate-400 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      {/* ── RESUMEN ── */}
      {tab === "resumen" && (
        <div className="space-y-8">
          {/* App card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-2xl shrink-0 border border-indigo-100">🚀</div>
              <div className="flex-1">
                <h2 className="text-lg font-black text-slate-900">{APP_SUMMARY.name}</h2>
                <p className="text-sm text-slate-500 mt-1 leading-relaxed">{APP_SUMMARY.description}</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Páginas", value: PAGES.reduce((a, c) => a + c.items.length, 0), emoji: "📄", color: "text-blue-600" },
              { label: "APIs", value: APIS.reduce((a, c) => a + c.routes.length, 0), emoji: "⚡", color: "text-violet-600" },
              { label: "Componentes", value: 46, emoji: "🧩", color: "text-emerald-600" },
              { label: "Colecciones DB", value: FIRESTORE_COLLECTIONS.length, emoji: "🗄️", color: "text-orange-600" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">{s.label}</p>
                  <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.value}</p>
                </div>
                <span className="text-3xl opacity-60">{s.emoji}</span>
              </div>
            ))}
          </div>

          {/* Stack */}
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">Stack Tecnológico</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {APP_SUMMARY.stack.map((s) => (
                <div key={s.label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{s.label}</p>
                  <p className="text-sm text-slate-700 font-medium mt-1">{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Agentes */}
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">Agentes Especializados</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { name: "agent-copy.ts", desc: "Copywriter principal. Vertex AI + fallback Gemini Free." },
                { name: "agent-image.ts", desc: "Genera imágenes via Vertex AI." },
                { name: "agent-reel.ts", desc: "Guiones y estructuras para Reels de Instagram." },
                { name: "agent-video-premium.ts", desc: "Generación de video asíncrona con polling a n8n." },
                { name: "agent-banner-copy.ts", desc: "Copy para banners y piezas publicitarias." },
                { name: "agent-product-vision.ts", desc: "Analiza productos para contextualizar el contenido." },
                { name: "langgraph-agent.ts", desc: "Orquestación multi-agente con LangGraph." },
                { name: "langgraph-strategy.ts", desc: "Agente de estrategia de contenido mensual." },
              ].map((a) => (
                <div key={a.name} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex gap-3 items-start">
                  <span className="text-lg mt-0.5">🤖</span>
                  <div>
                    <p className="text-xs font-mono font-black text-indigo-600">{a.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{a.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* n8n webhooks */}
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">Webhooks n8n Externos</p>
            <div className="space-y-3">
              {[
                { url: "https://n8n.santisoft.cl/webhook/generate-image", desc: "Genera imagen con Vertex AI + retoque. Llamado por /api/n8n/request-image." },
                { url: "https://n8n.santisoft.cl/webhook/image-to-video", desc: "Genera video desde imagen con IA. Polling asíncrono vía /api/ai/image-to-video." },
              ].map((w) => (
                <div key={w.url} className="bg-white rounded-xl border border-orange-200 p-4">
                  <code className="text-xs font-mono text-orange-600 font-bold">{w.url}</code>
                  <p className="text-xs text-slate-500 mt-1">{w.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PÁGINAS ── */}
      {tab === "paginas" && (
        <div className="space-y-8">
          {PAGES.map((category) => (
            <div key={category.category}>
              <div className="flex items-center gap-2 mb-4">
                <span className={`w-2 h-2 rounded-full ${category.dot}`} />
                <span className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-bold ${category.badge}`}>
                  {category.category}
                </span>
                <span className="text-xs text-slate-400 font-medium">{category.items.length} páginas</span>
              </div>
              <div className="space-y-2">
                {category.items.map((page) => {
                  const isExpanded = expandedPage === page.path;
                  return (
                    <div key={page.path} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <button
                        className="w-full text-left px-5 py-4 flex items-start justify-between gap-4 hover:bg-slate-50/80 transition-colors"
                        onClick={() => setExpandedPage(isExpanded ? null : page.path)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <code className="text-xs bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg text-indigo-600 font-mono font-bold">
                              {page.path}
                            </code>
                            <span className="text-sm font-bold text-slate-800">{page.name}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">{page.description}</p>
                        </div>
                        <span className="text-slate-400 shrink-0 mt-1 text-xs">{isExpanded ? "▲" : "▼"}</span>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-slate-100 bg-slate-50/40 px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {page.components.length > 0 && (
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">🧩 Componentes</p>
                              <div className="flex flex-wrap gap-1.5">
                                {page.components.map((c) => (
                                  <span key={c} className="px-2 py-0.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 font-mono font-bold">
                                    {c}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {page.features.length > 0 && (
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">✨ Funcionalidades</p>
                              <ul className="space-y-1">
                                {page.features.map((f) => (
                                  <li key={f} className="text-xs text-slate-600 flex gap-1.5 items-start">
                                    <span className="text-emerald-500 shrink-0 font-bold">✓</span>
                                    {f}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── APIs ── */}
      {tab === "apis" && (
        <div className="space-y-6">
          {/* Search */}
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Buscar endpoint o descripción..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm"
            />
          </div>

          {filteredApis.map((group) => (
            <div key={group.group}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex px-2.5 py-1 rounded-full border text-xs font-bold ${group.badge}`}>
                  {group.group}
                </span>
                <span className="text-xs text-slate-400">{group.routes.length} endpoints</span>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
                {group.routes.map((r) => (
                  <div key={r.path} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50/60 transition-colors">
                    <span className={`px-1.5 py-0.5 rounded border text-[10px] font-black shrink-0 mt-0.5 ${METHOD_COLOR[r.method] ?? "bg-slate-100 text-slate-600 border-slate-200"}`}>
                      {r.method}
                    </span>
                    <div className="flex-1 min-w-0">
                      <code className="text-xs text-indigo-600 font-mono font-bold">{r.path}</code>
                      <p className="text-xs text-slate-500 mt-0.5">{r.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── DATOS ── */}
      {tab === "datos" && (
        <div className="space-y-6">
          {/* Firestore */}
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">Colecciones Firestore</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FIRESTORE_COLLECTIONS.map((col) => (
                <div key={col.name} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex gap-3 items-start">
                  <span className="text-xl mt-0.5">{col.icon}</span>
                  <div>
                    <p className="text-xs font-mono font-black text-orange-600">{col.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{col.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Storage */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">Firebase Storage — Rutas</p>
            <div className="space-y-2">
              {[
                "posts/{userId}/{postId}/image.{ext}",
                "posts/{userId}/{postId}/video.mp4",
                "muestras/{demoId}/imagen.png",
                "muestras/{demoId}/video.mp4",
                "renders/{renderId}/preview.png",
                "logos/{userId}/logo.{ext}",
                "blog/{articleId}/cover.png",
                "catalogo/{userId}/{productId}/image.{ext}",
                "audio/{userId}/{postId}/voiceover.mp3",
              ].map((p) => (
                <div key={p} className="flex items-center gap-2.5 py-1.5 border-b border-slate-100 last:border-0">
                  <span className="text-slate-400 text-sm">📁</span>
                  <code className="text-xs font-mono text-indigo-600 font-bold">{p}</code>
                </div>
              ))}
            </div>
          </div>

          {/* n8n Webhooks */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4">Webhooks n8n Externos</p>
            <div className="space-y-3">
              {[
                { url: "https://n8n.santisoft.cl/webhook/generate-image", desc: "Genera imagen con Vertex AI + retoque. Llamado por /api/n8n/request-image." },
                { url: "https://n8n.santisoft.cl/webhook/image-to-video", desc: "Genera video desde imagen con IA. Polling asíncrono vía /api/ai/image-to-video." },
              ].map((w) => (
                <div key={w.url} className="rounded-xl border border-orange-200 bg-orange-50/50 p-4">
                  <code className="text-xs font-mono text-orange-700 font-bold">{w.url}</code>
                  <p className="text-xs text-slate-600 mt-1">{w.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
