# 🗺️ Mapa de Arquitectura y Resumen del Proyecto - Santisoft Automatización

Este documento sirve como guía de contexto rápida para desarrolladores y asistentes de Inteligencia Artificial. Describe el propósito, la estructura de directorios, el modelo de datos y los flujos clave del software para facilitar el mantenimiento y desarrollo del proyecto.

---

## 🚀 1. Descripción General del Proyecto
**Santisoft Automatización** es una plataforma SaaS de automatización de marketing y redes sociales (Meta, LinkedIn, TikTok, Twitter). Utiliza Inteligencia Artificial (Google Gemini, Vertex AI) y orquestación de agentes con **LangGraph** para generar, estructurar, calendarizar y publicar contenido automáticamente en cuentas de clientes, además de sincronizar métricas y generar reportes ejecutivos.

---

## 🛠️ 2. Stack Tecnológico y Dependencias
* **Frontend**: React 18 / Next.js 14 (App Router) en puerto `3003`.
* **Estilos**: Tailwind CSS, PostCSS.
* **Base de Datos y Autenticación**: Firebase Auth, Firestore y Firebase Admin SDK.
* **Orquestación de IA (Agentic Workflows)**: LangChain, `@langchain/google-genai` y `@langchain/langgraph` (para flujos multi-agente persistentes).
* **Proveedores de LLM**: Google Generative AI (Gemini SDK) y Google Cloud Vertex AI SDK.
* **Locución de Audio**: ElevenLabs TTS API para sintetizar audios de voz en off (.mp3) guardados en Firebase Storage.
* **Procesamiento de Tareas en Background**: Google Cloud Tasks (GCP Tasks) para calendarizar ejecuciones futuras de publicaciones.
* **Pasarela de Pagos**: MercadoPago API (para gestión de suscripciones).
* **Reportes y Visualización**: Recharts (gráficos interactivos), jsPDF, html2canvas y `@react-pdf/renderer` para exportación de reportes analíticos de redes sociales.

---

## 🤖 2.1. Modelos de Inteligencia Artificial (Configuración)

La plataforma utiliza dos integraciones de Google para interactuar con modelos de lenguaje. A continuación se detalla qué modelo usa cada componente y dónde se configura:

### A. Google Generative AI (Developer API)
Es la integración principal, utilizada para los agentes de LangGraph, generación de contenido, estrategias de marketing, chat y prompts de video.
* **Modelo Principal**: `gemini-3.1-flash-lite`
* **Archivo de Configuración**: [gemini-free.ts](file:///C:/Users/diemo/Desktop/Apps/santisoft-automatizacion/src/lib/gemini-free.ts)
  * Modifica la constante `FREE_MODEL_NAME` para cambiar el modelo por defecto.
  * Modifica el arreglo `FALLBACK_MODELS` para ordenar la prioridad de modelos alternativos de respaldo (ej. si el principal falla o supera límites de cuota, el sistema intentará con los siguientes en la lista).

### B. Google Cloud Vertex AI (Service Account)
Se utiliza para tareas específicas de comunicación con n8n (`request-image` y `update-image`) para generar descripciones técnicas estructuradas de imágenes y copys a partir de ideas principales.
* **Modelo Principal**: `gemini-2.5-flash`
* **Archivo de Configuración**: [vertexai.ts](file:///C:/Users/diemo/Desktop/Apps/santisoft-automatizacion/src/lib/vertexai.ts)
  * Modifica el parámetro por defecto `modelName = 'gemini-2.5-flash'` en la función `getVertexModel`.

---
## 📁 3. Estructura del Directorio
El código está organizado modularmente bajo `src/`:
```
src/
├── app/                  # Rutas de Next.js App Router (Páginas y Endpoints de API)
│   ├── api/              # Endpoints del Backend (Auth, IA, Pagos, Webhooks, Demo, etc.)
│   ├── automatizacion-rrss/ # Vistas de la aplicación de automatización
│   │   └── panel/        # Dashboard principal del cliente (Creación, Estrategias, Métricas)
│   ├── login/            # Autenticación y enrutamiento (valida completitud de datos)
│   ├── registro/         # Pantalla de Onboarding y Checkout para usuarios nuevos o planes de pago
│   └── globals.css       # Estilos globales y variables CSS del sistema
├── components/           # Componentes UI reutilizables
│   ├── ads/              # Formularios y asistentes de anuncios publicitarios (AdsWizard)
│   ├── crear/            # UI para edición y creación de posts (CanvasEditor, wizards)
│   └── gastronomico/     # Diseños especializados
├── contexts/             # Contextos globales de React (Auth, State)
├── hooks/                # Hooks personalizados
└── lib/                  # Lógica del Negocio e Integraciones Externas
```

---

## 🏛️ 4. Estructura de Base de Datos (Firestore)
El proyecto utiliza Firestore para almacenar datos relacionales estructurados en colecciones clave:
1. `users`: Información del perfil de usuario y niveles de suscripción.
2. `businesses`: Datos de los negocios creados por cada usuario (rubro, objetivos de venta, tono de voz).
3. `posts`: Publicaciones generadas, agendadas, pendientes de revisión humana o publicadas con su metadata (plataforma, ID de tarea de GCP, URL del recurso publicado).
4. `integrations`: Credenciales de acceso de las redes sociales conectadas (tokens de LinkedIn, accesos de Meta/WhatsApp, etc.) cifrados con criptografía de grado militar.
5. `strategies`: Planes estratégicos de 14 días autogenerados para cada negocio.

---

## 🤖 5. Flujos de Inteligencia Artificial (LangGraph Workflows)
El núcleo inteligente de la aplicación está orquestado por LangGraph en la capa `src/lib/`:

### A. Flujo de Redacción de Contenido (`langgraph-agent.ts`)
Implementa un patrón de **Redactor -> Revisor/Editor -> Pulidor** estructurado en un grafo:
1. **`generateDraft`**: Crea un borrador inicial alineado con el tema y los límites de la plataforma elegida (ej: 280 caracteres para Twitter, 3000 para LinkedIn).
2. **`critiqueDraft`**: Un agente editor analiza la longitud, el gancho (hook) y hace sugerencias.
3. **`refineDraft`**: Reescribe y produce **3 opciones finales** diferentes (corta, mediana y creativa).
* **Persistencia y Human-in-the-loop**: Utiliza `MemorySaver` como checkpointer de memoria para persistir el estado entre llamadas de red mediante un `thread_id`. El flujo se pausa obligatoriamente en `interruptBefore: ["refineDraft"]` para esperar la aprobación o feedback directo del usuario antes de refinar.

### B. Generación de Estrategia de Marketing (`langgraph-strategy.ts`)
Crea calendarios tácticos personalizados:
1. **`analyze`**: Diseña pilares de contenido según el rubro y objetivos del negocio.
2. **`plan`**: Traduce la estrategia a un plan táctico estructurado en formato JSON.
3. **`validate`**: Limpia, valida e inyecta reglas de negocio (ej: si se conecta TikTok, el formato debe ajustarse a Reel).

### C. Generación de Prompts e Instrumentos de Video para Reels (Image-to-Video)
Para la creación de Reels, el sistema no renderiza video localmente, sino que asiste al usuario:
1. **Generación de Portada (n8n)**: Crea una imagen estática de alta calidad que sirve de portada o escena inicial.
2. **Prompt de Animación (Gemini)**: Escribe el prompt descriptivo en inglés enfocado en animar dicha imagen de portada a través de IAs externas (Runway, Luma, Sora).
3. **Locución Vocal (ElevenLabs)**: Escribe un script corto en español y sintetiza la locución en formato `.mp3` para descargar y montar en el video final.

---

## 📡 6. Rutas del Backend (Endpoints de API)
La plataforma interactúa a través de controladores en `src/app/api/`:
* **`api/ai/` y `api/strategies/`**: Interfaces de ejecución de los grafos de LangGraph para redactar posts y modelar planes estratégicos.
* **`api/payments/`**: Webhooks e integraciones de checkout con MercadoPago.
* **`api/linkedin/` y `api/social-auth/`**: Flujos OAuth 2.0 para conectar redes sociales del cliente.
* **`api/publish-now/`**: Trigger directo para disparar publicaciones asíncronas vía APIs externas.
* **`api/tasks/` y `api/trigger-posts/`**: Agendamiento y llamadas desde Google Cloud Tasks para publicaciones programadas.
* **`api/webhooks/` y `api/whatsapp/`**: Recepción de webhooks externos y automatización de chats de WhatsApp.

---

## 🔒 7. Políticas de Seguridad y Criptografía (.cursorrules)
* **Cifrado de Tokens**: Las credenciales y tokens OAuth guardados en Firestore deben estar cifrados con **AES-256-GCM** inyectando vectores de inicialización (`iv`) únicos y etiquetas de autenticación (`tag`) (`src/lib/encryption.ts`).
* **Protección de API**: 
  * Las rutas administrativas exigen validación de roles (`admin`).
  * Los procesos automáticos de publicación y llamadas de cron exigen validación de cabecera Bearer contra `CRON_SECRET`.
* **Sanitización de Prompts**: Todos los textos de usuario se sanitizan mediante `sanitizeInput` para anular ataques de Prompt Injection.
* **Lazy Loading**: Recursos pesados del servidor (ej: `firebase-admin`, `@google-cloud/tasks`) se cargan dinámicamente mediante `await import(...)` para evitar inicializaciones masivas en el arranque.

---

## 🎯 8. Flujo de Adquisición y Demostración (Landing Page)
La plataforma cuenta con un robusto sistema de captación y onboarding en la aplicación pública:
* **Demo Avanzada Interactiva**: A través del endpoint `/api/generate-demo-advanced/route.ts`, los visitantes pueden probar la generación de IA sin registrarse. El sistema genera un prompt con directivas de marca, obtiene la imagen generada, y ejecuta un **ciclo de validación interno (Critique Loop)** para garantizar que el texto resultante no supere 300 caracteres y sea directo. El resultado se muestra en un modal interactivo (con marca de agua vía CSS) y se envía al usuario vía email (Nodemailer).
* **Onboarding y Checkout Unificado**: La entrada de todos los usuarios se centraliza en `/registro/page.tsx`.
  * Planes de Pago: Recolecta datos, crea el usuario y lo envía silenciosamente a la pasarela de MercadoPago.
  * Plan Gratuito: Crea el usuario y lo redirige a la app.
* **Smart Login**: Si un cliente se loguea vía Google Auth sin haber completado los datos mínimos de su perfil (Teléfono, Empresa), el sistema bloquea su entrada al panel y lo fuerza a pasar por el formulario de `/registro` para garantizar la integridad de la base de datos de usuarios.
