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
  // ── PÚBLICAS ──────────────────────────────────────────────────────────────
  {
    category: "Páginas Públicas",
    color: "emerald",
    items: [
      {
        path: "/",
        name: "Landing Page",
        description: "Página principal de marketing: propuesta de valor, planes, testimonios, formulario de contacto y chat bot.",
        components: ["HeroSection", "PricingPlans", "TestimonialsSection", "DemoForm", "WebChatWidget", "BrandHeader", "BrandFooter", "DotCanvas"],
        features: ["Tour interactivo con InternalTour", "Sección WhatsApp bot", "Promo modal", "Dark mode toggle"],
      },
      {
        path: "/login",
        name: "Login",
        description: "Autenticación con Google OAuth vía Firebase Auth.",
        components: ["SantisoftLogo", "PageTracker"],
        features: ["Sign-in con Google", "Redirección post-login al panel"],
      },
      {
        path: "/registro",
        name: "Registro",
        description: "Flujo de creación de cuenta con email/password + Google.",
        components: ["SantisoftLogo"],
        features: ["Creación de usuario en Firestore", "Redirección a onboarding"],
      },
      {
        path: "/onboarding",
        name: "Onboarding",
        description: "Wizard de configuración inicial de cuenta: rubro, nombre del negocio, redes sociales objetivo.",
        components: ["SantisoftLogo", "NetworkSwitcher"],
        features: ["Multi-paso", "Guardado en Firestore users collection"],
      },
      {
        path: "/agendar",
        name: "Agendar Reunión",
        description: "Formulario público para agendar reunión con el equipo Santisoft.",
        components: ["ContactForm", "BrandHeader"],
        features: ["Selección de fecha/hora", "Bloqueo de horarios ocupados", "Confirmación por email"],
      },
      {
        path: "/m/[id]",
        name: "Demo Pública para Prospecto",
        description: "Página de propuesta comercial personalizada generada por el Generador de Muestras. Muestra imagen, video y copy para el prospecto.",
        components: [],
        features: ["Imagen con watermark", "Video preview", "Copy sugerido para redes con 1-click copy", "Beneficios Santisoft", "CTA a WhatsApp", "Badge del plato/producto"],
      },
      {
        path: "/render/preview",
        name: "Preview de Render (Butterfly Social)",
        description: "Endpoint visual que Butterfly Social usa para renderizar diseños de posts.",
        components: [],
        features: ["Recibe textLayers, logoUrl vía query params", "Watermark Santisoft", "Full-bleed 1080×1080"],
      },
      {
        path: "/brochure",
        name: "Brochure Corporativo",
        description: "Página estática de brochure descargable como PDF.",
        components: ["BrandHeader", "BrandFooter"],
        features: ["Exportación PDF con html2canvas"],
      },
      {
        path: "/blog",
        name: "Blog Público",
        description: "Listado de artículos SEO generados automáticamente.",
        components: ["BrandHeader", "BrandFooter"],
        features: ["Paginación", "Filtro por categoría"],
      },
      {
        path: "/blog/[slug]",
        name: "Artículo de Blog",
        description: "Página individual de artículo con contenido SEO generado por agentes.",
        components: ["BrandHeader", "BrandFooter"],
        features: ["Schema SEO", "CTA integrado", "Imagen de portada generada por IA"],
      },
      {
        path: "/confirmar-plan",
        name: "Confirmar Plan",
        description: "Página de éxito después de completar un pago.",
        components: ["SantisoftLogo"],
        features: ["Actualización de plan en Firestore", "Redirección al panel"],
      },
      {
        path: "/privacidad / /terminos",
        name: "Legales",
        description: "Políticas de privacidad y términos de servicio (ES + EN).",
        components: ["BrandHeader", "BrandFooter"],
        features: ["Bilingüe (es/en)"],
      },
    ],
  },
  // ── PANEL USUARIO ──────────────────────────────────────────────────────────
  {
    category: "Panel de Usuario",
    color: "blue",
    items: [
      {
        path: "/automatizacion-rrss/panel",
        name: "Dashboard Principal",
        description: "Vista central del usuario: posts recientes, métricas rápidas, accesos directos a todas las secciones.",
        components: ["DashboardHeader", "PostCard", "PostGrid", "PostFilters", "BulkActionBar", "DashboardCarouselViewer", "NetworkIcon", "NetworkSwitcher"],
        features: ["Lista de posts publicados y borradores", "Filtros por red social", "Acciones en lote (publicar, eliminar)", "Vista de carrusel"],
      },
      {
        path: "/automatizacion-rrss/panel/crear",
        name: "Crear Contenido",
        description: "Generador principal de posts: wizard multi-paso con IA para elegir estilo, red social, copy e imagen.",
        components: ["PostConfigForm", "CanvasEditor", "AIOptionsModal", "GeneratingModal", "PromptStylePickerModal", "PreferredStylesModal", "CarouselWizard", "PosterSection", "TikTokPostSettings"],
        features: [
          "Generación de copy con agentes (PAS / AIDA / HSO)",
          "Generación de imagen con Vertex AI / Stable Diffusion",
          "Canvas editor client-side",
          "Estilos visuales predefinidos (HARDCODED_STYLES)",
          "Carrusel multi-slide",
          "Retoque de imagen con prompts",
          "Traducción automática de prompts",
          "Publicación directa o programada",
        ],
      },
      {
        path: "/automatizacion-rrss/panel/estrategia",
        name: "Estrategia de Contenido",
        description: "Generación automática de estrategia mensual/semanal de publicaciones con LangGraph.",
        components: ["PromptStyleSelector"],
        features: ["Análisis de rubro y audiencia", "Calendario de contenido sugerido", "Generación de ideas por nicho"],
      },
      {
        path: "/automatizacion-rrss/panel/radar",
        name: "Radar de Nicho",
        description: "Análisis competitivo y de tendencias del nicho del cliente.",
        components: [],
        features: ["Tendencias actuales por rubro", "Análisis de competencia", "Sugerencias de ángulos de contenido"],
      },
      {
        path: "/automatizacion-rrss/panel/metricas",
        name: "Métricas",
        description: "Dashboard de analytics: alcance, impresiones, engagement por red social.",
        components: ["ReporteAnalyticsPDF"],
        features: ["Gráficos interactivos con Recharts", "Exportación a PDF", "Sincronización con Meta / LinkedIn API"],
      },
      {
        path: "/automatizacion-rrss/panel/prompts",
        name: "Biblioteca de Prompts",
        description: "Colección de prompts guardados y plantillas de imágenes reutilizables.",
        components: [],
        features: ["CRUD de prompts personalizados", "Categorización por tipo de contenido"],
      },
      {
        path: "/automatizacion-rrss/panel/biblioteca",
        name: "Biblioteca de Contenido",
        description: "Repositorio de imágenes, videos y assets generados por el usuario.",
        components: [],
        features: ["Galería con filtros", "Descarga directa", "Reutilización en nuevos posts"],
      },
      {
        path: "/automatizacion-rrss/panel/publicados",
        name: "Posts Publicados",
        description: "Historial completo de contenido publicado en todas las redes conectadas.",
        components: ["PostCard", "PostDetailModal", "PublishResultModal", "RescheduleModal", "StoryFormatModal"],
        features: ["Vista detallada de cada post", "Reprogramar", "Ver métricas individuales"],
      },
      {
        path: "/automatizacion-rrss/panel/catalogo",
        name: "Catálogo de Productos",
        description: "Gestión del catálogo de productos o servicios del cliente para contextualizar el contenido.",
        components: [],
        features: ["CRUD de productos", "Upload de imágenes", "Uso como contexto en generación de posts"],
      },
      {
        path: "/automatizacion-rrss/panel/blog",
        name: "Blog (Panel)",
        description: "Gestión de artículos de blog SEO generados por agentes.",
        components: [],
        features: ["Generación automática de artículo con imagen", "Publicación directa", "Edición antes de publicar"],
      },
      {
        path: "/automatizacion-rrss/panel/ads",
        name: "Meta Ads",
        description: "Módulo de gestión de campañas en Meta Ads (Facebook/Instagram).",
        components: ["AdsWizard"],
        features: ["Creación de campaña guiada", "Selección de audiencia", "Copy generado por IA", "Conexión con Meta Ads API"],
      },
      {
        path: "/automatizacion-rrss/panel/planes",
        name: "Planes y Suscripciones",
        description: "Vista de planes disponibles y gestión de suscripción activa.",
        components: ["PricingPlans", "UpgradeModal"],
        features: ["Checkout con MercadoPago", "Upgrade/downgrade de plan", "Historial de pagos"],
      },
      {
        path: "/automatizacion-rrss/panel/configuracion",
        name: "Configuración",
        description: "Ajustes de cuenta, conexión de redes sociales y preferencias del sistema.",
        components: ["NetworkSwitcher"],
        features: ["OAuth Meta, LinkedIn, TikTok, Twitter/X, YouTube", "Datos del negocio", "Preferencias de estilo de contenido"],
      },
      {
        path: "/automatizacion-rrss/panel/mi-perfil",
        name: "Mi Perfil",
        description: "Gestión del perfil de usuario, foto, nombre y datos personales.",
        components: [],
        features: ["Edición de nombre/foto", "Cambio de contraseña", "Vista de plan activo"],
      },
      {
        path: "/automatizacion-rrss/panel/poc-video",
        name: "POC Image-to-Video",
        description: "Laboratorio de generación de video: Remotion (programático) vs. n8n Webhook (image-to-video con IA).",
        components: ["RemotionReelPlayer"],
        features: [
          "Switch ⚡ Remotion / ✨ n8n Webhook",
          "Selección de imagen y estilo de video",
          "Generación asíncrona con polling",
          "Preview del video generado",
          "Guardado en Firebase Storage",
        ],
      },
    ],
  },
  // ── PANEL ADMIN ────────────────────────────────────────────────────────────
  {
    category: "Panel Administrativo",
    color: "purple",
    items: [
      {
        path: "/automatizacion-rrss/panel/admin",
        name: "Admin — Usuarios",
        description: "Lista completa de usuarios con gestión de planes, estado de cuenta y permisos.",
        components: ["StatusModal"],
        features: ["Cambiar plan de usuario", "Activar/desactivar cuenta", "Ver uso mensual", "Promover a admin"],
      },
      {
        path: "/automatizacion-rrss/panel/admin/muestras",
        name: "Generador de Muestras para Prospectos",
        description: "Crea demos visuales personalizadas para prospectos: genera imagen con logo + watermark Santisoft, video, copy para redes sociales y link público compartible.",
        components: [],
        features: [
          "Upload de logo y foto del cliente",
          "Campo de rubro, oferta y nombre del plato/producto",
          "Retoque de imagen con prompts IA",
          "Render Canvas client-side (1080×1080) con watermark",
          "Render Butterfly Social con textLayers",
          "Generación de copy adaptado al plato/producto (3 frameworks: PAS/AIDA/HSO)",
          "Generación de video via n8n webhook (image-to-video)",
          "Guardado en Firestore admin_prospect_demos",
          "Link público /m/[id] compartible por WhatsApp",
          "Historial de demos con acceso a links",
        ],
      },
      {
        path: "/automatizacion-rrss/panel/admin/estrategias",
        name: "Admin — Estrategias",
        description: "Supervisión y gestión de estrategias generadas para todos los usuarios.",
        components: [],
        features: ["Listado por usuario", "Edición y aprobación de estrategias", "Estadísticas globales"],
      },
      {
        path: "/automatizacion-rrss/panel/admin/agenda",
        name: "Admin — Agenda",
        description: "Gestión del calendario de reuniones con prospectos y clientes.",
        components: [],
        features: ["Vista de slots disponibles", "Confirmación de reservas", "Envío de confirmación por email", "Bloqueo de horarios"],
      },
      {
        path: "/automatizacion-rrss/panel/admin/agentes",
        name: "Admin — Agentes",
        description: "Monitor y configuración de los agentes de IA del sistema.",
        components: [],
        features: ["Estado de cada agente", "Logs de ejecución", "Configuración de prompts base"],
      },
      {
        path: "/automatizacion-rrss/panel/admin/analitica",
        name: "Admin — Analítica Global",
        description: "Dashboard de métricas globales de uso de la plataforma.",
        components: [],
        features: ["Posts generados por período", "Usuarios activos", "Uso por plan", "Errores de publicación"],
      },
      {
        path: "/automatizacion-rrss/panel/admin/logs",
        name: "Admin — Logs",
        description: "Visor de logs del sistema: webhooks, publicaciones, errores de API.",
        components: [],
        features: ["Filtro por tipo de evento", "Búsqueda por usuario", "Exportación de logs"],
      },
      {
        path: "/automatizacion-rrss/panel/admin/modelos-ia",
        name: "Admin — Modelos IA",
        description: "Configuración dinámica de los modelos de IA en producción sin re-deploy.",
        components: [],
        features: ["Cambiar modelo por taskKey desde Firestore", "Test de modelos en vivo", "Fallback chain configurable"],
      },
      {
        path: "/automatizacion-rrss/panel/admin/monitoreo",
        name: "Admin — Monitoreo",
        description: "Panel de salud del sistema: APIs conectadas, webhooks n8n, quota de modelos IA.",
        components: [],
        features: ["Status de n8n webhooks", "Quota Gemini", "Alertas de error"],
      },
      {
        path: "/automatizacion-rrss/panel/admin/pagos",
        name: "Admin — Pagos",
        description: "Historial y gestión de pagos de todos los usuarios.",
        components: [],
        features: ["Listado de transacciones", "Estado MercadoPago", "Refunds manuales"],
      },
      {
        path: "/automatizacion-rrss/panel/admin/planes",
        name: "Admin — Planes",
        description: "Configuración de los planes de suscripción disponibles.",
        components: [],
        features: ["CRUD de planes", "Definir límites por plan (posts/mes, redes sociales)", "Seed inicial de planes"],
      },
      {
        path: "/automatizacion-rrss/panel/admin/whatsapp",
        name: "Admin — WhatsApp Bot",
        description: "Gestión del bot de WhatsApp para atención a clientes y prospectos.",
        components: [],
        features: ["Ver conversaciones activas", "Configurar respuestas automáticas", "Monitor de mensajes"],
      },
      {
        path: "/automatizacion-rrss/panel/admin/workflows",
        name: "Admin — Workflows n8n",
        description: "Gestión y monitoreo de los flujos de automatización en n8n.",
        components: [],
        features: ["Listar workflows activos", "Trigger manual de workflows", "Ver historial de ejecuciones"],
      },
      {
        path: "/automatizacion-rrss/panel/admin/test-video",
        name: "Admin — Test Video",
        description: "Entorno de pruebas para el pipeline de generación de video.",
        components: [],
        features: ["Test del webhook image-to-video", "Test del render con Remotion", "Diagnóstico de errores"],
      },
      {
        path: "/automatizacion-rrss/panel/admin/docs",
        name: "Admin — Documentación Interna ← Estás aquí",
        description: "Esta página. Mapa completo de la app: páginas, componentes, APIs y funcionalidades.",
        components: [],
        features: ["Listado de todas las páginas", "Componentes utilizados", "APIs disponibles", "Resumen de arquitectura"],
      },
    ],
  },
];

const APIS = [
  {
    group: "IA & Generación de Contenido",
    color: "violet",
    routes: [
      { method: "POST", path: "/api/ai/generate-post", desc: "Genera un post completo (copy + imagen) a partir de una idea y configuración." },
      { method: "POST", path: "/api/ai/generate-prompt", desc: "Crea un prompt optimizado para generación de imagen a partir de una idea textual." },
      { method: "POST", path: "/api/ai/generate-from-prompt", desc: "Genera imagen a partir de un prompt ya elaborado." },
      { method: "POST", path: "/api/ai/generate-preview", desc: "Genera una preview rápida de imagen para validación." },
      { method: "POST", path: "/api/ai/improve-idea", desc: "Mejora una idea de contenido con sugerencias de los agentes." },
      { method: "POST", path: "/api/ai/format-prompt", desc: "Da formato profesional a un prompt antes de enviarlo al modelo de imagen." },
      { method: "POST", path: "/api/ai/review-prompt", desc: "Revisa y optimiza un prompt existente." },
      { method: "POST", path: "/api/ai/translate-prompt", desc: "Traduce prompt de ES a EN para modelos de imagen." },
      { method: "POST", path: "/api/ai/translate", desc: "Traducción general de texto." },
      { method: "POST", path: "/api/ai/retouch-prompt", desc: "Retoca una imagen existente aplicando un prompt descriptivo." },
      { method: "POST", path: "/api/ai/copywriter", desc: "Genera 3 variantes de copy (PAS, AIDA, HSO) para un post." },
      { method: "POST", path: "/api/ai/prospect-copy", desc: "Genera copy humanizado adaptado al plato/producto del prospecto para el Generador de Muestras." },
      { method: "POST", path: "/api/ai/banner-text", desc: "Genera texto para banners y piezas gráficas." },
      { method: "POST", path: "/api/ai/generate-strategy", desc: "Genera estrategia mensual de contenido para un rubro." },
      { method: "POST", path: "/api/ai/analyze-metrics", desc: "Analiza métricas y genera insights accionables." },
      { method: "POST", path: "/api/ai/image-to-video", desc: "Proxy al webhook n8n para generación asíncrona de video desde imagen." },
      { method: "POST", path: "/api/ai/langgraph", desc: "Endpoint del agente LangGraph multi-paso para flujos complejos." },
      { method: "POST", path: "/api/ai/demo-generate", desc: "Genera demo completa para prospectos (imagen + copy)." },
      { method: "POST", path: "/api/ai/seo-strategy", desc: "Genera estrategia SEO para el blog del cliente." },
      { method: "POST", path: "/api/ai/seo-write-now", desc: "Escribe un artículo SEO completo." },
      { method: "POST", path: "/api/ai/seo-generate-image", desc: "Genera imagen de portada para artículo de blog." },
      { method: "POST", path: "/api/ai/seo-publish", desc: "Publica artículo SEO generado." },
      { method: "POST", path: "/api/ai/scrape-seo-brain", desc: "Extrae información SEO de una URL para contextualizar el contenido." },
    ],
  },
  {
    group: "n8n & Webhooks",
    color: "orange",
    routes: [
      { method: "POST", path: "/api/n8n/request-image", desc: "Solicita a n8n la generación de imagen con Vertex AI." },
      { method: "POST", path: "/api/n8n/update-image", desc: "n8n notifica que la imagen está lista; actualiza Firestore." },
      { method: "POST", path: "/api/n8n/send-report", desc: "Envía reporte de métricas vía n8n." },
      { method: "POST", path: "/api/n8n/decrypt", desc: "Descifra payload cifrado recibido de n8n." },
    ],
  },
  {
    group: "Publicación en Redes Sociales",
    color: "pink",
    routes: [
      { method: "POST", path: "/api/publish-now", desc: "Publica un post inmediatamente en la red social seleccionada." },
      { method: "POST", path: "/api/publish-story", desc: "Publica una story en Instagram." },
      { method: "POST", path: "/api/tasks/schedule", desc: "Programa un post para publicación futura via GCP Tasks." },
      { method: "POST", path: "/api/tasks/execute-post", desc: "Ejecuta publicación de post (llamado por GCP Tasks)." },
      { method: "POST", path: "/api/tasks/execute-blog", desc: "Ejecuta publicación de blog (llamado por GCP Tasks)." },
      { method: "POST", path: "/api/trigger-posts", desc: "Dispara múltiples publicaciones en batch." },
      { method: "GET", path: "/api/trigger-posts/status", desc: "Estado del batch de publicaciones." },
      { method: "POST", path: "/api/cron/auto-publish", desc: "Cron job: publica posts programados automáticamente." },
    ],
  },
  {
    group: "Autenticación Social",
    color: "sky",
    routes: [
      { method: "GET/POST", path: "/api/auth/meta", desc: "OAuth Meta (Facebook/Instagram)." },
      { method: "GET", path: "/api/auth/meta/callback", desc: "Callback OAuth de Meta." },
      { method: "GET", path: "/api/auth/meta/pages", desc: "Lista páginas de Facebook del usuario." },
      { method: "POST", path: "/api/auth/meta/deletion", desc: "Webhook de eliminación de datos Meta (requerido por Meta)." },
      { method: "GET/POST", path: "/api/auth/tiktok", desc: "OAuth TikTok." },
      { method: "GET", path: "/api/auth/tiktok/callback", desc: "Callback OAuth TikTok." },
      { method: "GET/POST", path: "/api/auth/linkedin/pages", desc: "OAuth LinkedIn + lista de páginas." },
      { method: "GET/POST", path: "/api/auth/google-business", desc: "OAuth Google Business Profile." },
      { method: "GET", path: "/api/social-auth/x/redirect", desc: "OAuth Twitter/X — redirect." },
      { method: "GET", path: "/api/social-auth/x/callback", desc: "OAuth Twitter/X — callback." },
      { method: "GET", path: "/api/social-auth/youtube/redirect", desc: "OAuth YouTube." },
      { method: "GET", path: "/api/social-auth/youtube/callback", desc: "Callback OAuth YouTube." },
    ],
  },
  {
    group: "Admin",
    color: "red",
    routes: [
      { method: "GET", path: "/api/admin/users", desc: "Lista todos los usuarios con datos de plan y uso." },
      { method: "POST", path: "/api/admin/users/update", desc: "Actualiza datos de un usuario." },
      { method: "POST", path: "/api/admin/users/status", desc: "Activa o desactiva una cuenta." },
      { method: "GET/POST", path: "/api/admin/plans", desc: "CRUD de planes de suscripción." },
      { method: "GET", path: "/api/admin/analytics", desc: "Métricas globales de la plataforma." },
      { method: "GET", path: "/api/admin/payments", desc: "Historial de pagos de todos los usuarios." },
      { method: "GET/POST", path: "/api/admin/strategies", desc: "Gestión de estrategias de todos los usuarios." },
      { method: "POST", path: "/api/admin/ai-models", desc: "Configura modelos IA por taskKey en Firestore." },
      { method: "POST", path: "/api/admin/ai-models/test", desc: "Prueba un modelo IA en vivo." },
      { method: "GET/POST", path: "/api/admin/whatsapp", desc: "Gestión del bot WhatsApp." },
      { method: "POST", path: "/api/admin/n8n-test", desc: "Test de conectividad con n8n." },
    ],
  },
  {
    group: "Pagos",
    color: "yellow",
    routes: [
      { method: "POST", path: "/api/payments/create-preference", desc: "Crea preferencia de pago en MercadoPago." },
      { method: "POST", path: "/api/payments/webhook", desc: "Webhook de notificación de pago de MercadoPago." },
      { method: "GET", path: "/api/payments/history", desc: "Historial de pagos del usuario." },
    ],
  },
  {
    group: "Video",
    color: "teal",
    routes: [
      { method: "POST", path: "/api/poc/video", desc: "Inicia generación de video POC." },
      { method: "POST", path: "/api/poc/video/render", desc: "Renderiza video con Remotion." },
      { method: "POST", path: "/api/poc/video/generate-copies", desc: "Genera copies para las slides del video." },
      { method: "GET", path: "/api/video-proxy", desc: "Proxy para videos externos (evita CORS)." },
    ],
  },
  {
    group: "Otros",
    color: "gray",
    routes: [
      { method: "POST", path: "/api/agendar", desc: "Reserva slot de reunión." },
      { method: "GET", path: "/api/agendar/blocked-slots", desc: "Obtiene slots bloqueados del calendario." },
      { method: "POST", path: "/api/contact", desc: "Formulario de contacto público." },
      { method: "POST", path: "/api/analyze-logo", desc: "Analiza un logo con visión IA." },
      { method: "POST", path: "/api/brand/extract-identity", desc: "Extrae identidad de marca desde URL o descripción." },
      { method: "POST", path: "/api/catalogo", desc: "CRUD del catálogo de productos." },
      { method: "POST", path: "/api/track", desc: "Tracking de eventos de analytics interno." },
      { method: "POST", path: "/api/bh", desc: "Endpoint de B&H skills (reels, stories, guiones)." },
      { method: "POST", path: "/api/whatsapp/webhook", desc: "Webhook principal del bot WhatsApp." },
      { method: "POST", path: "/api/whatsapp/bot-action", desc: "Ejecuta acción del bot WhatsApp." },
      { method: "POST", path: "/api/generate-pdf", desc: "Genera PDF de reporte o brochure." },
      { method: "POST", path: "/api/webchat", desc: "Endpoint del widget de chat en landing page." },
      { method: "POST", path: "/api/nicho/radar", desc: "Análisis de radar de nicho competitivo." },
      { method: "POST", path: "/api/sync-metrics", desc: "Sincroniza métricas de redes sociales." },
    ],
  },
];

const FIRESTORE_COLLECTIONS = [
  { name: "users", desc: "Usuarios registrados: plan, role, redes conectadas, uso mensual, tokens OAuth." },
  { name: "posts", desc: "Posts generados: copy, imageUrl, videoUrl, red social, estado, programación." },
  { name: "strategies", desc: "Estrategias de contenido generadas por los agentes." },
  { name: "admin_prospect_demos", desc: "Demos generadas en el Generador de Muestras: imagen, video, copy, link público." },
  { name: "preview_renders", desc: "Renders de Butterfly Social: textLayers, logoUrl, outputUrl." },
  { name: "system_config", desc: "Configuración global: planes, modelos IA por taskKey, cuotas." },
  { name: "ai_model_config", desc: "Configuración dinámica de modelos por taskKey." },
  { name: "meetings", desc: "Reuniones agendadas con prospectos." },
  { name: "payments", desc: "Historial de pagos y suscripciones." },
  { name: "catalogo", desc: "Productos/servicios del catálogo de cada cliente." },
  { name: "blog_articles", desc: "Artículos de blog SEO generados." },
  { name: "chat_history", desc: "Historial del webchat del landing." },
  { name: "whatsapp_conversations", desc: "Conversaciones del bot WhatsApp." },
];

// ─── COMPONENT ───────────────────────────────────────────────────────────────

type Tab = "resumen" | "paginas" | "apis" | "datos";

const COLOR_MAP: Record<string, string> = {
  emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  blue: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  purple: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  violet: "bg-violet-500/10 text-violet-400 border-violet-500/30",
  orange: "bg-orange-500/10 text-orange-400 border-orange-500/30",
  pink: "bg-pink-500/10 text-pink-400 border-pink-500/30",
  sky: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  red: "bg-red-500/10 text-red-400 border-red-500/30",
  yellow: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  teal: "bg-teal-500/10 text-teal-400 border-teal-500/30",
  gray: "bg-gray-500/10 text-gray-400 border-gray-500/30",
};

const METHOD_COLOR: Record<string, string> = {
  GET: "bg-green-500/20 text-green-400",
  POST: "bg-blue-500/20 text-blue-400",
  "GET/POST": "bg-yellow-500/20 text-yellow-400",
};

export default function AdminDocsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("resumen");
  const [expandedPage, setExpandedPage] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/automatizacion-rrss/panel");
        return;
      }
      if (!ADMIN_EMAILS.includes(user.email ?? "")) {
        router.push("/automatizacion-rrss/panel");
        return;
      }
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tabs: { id: Tab; label: string; emoji: string }[] = [
    { id: "resumen", label: "Resumen", emoji: "🧭" },
    { id: "paginas", label: "Páginas", emoji: "📄" },
    { id: "apis", label: "APIs", emoji: "⚡" },
    { id: "datos", label: "Datos", emoji: "🗄️" },
  ];

  // Filter APIs by search
  const filteredApis = APIS.map((g) => ({
    ...g,
    routes: g.routes.filter(
      (r) =>
        r.path.toLowerCase().includes(search.toLowerCase()) ||
        r.desc.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((g) => g.routes.length > 0);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📚</span>
            <div>
              <h1 className="text-lg font-bold text-white leading-none">Documentación Interna</h1>
              <p className="text-xs text-gray-400 mt-0.5">Santisoft Automatización · v{APP_SUMMARY.version}</p>
            </div>
          </div>
          <Link
            href="/automatizacion-rrss/panel/admin"
            className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1.5"
          >
            ← Volver al Admin
          </Link>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-6 flex gap-1 pb-0">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-all ${
                tab === t.id
                  ? "border-purple-500 text-white bg-purple-500/10"
                  : "border-transparent text-gray-400 hover:text-gray-200"
              }`}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* ── RESUMEN ── */}
        {tab === "resumen" && (
          <div className="space-y-8">
            {/* App card */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center text-2xl shrink-0">🚀</div>
                <div>
                  <h2 className="text-xl font-bold text-white">{APP_SUMMARY.name}</h2>
                  <p className="text-gray-400 mt-1 leading-relaxed">{APP_SUMMARY.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-300">
                      🌐 {APP_SUMMARY.domain}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-800 rounded text-xs text-gray-300">
                      v{APP_SUMMARY.version}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stack */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Stack Tecnológico</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {APP_SUMMARY.stack.map((s) => (
                  <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <p className="text-xs font-semibold text-purple-400 uppercase tracking-wider">{s.label}</p>
                    <p className="text-sm text-gray-200 mt-1">{s.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats rápidas */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Estadísticas del Proyecto</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Páginas", value: PAGES.reduce((a, c) => a + c.items.length, 0), emoji: "📄" },
                  { label: "APIs", value: APIS.reduce((a, c) => a + c.routes.length, 0), emoji: "⚡" },
                  { label: "Componentes", value: 46, emoji: "🧩" },
                  { label: "Librerías", value: FIRESTORE_COLLECTIONS.length, emoji: "🗄️" },
                ].map((s) => (
                  <div key={s.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-white">{s.emoji} {s.value}</p>
                    <p className="text-sm text-gray-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Agentes clave */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Agentes Especializados</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { name: "agent-copy.ts", desc: "Copywriter principal. Genera copy con Vertex AI + fallback Gemini Free." },
                  { name: "agent-image.ts", desc: "Genera imágenes via Vertex AI o modelos de imagen." },
                  { name: "agent-reel.ts", desc: "Guiones y estructuras para Reels de Instagram." },
                  { name: "agent-video-premium.ts", desc: "Generación de video asíncrona con polling a n8n webhook." },
                  { name: "agent-banner-copy.ts", desc: "Copy para banners y piezas publicitarias." },
                  { name: "agent-product-vision.ts", desc: "Analiza productos/servicios para contextualizar el contenido." },
                  { name: "langgraph-agent.ts", desc: "Orquestación multi-agente con LangGraph para flujos complejos." },
                  { name: "langgraph-strategy.ts", desc: "Agente de estrategia de contenido mensual con LangGraph." },
                ].map((a) => (
                  <div key={a.name} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex gap-3">
                    <span className="text-xl">🤖</span>
                    <div>
                      <p className="text-sm font-mono text-purple-400">{a.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{a.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── PÁGINAS ── */}
        {tab === "paginas" && (
          <div className="space-y-10">
            {PAGES.map((category) => (
              <div key={category.category}>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium mb-5 ${COLOR_MAP[category.color]}`}>
                  {category.category}
                </div>
                <div className="space-y-3">
                  {category.items.map((page) => {
                    const isExpanded = expandedPage === page.path;
                    return (
                      <div
                        key={page.path}
                        className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
                      >
                        <button
                          className="w-full text-left px-5 py-4 flex items-start justify-between gap-4 hover:bg-gray-800/50 transition-colors"
                          onClick={() => setExpandedPage(isExpanded ? null : page.path)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                              <code className="text-xs bg-gray-800 px-2 py-0.5 rounded text-purple-300 font-mono">
                                {page.path}
                              </code>
                              <span className="text-sm font-semibold text-white">{page.name}</span>
                            </div>
                            <p className="text-sm text-gray-400 mt-1 leading-relaxed">{page.description}</p>
                          </div>
                          <span className="text-gray-500 shrink-0 mt-0.5">{isExpanded ? "▲" : "▼"}</span>
                        </button>

                        {isExpanded && (
                          <div className="border-t border-gray-800 px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {page.components.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">🧩 Componentes</p>
                                <div className="flex flex-wrap gap-1.5">
                                  {page.components.map((c) => (
                                    <span key={c} className="px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded text-xs text-blue-300 font-mono">
                                      {c}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {page.features.length > 0 && (
                              <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">✨ Funcionalidades</p>
                                <ul className="space-y-1">
                                  {page.features.map((f) => (
                                    <li key={f} className="text-xs text-gray-300 flex gap-1.5">
                                      <span className="text-green-400 shrink-0">✓</span>
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
          <div className="space-y-8">
            {/* Search */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">🔍</span>
              <input
                type="text"
                placeholder="Buscar endpoint o descripción..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            {filteredApis.map((group) => (
              <div key={group.group}>
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium mb-4 ${COLOR_MAP[group.color]}`}>
                  {group.group}
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden divide-y divide-gray-800">
                  {group.routes.map((r) => (
                    <div key={r.path} className="flex items-start gap-3 px-4 py-3">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 mt-0.5 ${METHOD_COLOR[r.method] ?? "bg-gray-700 text-gray-300"}`}>
                        {r.method}
                      </span>
                      <div className="flex-1 min-w-0">
                        <code className="text-xs text-purple-300 font-mono">{r.path}</code>
                        <p className="text-xs text-gray-400 mt-0.5">{r.desc}</p>
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
            <p className="text-sm text-gray-400">
              Colecciones Firestore utilizadas por la plataforma.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FIRESTORE_COLLECTIONS.map((col) => (
                <div key={col.name} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex gap-3">
                  <span className="text-xl">🗃️</span>
                  <div>
                    <p className="text-sm font-mono text-orange-400 font-semibold">{col.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{col.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Firebase Storage */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">🗂️ Firebase Storage — Estructura</h3>
              <div className="space-y-2 font-mono text-xs text-gray-300">
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
                  <div key={p} className="flex items-center gap-2">
                    <span className="text-gray-600">📁</span>
                    <span className="text-purple-300">{p}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* n8n Webhooks */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white mb-3">🔗 Webhooks n8n Externos</h3>
              <div className="space-y-3">
                {[
                  { url: "https://n8n.santisoft.cl/webhook/generate-image", desc: "Genera imagen con Vertex AI + retoque. Llamado por /api/n8n/request-image." },
                  { url: "https://n8n.santisoft.cl/webhook/image-to-video", desc: "Genera video desde imagen usando IA. Llamado por /api/ai/image-to-video con polling asíncrono." },
                ].map((w) => (
                  <div key={w.url} className="border border-orange-500/20 bg-orange-500/5 rounded-lg p-3">
                    <code className="text-xs text-orange-400 font-mono block">{w.url}</code>
                    <p className="text-xs text-gray-400 mt-1">{w.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
