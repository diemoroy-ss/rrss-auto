# 🚀 Santisoft Automatización — Mapa de Arquitectura y Resumen del Proyecto

> **Actualizado:** 2026-09-26 | **Versión:** 2.0 | **Dominio:** https://rrss.santisoft.cl

Este documento es la referencia rápida de contexto para el equipo de desarrollo y para los agentes que trabajan en este proyecto. Cubre stack, estructura de directorios, páginas, APIs, colecciones Firestore y flujos clave.

---

## 🧭 1. Descripción General

**Santisoft Automatización** es una plataforma SaaS de automatización de marketing en redes sociales (Meta, LinkedIn, TikTok, Twitter/X, YouTube). Usa agentes especializados (Gemini API + Vertex AI + LangGraph) para:

- **Generar** contenido (copy, imágenes, videos) adaptado al rubro y audiencia de cada cliente
- **Calendarizar y publicar** automáticamente en múltiples redes sociales
- **Sincronizar métricas** de engagement y alcance
- **Generar reportes** ejecutivos en PDF
- **Prospectar** clientes nuevos con el Generador de Muestras (demos visuales personalizadas)
- **Automatizar** flujos complejos via n8n + GCP Tasks

> ⚠️ **Regla de comunicación:** En copys, posts y cualquier texto hacia el cliente NUNCA se dice "IA" o "Inteligencia Artificial". Siempre se usa "nuestros agentes" o "equipo de agentes especializados".

---

## ⚙️ 2. Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 App Router + React 18 + TypeScript |
| Estilos | Tailwind CSS |
| Auth & DB | Firebase Auth + Firestore + Firebase Storage |
| Agentes IA | Gemini API (gemini-flash-lite) + Vertex AI (gemini-2.5-flash) + LangGraph |
| Video | Remotion (programático) + n8n Webhook (image-to-video asíncrono) |
| Audio | ElevenLabs TTS (voiceover .mp3) |
| Tareas en BG | Google Cloud Tasks |
| Pagos | MercadoPago API |
| Automatización | n8n (generate-image, image-to-video webhooks) |
| Reportes | Recharts + jsPDF + html2canvas + @react-pdf/renderer |
| Tests | Vitest |

---

## 🤖 2.1. Modelos de IA

### A. Google Generative AI (Developer API)
- **Uso:** Agentes LangGraph, generación de contenido, estrategias, chat, prompts de video.
- **Modelo principal:** `gemini-flash-lite` (configurable desde Firestore por taskKey)
- **Config:** [`src/lib/gemini-free.ts`](src/lib/gemini-free.ts) → `FREE_MODEL_NAME`, `FALLBACK_MODELS`

### B. Google Cloud Vertex AI (Service Account)
- **Uso:** Comunicación con n8n (request-image, update-image), descripción técnica de imágenes.
- **Modelo principal:** `gemini-2.5-flash`
- **Config:** [`src/lib/vertexai.ts`](src/lib/vertexai.ts) → `getVertexModel(modelName)`

---

## 📁 3. Estructura del Directorio

```
src/
├── app/                          # Next.js App Router — Páginas y APIs
│   ├── api/                      # Endpoints del backend
│   │   ├── admin/                # APIs exclusivas del panel admin
│   │   ├── ai/                   # Generación de contenido, copy, imagen, video
│   │   ├── auth/                 # OAuth: Meta, TikTok, LinkedIn, Google, X, YouTube
│   │   ├── payments/             # MercadoPago
│   │   ├── n8n/                  # Webhooks internos de n8n
│   │   ├── poc/video/            # Pipeline POC de generación de video
│   │   ├── whatsapp/             # Bot WhatsApp
│   │   └── ...                   # Otros: blog, catalogo, track, webchat, etc.
│   ├── automatizacion-rrss/
│   │   └── panel/                # Dashboard del usuario
│   │       ├── admin/            # Panel administrativo (solo emails autorizados)
│   │       │   ├── docs/         # ← Documentación interna (esta página)
│   │       │   ├── muestras/     # Generador de Muestras para Prospectos
│   │       │   ├── agentes/      # Monitor de agentes IA
│   │       │   ├── modelos-ia/   # Config dinámica de modelos
│   │       │   └── ...           # agenda, analitica, logs, pagos, planes, etc.
│   │       ├── crear/            # Generador de contenido principal
│   │       ├── estrategia/       # Estrategia de contenido con LangGraph
│   │       ├── radar/            # Radar de nicho competitivo
│   │       ├── metricas/         # Analytics de redes sociales
│   │       ├── poc-video/        # Laboratorio image-to-video
│   │       └── ...               # biblioteca, blog, catalogo, ads, planes, etc.
│   ├── m/[id]/                   # Página pública de propuesta para prospectos
│   ├── render/preview/           # Preview Butterfly Social
│   ├── blog/                     # Blog SEO público
│   ├── login/ registro/ onboarding/
│   └── page.tsx                  # Landing page pública
├── components/                   # Componentes React reutilizables
│   ├── crear/                    # CanvasEditor, AIOptionsModal, CarouselWizard, etc.
│   ├── panel/                    # PostCard, PostGrid, DashboardHeader, modals, etc.
│   ├── ads/                      # AdsWizard
│   ├── video/                    # RemotionReelPlayer
│   └── ...                       # BrandHeader, BrandFooter, PricingPlans, etc.
├── lib/                          # Lógica de negocio y agentes
│   ├── agents/                   # agent-copy, agent-image, agent-reel, agent-video-premium, etc.
│   ├── firebase.ts               # Firebase client SDK
│   ├── firebase-admin.ts         # Firebase Admin SDK (server-side)
│   ├── gemini-free.ts            # Gemini API con fallback chain
│   ├── vertexai.ts               # Vertex AI SDK
│   ├── image-compositor.ts       # Canvas client-side + Butterfly Social render
│   ├── video-renderer.ts         # persistRemoteVideoToStorage (Storage)
│   ├── prompt-templates.ts       # HARDCODED_STYLES, promptCategories
│   ├── video-prompt-templates.ts # VIDEO_PROMPT_STYLES, buildImageToVideoPrompt
│   ├── security.ts               # sanitizeInput(), rate limiting
│   ├── quota.ts / quota-admin.ts # Gestión de cuotas por plan
│   ├── langgraph-*.ts            # Agentes LangGraph multi-paso
│   ├── bh-skills.ts              # Skills: reels, stories, guiones
│   └── ...                       # schemas, socialRules, niche-radar, etc.
└── remotion/                     # Composiciones de video programático con Remotion
```

---

## 📄 4. Páginas de la Aplicación

### Públicas
| Ruta | Nombre | Descripción |
|------|--------|-------------|
| `/` | Landing Page | Marketing principal: propuesta de valor, planes, testimonios, chat bot |
| `/login` | Login | Autenticación con Google OAuth |
| `/registro` | Registro | Creación de cuenta |
| `/onboarding` | Onboarding | Wizard de configuración inicial del negocio |
| `/agendar` | Agendar Reunión | Formulario público para agendar con el equipo |
| `/m/[id]` | Demo Pública Prospecto | Propuesta visual personalizada: imagen, video, copy |
| `/render/preview` | Preview Butterfly Social | Render de diseños de posts para Butterfly Social |
| `/brochure` | Brochure Corporativo | Descargable como PDF |
| `/blog` | Blog | Listado de artículos SEO |
| `/blog/[slug]` | Artículo de Blog | Artículo SEO individual con imagen generada |
| `/confirmar-plan` | Confirmar Plan | Página de éxito post-pago |
| `/privacidad` `/terminos` | Legales | Políticas ES + EN |

### Panel de Usuario (`/automatizacion-rrss/panel/`)
| Ruta | Nombre | Descripción |
|------|--------|-------------|
| `/panel` | Dashboard | Posts, métricas rápidas, accesos directos |
| `/panel/crear` | Crear Contenido | Wizard multi-paso: copy + imagen + publicación |
| `/panel/estrategia` | Estrategia | Generación de estrategia mensual con LangGraph |
| `/panel/radar` | Radar de Nicho | Análisis competitivo y de tendencias |
| `/panel/metricas` | Métricas | Analytics con Recharts, exportación PDF |
| `/panel/prompts` | Biblioteca de Prompts | CRUD de prompts personalizados |
| `/panel/biblioteca` | Biblioteca de Contenido | Galería de assets generados |
| `/panel/publicados` | Posts Publicados | Historial de contenido publicado |
| `/panel/catalogo` | Catálogo | Productos/servicios del cliente |
| `/panel/blog` | Blog (Panel) | Gestión de artículos SEO |
| `/panel/ads` | Meta Ads | Gestión de campañas con Meta Ads API |
| `/panel/planes` | Planes | Suscripción y checkout MercadoPago |
| `/panel/configuracion` | Configuración | OAuth redes sociales, ajustes de cuenta |
| `/panel/mi-perfil` | Mi Perfil | Datos personales del usuario |
| `/panel/poc-video` | POC Image-to-Video | Laboratorio de video: Remotion vs n8n |

### Panel Administrativo (`/automatizacion-rrss/panel/admin/`)
> Acceso restringido: `diemoroy@gmail.com`, `spalezcom@gmail.com`, `santisoftai@gmail.com` o role `admin` en Firestore.

| Ruta | Nombre | Descripción |
|------|--------|-------------|
| `/admin` | Usuarios | Lista de usuarios, gestión de planes y estado |
| `/admin/muestras` | Generador de Muestras | Demos personalizadas para prospectos |
| `/admin/estrategias` | Estrategias | Supervisión global de estrategias |
| `/admin/agenda` | Agenda | Gestión de reuniones con prospectos |
| `/admin/agentes` | Agentes | Monitor y config de agentes IA |
| `/admin/analitica` | Analítica Global | Métricas globales de la plataforma |
| `/admin/logs` | Logs | Logs de eventos, webhooks y errores |
| `/admin/modelos-ia` | Modelos IA | Config dinámica de modelos sin re-deploy |
| `/admin/monitoreo` | Monitoreo | Salud del sistema: APIs, quota, n8n |
| `/admin/pagos` | Pagos | Historial de pagos de todos los usuarios |
| `/admin/planes` | Planes | Configuración de planes de suscripción |
| `/admin/whatsapp` | WhatsApp Bot | Gestión del bot de WhatsApp |
| `/admin/workflows` | Workflows n8n | Monitor de automatizaciones n8n |
| `/admin/test-video` | Test Video | Diagnóstico del pipeline de video |
| `/admin/docs` | Documentación Interna | Esta página — mapa completo de la app |

---

## ⚡ 5. APIs Principales

### IA & Generación
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/ai/generate-post` | POST | Post completo (copy + imagen) desde idea |
| `/api/ai/generate-prompt` | POST | Prompt optimizado para imagen |
| `/api/ai/copywriter` | POST | 3 variantes de copy (PAS, AIDA, HSO) |
| `/api/ai/prospect-copy` | POST | Copy humanizado para demos de prospectos |
| `/api/ai/image-to-video` | POST | Proxy a n8n para generación de video |
| `/api/ai/retouch-prompt` | POST | Retoque de imagen con prompt descriptivo |
| `/api/ai/generate-strategy` | POST | Estrategia mensual de contenido |
| `/api/ai/analyze-metrics` | POST | Análisis de métricas con insights |
| `/api/ai/seo-write-now` | POST | Artículo SEO completo |
| `/api/ai/langgraph` | POST | Agente LangGraph multi-paso |

### n8n Webhooks Internos
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/n8n/request-image` | POST | Solicita imagen a n8n |
| `/api/n8n/update-image` | POST | n8n notifica imagen lista |
| `/api/n8n/send-report` | POST | Envía reporte via n8n |
| `/api/n8n/decrypt` | POST | Descifra payload de n8n |

### Publicación
| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/publish-now` | POST | Publica inmediatamente |
| `/api/publish-story` | POST | Publica story en Instagram |
| `/api/tasks/schedule` | POST | Programa publicación futura (GCP Tasks) |
| `/api/cron/auto-publish` | POST | Cron de autopublicación |

### Autenticación Social
| Endpoint | Descripción |
|----------|-------------|
| `/api/auth/meta` + `/callback` + `/pages` | OAuth Meta (Facebook/Instagram) |
| `/api/auth/tiktok` + `/callback` | OAuth TikTok |
| `/api/auth/linkedin/pages` | OAuth LinkedIn |
| `/api/social-auth/x/redirect` + `/callback` | OAuth Twitter/X |
| `/api/social-auth/youtube/redirect` + `/callback` | OAuth YouTube |

---

## 🗄️ 6. Colecciones Firestore

| Colección | Descripción |
|-----------|-------------|
| `users` | Usuarios: plan, role, redes OAuth, uso mensual |
| `posts` | Posts generados: copy, imágenes, estado, programación |
| `strategies` | Estrategias de contenido generadas |
| `admin_prospect_demos` | Demos para prospectos: imagen, video, copy, link `/m/[id]` |
| `preview_renders` | Renders Butterfly Social: textLayers, logoUrl, outputUrl |
| `system_config` | Config global: planes, taskKey → modelo IA |
| `ai_model_config` | Modelos IA configurables dinámicamente por taskKey |
| `meetings` | Reuniones agendadas con prospectos |
| `payments` | Historial de pagos y suscripciones |
| `catalogo` | Productos/servicios del catálogo del cliente |
| `blog_articles` | Artículos SEO generados |
| `chat_history` | Historial del webchat del landing |
| `whatsapp_conversations` | Conversaciones del bot WhatsApp |

### Firebase Storage — Rutas
```
posts/{userId}/{postId}/image.{ext}
posts/{userId}/{postId}/video.mp4
muestras/{demoId}/imagen.png
muestras/{demoId}/video.mp4
renders/{renderId}/preview.png
logos/{userId}/logo.{ext}
blog/{articleId}/cover.png
catalogo/{userId}/{productId}/image.{ext}
audio/{userId}/{postId}/voiceover.mp3
```

---

## 🔗 7. Webhooks n8n Externos

| URL | Descripción |
|-----|-------------|
| `https://n8n.santisoft.cl/webhook/generate-image` | Genera imagen con Vertex AI + retoque. Llamado por `/api/n8n/request-image`. |
| `https://n8n.santisoft.cl/webhook/image-to-video` | Genera video desde imagen con IA. Polling asíncrono. Llamado por `/api/ai/image-to-video`. |

---

## 🧩 8. Componentes Principales

| Componente | Carpeta | Uso |
|-----------|---------|-----|
| `CanvasEditor` | crear/ | Editor canvas client-side para imágenes 1080×1080 |
| `CarouselWizard` | crear/ | Wizard multi-slide para carruseles |
| `AIOptionsModal` | crear/ | Modal de opciones de generación IA |
| `PostConfigForm` | crear/ | Formulario de configuración del post |
| `PromptStylePickerModal` | crear/ | Selector de estilo visual (HARDCODED_STYLES) |
| `PostCard` | panel/ | Tarjeta de post en el feed |
| `PostGrid` | panel/ | Grid de posts con filtros |
| `DashboardHeader` | panel/ | Header del panel con info del usuario |
| `BulkActionBar` | panel/ | Acciones en lote sobre posts seleccionados |
| `DashboardCarouselViewer` | panel/ | Viewer de carruseles en el dashboard |
| `PostDetailModal` | panel/modals/ | Detalle expandido de un post |
| `UpgradeModal` | panel/modals/ | Modal de upgrade de plan |
| `RemotionReelPlayer` | video/ | Player del video generado con Remotion |
| `AdsWizard` | ads/ | Wizard de creación de campañas Meta Ads |
| `PricingPlans` | / | Tabla de planes de suscripción |
| `WebChatWidget` | / | Widget de chat en landing |
| `DotCanvas` | / | Animación de fondo del landing |
| `HeroSection` | / | Hero del landing con CTA |

---

## 🔄 9. Flujos Clave

### Generación de Post (Happy Path)
```
Usuario → /panel/crear → PostConfigForm
  → POST /api/ai/generate-prompt → Vertex AI
  → POST /api/ai/generate-from-prompt → imagen generada
  → Canvas client-side / Butterfly Social → imagen final
  → POST /api/ai/copywriter → 3 variantes de copy
  → Usuario selecciona + edita
  → POST /api/publish-now → Meta/LinkedIn/TikTok API
  → Firestore posts collection ✓
```

### Generador de Muestras para Prospectos
```
Admin → /panel/admin/muestras
  → Upload logo + foto + rubro + oferta + plato/producto
  → Canvas client-side → imagen 1080×1080 con watermark "Creado por Santisoft.cl"
  → Butterfly Social → render alternativo con textLayers
  → POST /api/ai/prospect-copy → copy humanizado adaptado al plato
  → POST /api/ai/image-to-video → n8n webhook → polling asíncrono → video MP4
  → Firebase Storage → urls persistentes
  → Firestore admin_prospect_demos → link público /m/[id]
  → WhatsApp con link compartible al prospecto ✓
```

### Image-to-Video (Asíncrono con Polling)
```
Cliente → POST /api/ai/image-to-video
  → n8n webhook: https://n8n.santisoft.cl/webhook/image-to-video
  → n8n genera video con IA (proceso ~30-120s)
  → n8n sube a Storage / URL temporal
  → Frontend polling cada 3s hasta status: "done"
  → video disponible en UI ✓
```

### Publicación Programada
```
Usuario → selecciona fecha/hora → POST /api/tasks/schedule
  → Google Cloud Tasks → job creado
  → En la hora programada → POST /api/tasks/execute-post (GCP Tasks llama)
  → Meta/LinkedIn/TikTok API → publicado
  → Firestore post.status = "published" ✓
```

---

## 🛡️ 10. Seguridad y Acceso

- **Auth:** Firebase Auth (Google OAuth + email/password)
- **Panel admin:** Verificación de email en lista ADMIN_EMAILS + role `admin` en Firestore
- **APIs admin:** Bearer token verificado con Firebase Admin SDK
- **Sanitización:** `sanitizeInput()` en todos los endpoints que reciben texto del usuario
- **Rate limiting:** Quota por plan en `quota.ts` / `quota-admin.ts`
- **Encryption:** `encryption.ts` para datos sensibles (tokens OAuth almacenados cifrados)

---

## 🎨 11. Watermarks y Marca

En todas las imágenes del Generador de Muestras se incluye la marca Santisoft:
- **Canvas client-side:** `drawSantisoftWatermark()` en `image-compositor.ts`
- **Butterfly Social:** textLayer en Firestore con `text: "Creado por Santisoft.cl"`
- **Página `/m/[id]`:** Badge `<div>` sobre la imagen
- **Preview `/render/preview`:** Floating watermark badge

---

*Para la versión interactiva de este documento (con búsqueda y filtros), visita `/automatizacion-rrss/panel/admin/docs` en el panel admin.*
