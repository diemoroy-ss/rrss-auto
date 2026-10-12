"use client";

import { useEffect, useState, useMemo } from "react";
import { auth } from "../../../../../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export interface AgentDefinition {
  id: string;
  name: string;
  category: "multimedia" | "langgraph" | "strategy_ads" | "seo_blog" | "sync_clients";
  categoryLabel: string;
  icon: string;
  role: string;
  architecture: "LangGraph StateGraph" | "Direct Engine" | "Multi-Agent Cluster" | "Webhook / Cloud Tasks" | "Pipeline Asíncrono";
  sourceFile: string;
  backendModel: string;
  triggers: string;
  summary: string;
  capabilities: string[];
  inputs: string[];
  outputs: string[];
  flowSteps?: string[];
  badgeColor: string;
}

const ALL_AGENTS: AgentDefinition[] = [
  // ── 1. CREACIÓN MULTIMEDIA & PUBLICACIÓN ──
  {
    id: "agent-copy",
    name: "Agente Copywriter Persuasivo",
    category: "multimedia",
    categoryLabel: "Creación Multimedia",
    icon: "✍️",
    role: "Redacción de respuesta directa con inyección de marca",
    architecture: "Direct Engine",
    sourceFile: "src/lib/agents/agent-copy.ts",
    backendModel: "Vertex AI (gemini-2.5-flash) / Gemini Free (gemini-3.7-flash)",
    triggers: "Al publicar en segundo plano (/api/publish-now), generar posts programados y desde el editor.",
    summary: "Transforma temas o ideas en copys persuasivos de alta conversión con tono humano y directo. Inyecta automáticamente WhatsApp, web, correo de la marca y hashtags relevantes con doble fallback de seguridad.",
    capabilities: [
      "Estructura basada en hooks de impacto y llamado a la acción claro",
      "Inyección dinámica de datos de contacto de la marca",
      "Filtro estricto contra clichés o muletillas corporativas",
      "Sanitización automática de formato JSON a texto limpio para publicación"
    ],
    inputs: ["Idea o tema principal", "Perfil de negocio (rubro, tono, web, teléfono, email)"],
    outputs: ["Texto de copy final listo para publicar con hashtags y datos de contacto"],
    flowSteps: [
      "1. Extracción y validación de datos de marca del cliente",
      "2. Intento primario con Google Cloud Vertex AI SDK",
      "3. Fallback inteligente a Gemini Free si hay límite de cuota",
      "4. Limpieza regex de JSON wrappers y saltos de línea"
    ],
    badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
  },
  {
    id: "agent-image",
    name: "Agente de Imagen & Dirección de Arte",
    category: "multimedia",
    categoryLabel: "Creación Multimedia",
    icon: "🎨",
    role: "Diseño de prompts fotográficos y estampado de logo",
    architecture: "Direct Engine",
    sourceFile: "src/lib/agents/agent-image.ts",
    backendModel: "Gemini 3.7 Flash + n8n Webhook / Pollinations Flux + Sharp",
    triggers: "Al crear posts con imagen cuadrada (1:1), vertical (9:16) o panorámica (16:9).",
    summary: "Aplica la fórmula de 7 componentes (Sujeto, Estilo de Cámara/Lente, Escenario, Iluminación, Acción, Composición y Textura) para evocar fotografías reales. Genera la imagen vía n8n/Flux y estampa el logo PNG original con Sharp.",
    capabilities: [
      "Fórmula de 7 componentes de dirección fotográfica realista",
      "Soporte de múltiples relaciones de aspecto (1:1, 9:16 para Stories/Reels, 16:9)",
      "Orquestación vía webhook de n8n con fallback inmediato a Flux",
      "Superposición de logo corporativo nítido mediante Sharp en Firebase Storage"
    ],
    inputs: ["Idea del post", "Rubro del negocio", "Relación de aspecto", "URL del logo PNG oficial"],
    outputs: ["URL de imagen de alta resolución con marca de agua corporativa"],
    flowSteps: [
      "1. Redacción del prompt fotográfico en inglés (120-180 palabras)",
      "2. Petición POST a webhook de n8n (/webhook/img-rrss-auto)",
      "3. Fallback a motor Flux con semilla aleatoria si n8n no responde",
      "4. Estampado de logo PNG con Sharp y guardado en Firebase Storage"
    ],
    badgeColor: "bg-pink-500/10 text-pink-400 border-pink-500/20"
  },
  {
    id: "agent-banner-copy",
    name: "Agente de Banners & Carteles Comerciales",
    category: "multimedia",
    categoryLabel: "Creación Multimedia",
    icon: "🏷️",
    role: "Micro-copywriting de cartelería y composición de anuncios para PyMEs",
    architecture: "Direct Engine + Sharp SVG Compositor",
    sourceFile: "src/lib/agents/agent-banner-copy.ts + src/lib/banner-compositor.ts",
    backendModel: "gemini-3.7-flash + Sharp Vector Engine",
    triggers: "Al generar posts automáticos con estilo Cartel Publicitario o al pulsar 'Sugerir Titulares Comerciales' en el editor.",
    summary: "Transforma las ofertas, descuentos y promociones del cliente (en sus 3 niveles) en titulares llamativos, badges de promoción, pastillas de beneficio y CTAs con garantía de 100% legibilidad y contraste vectorial nítido.",
    capabilities: [
      "Micro-copywriting de venta directa para PyMEs locales (hamburgueserías, barberías, peluquerías, heladerías)",
      "Generación estructurada de titulares bold, badges, detalles de beneficio y CTAs de WhatsApp/ubicación",
      "Composición de diseño gráfico en la app con Sharp y SVG sin recurrir a IAs gráficas con errores de ortografía",
      "Garantía de contraste con pastillas de color, degradados de seguridad y superposición del logo PNG de la marca"
    ],
    inputs: ["Idea del post", "Rubro del negocio", "Promociones configuradas (Nivel 1 o 2)", "Oferta puntual (Nivel 3)", "Logo oficial"],
    outputs: ["JSON de micro-copys publicitarios y URL de imagen compuesta con cartel y logo en Firebase Storage"],
    flowSteps: [
      "1. Lectura de las promociones del cliente y tema del post",
      "2. Redacción de titular de alto impacto (máx 4-6 palabras), badge y beneficio",
      "3. Generación del layout vectorial SVG con degradados de contraste y pastillas",
      "4. Fusión con la imagen fotográfica y el logo PNG usando Sharp en Firebase Storage"
    ],
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20"
  },
  {
    id: "agent-prompt-reviewer",
    name: "Agente Revisor de Calidad de Prompts",
    category: "multimedia",
    categoryLabel: "Creación Multimedia",
    icon: "🔍",
    role: "Auditoría y optimización iterativa de prompts visuales",
    architecture: "Direct Engine",
    sourceFile: "src/app/api/ai/review-prompt/route.ts",
    backendModel: "gemini-3.7-flash",
    triggers: "Wizard de nuevo post en el panel de creación ('/panel/crear') durante los pasos 2 a 4.",
    summary: "Evalúa y perfecciona el prompt de imagen en hasta 3 iteraciones sucesivas antes de la generación final, ajustando encuadre, iluminación cinematográfica, materiales y congruencia con el rubro.",
    capabilities: [
      "Auditoría técnica de iluminación, tipo de lente y composición",
      "Eliminación de palabras prohibidas ('photorealistic', '4k', etc.)",
      "Optimización de prompts en inglés descriptivo",
      "Retroalimentación visual paso a paso en la interfaz de creación"
    ],
    inputs: ["Prompt preliminar", "Rubro e industria", "Objetivo del post"],
    outputs: ["Prompt optimizado y reporte de mejoras aplicadas"],
    flowSteps: [
      "1. Recepción del prompt inicial generado por el usuario o agente",
      "2. Análisis de debilidades de encuadre o iluminación",
      "3. Reescritura enriquecida en prosa continua en inglés",
      "4. Envío al generador de imagen para renderizado"
    ],
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20"
  },
  {
    id: "agent-reel",
    name: "Agente de Video / Reels Dinámicos",
    category: "multimedia",
    categoryLabel: "Creación Multimedia",
    icon: "🎬",
    role: "Composición estructurada 9:16 y renderizado Remotion",
    architecture: "Multi-Agent Cluster",
    sourceFile: "src/lib/agents/agent-reel.ts",
    backendModel: "Gemini 3.7 Flash + Remotion Video Engine + ElevenLabs",
    triggers: "Generación de Reels desde el panel, publicaciones automáticas y sección PoC Video.",
    summary: "Diseña la composición de escenas en formato vertical 9:16, invoca al Agente de Imagen para generar fondos fotográficos adaptados a cada escena y renderiza el video MP4 nativo con Remotion.",
    capabilities: [
      "Estructuración de 3 escenas temporizadas (gancho, desarrollo, CTA) de máximo 10 segundos",
      "Generación de fondos fotográficos 9:16 por escena mediante Agente de Imagen",
      "Sincronización de guion de locución y subtítulos dinámicos",
      "Renderizado concurrente a MP4 de alta definición y subida a Firebase Storage"
    ],
    inputs: ["Tema del video", "Rubro de negocio", "Estilo visual", "ID del post en Firestore"],
    outputs: ["Video MP4 9:16 renderizado, subido y listo para publicar"],
    flowSteps: [
      "1. Desglose del tema en escenas con video-poc-service",
      "2. Generación paralela de imágenes de fondo 9:16 por escena",
      "3. Generación de locución en off (TTS)",
      "4. Renderizado final del archivo MP4 con Remotion"
    ],
    badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/20"
  },
  {
    id: "agent-video-premium",
    name: "Agente de Video Cinematográfico Premium",
    category: "multimedia",
    categoryLabel: "Creación Multimedia",
    icon: "✨",
    role: "Dirección de arte cinematográfica y animación",
    architecture: "Pipeline Asíncrono",
    sourceFile: "src/lib/agents/agent-video-premium.ts",
    backendModel: "Gemini 3.7 Flash + n8n Webhook (Sora/Runway/Luma)",
    triggers: "Creación de videos de alta gama con animación continua de fondos.",
    summary: "Modela prompts de cinematografía pura en formato vertical 9:16 detallando iluminación y movimiento de cámara, disparando el trabajo asíncrono en n8n con polling automático hasta obtener el MP4.",
    capabilities: [
      "Prompting cinematográfico avanzado en inglés para modelos de video",
      "Orquestación asíncrona desacoplada mediante job IDs",
      "Bucle de polling inteligente con timeout de seguridad",
      "Fallback automático a renderizado local con Remotion si el webhook falla"
    ],
    inputs: ["Idea base", "Rubro del cliente", "Descripción de negocio"],
    outputs: ["URL del video MP4 premium animado"],
    flowSteps: [
      "1. Creación de prompt cinematográfico con Gemini",
      "2. Envío a webhook inicial de n8n (/webhook/video-premium)",
      "3. Consulta periódica (polling cada 15s) de estado de render",
      "4. Descarga y vinculación de URL definitiva en el post"
    ],
    badgeColor: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
  },
  {
    id: "agent-audio",
    name: "Agente de Locución y Voz en Off",
    category: "multimedia",
    categoryLabel: "Creación Multimedia",
    icon: "🎙️",
    role: "Síntesis de voz natural en español latinoamericano",
    architecture: "Direct Engine",
    sourceFile: "src/lib/elevenlabs.ts",
    backendModel: "ElevenLabs Multilingual v2 / TTS Engine",
    triggers: "Al generar videos con narración de voz o reels promocionales.",
    summary: "Convierte el guion de locución del post o video en un archivo de audio MP3 de voz profesional y cálida, almacenándolo en la nube para sincronizarlo con el render de video.",
    capabilities: [
      "Entonación humana y natural en español LATAM",
      "Optimización de velocidad y cadencia para videos de 15 a 30 segundos",
      "Almacenamiento persistente en Firebase Storage",
      "Manejo de caché de audio para reutilización eficiente"
    ],
    inputs: ["Texto del guion de locución", "Voz seleccionada", "ID de post"],
    outputs: ["Archivo .mp3 sincronizado en Firebase Storage"],
    flowSteps: [
      "1. Limpieza y formateo fonético del texto",
      "2. Llamada a API de ElevenLabs con modelo multilingüe",
      "3. Buffer y subida a bucket de Firebase Storage",
      "4. Retorno de URL de audio para mezcla audiovisual"
    ],
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
  },

  // ── 2. FLUJO ORQUESTADOR LANGGRAPH ──
  {
    id: "langgraph-writer",
    name: "Agente Redactor de Borradores",
    category: "langgraph",
    categoryLabel: "Flujo LangGraph",
    icon: "📝",
    role: "Nodo inicial de redacción según reglas de plataforma",
    architecture: "LangGraph StateGraph",
    sourceFile: "src/lib/langgraph-agent.ts (generateDraftNode)",
    backendModel: "gemini-3.7-flash",
    triggers: "Inicio del flujo de creación de contenido en LangGraph.",
    summary: "Primer nodo del grafo. Aplica frameworks de marketing (PAS / AIDA) y genera un borrador inicial respetando estrictamente los límites de caracteres de la red social elegida (Twitter, LinkedIn, Instagram, TikTok, Facebook).",
    capabilities: [
      "Adaptación a límites específicos de caracteres por plataforma",
      "Estructuración persuasiva bajo frameworks PAS o AIDA",
      "Inyección de directrices de tono de la red social de destino",
      "Persistencia de estado en memoria mediante MemorySaver"
    ],
    inputs: ["Tema (topic)", "Plataforma seleccionada", "Reglas de plataforma"],
    outputs: ["Borrador inicial (draft)"],
    flowSteps: [
      "1. Lectura de reglas de plataforma en PLATFORM_RULES",
      "2. Redacción estructurada con Gemini",
      "3. Registro de borrador en el State de LangGraph",
      "4. Traspaso automático al nodo Agente Editor"
    ],
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20"
  },
  {
    id: "langgraph-editor",
    name: "Agente Editor Jefe & Crítico",
    category: "langgraph",
    categoryLabel: "Flujo LangGraph",
    icon: "🧐",
    role: "Auditoría de concisión, ganchos y eliminación de clichés",
    architecture: "LangGraph StateGraph",
    sourceFile: "src/lib/langgraph-agent.ts (critiqueNode)",
    backendModel: "gemini-3.7-flash",
    triggers: "Segundo nodo del grafo tras completar el borrador.",
    summary: "Analiza críticamente el borrador. Si supera los caracteres permitidos, exige recortes. Aplica el filtro Humanizer para detectar y vetar frases cliché antes de pasar a la fase de pulido.",
    capabilities: [
      "Verificación matemática de longitud de texto",
      "Detección de frases cliché y tono acartonado",
      "Evaluación del impacto del gancho inicial (hook)",
      "Emisión de directivas precisas de corrección"
    ],
    inputs: ["Borrador del nodo 1 (draft)", "Reglas de plataforma"],
    outputs: ["Crítica y pautas de mejora (critique)"],
    flowSteps: [
      "1. Medición de caracteres del borrador",
      "2. Análisis de tono contra reglas de humanización",
      "3. Construcción del diagnóstico de edición",
      "4. Actualización del State y pausa para Human-in-the-loop (si aplica)"
    ],
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20"
  },
  {
    id: "langgraph-refiner",
    name: "Agente Pulidor Multivariante",
    category: "langgraph",
    categoryLabel: "Flujo LangGraph",
    icon: "💎",
    role: "Generación de 3 versiones finales optimizadas",
    architecture: "LangGraph StateGraph",
    sourceFile: "src/lib/langgraph-agent.ts (refineNode)",
    backendModel: "gemini-3.7-flash",
    triggers: "Tercer nodo tras aprobación humana o ejecución directa.",
    summary: "Combina el borrador original y las críticas del editor para producir 3 variantes finales únicas (opción corta, mediana y creativa) listas para publicar sin superar los límites de la plataforma.",
    capabilities: [
      "Generación simultánea de 3 alternativas diferenciadas",
      "Incorporación estricta de las correcciones del editor",
      "Garantía de tono natural y conversacional",
      "Parsing estructurado de opciones en el State"
    ],
    inputs: ["Borrador original", "Crítica del editor", "Límites de plataforma"],
    outputs: ["Arreglo de 3 opciones finales y post seleccionado"],
    flowSteps: [
      "1. Procesamiento de recomendaciones del editor",
      "2. Redacción de 3 variantes con etiquetas [[OPCION X]]",
      "3. Parser y división de variantes",
      "4. Traspaso al nodo de Auditoría Anti-Ban"
    ],
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
  },
  {
    id: "agent-antiban",
    name: "Agente Auditor Anti-Baneo & Shadowban",
    category: "langgraph",
    categoryLabel: "Flujo LangGraph",
    icon: "🛡️",
    role: "Auditoría de seguridad y políticas de moderación",
    architecture: "LangGraph StateGraph",
    sourceFile: "src/lib/bh-skills.ts (runAntiBanAudit)",
    backendModel: "Filtro Local + Gemini 3.7 Flash",
    triggers: "Nodo final de LangGraph en posts de Instagram y llamadas desde la API /api/bh.",
    summary: "Audita captions y hashtags contra una lista negra de shadowban y patrones que disparan alertas de spam algorítmico en Meta. Entrega un semáforo de riesgo y una versión corregida automáticamente.",
    capabilities: [
      "Validación local ultra-rápida contra listas negras de hashtags",
      "Análisis profundo de patrones de spam y promesas no verificables",
      "Cálculo de Score de Riesgo (0-100) y semáforo (Seguro, Precaución, Riesgo, Peligro)",
      "Reescritura segura del caption preservando la idea central"
    ],
    inputs: ["Caption final", "Hashtags sugeridos", "Tipo de contenido"],
    outputs: ["Score de riesgo, nivel de alerta, hashtags seguros y caption corregido"],
    flowSteps: [
      "1. Cotejo con base de datos interna de hashtags penalizados",
      "2. Análisis semántico de filtros con Gemini",
      "3. Generación de semáforo de riesgo",
      "4. Inyección del reporte en la vista del usuario"
    ],
    badgeColor: "bg-rose-500/10 text-rose-400 border-rose-500/20"
  },

  // ── 3. ESTRATEGIA, CRECIMIENTO & ADS ──
  {
    id: "agent-strategy",
    name: "Agente de Estrategia Digital & Planning",
    category: "strategy_ads",
    categoryLabel: "Estrategia & Ads",
    icon: "🗺️",
    role: "Diseño y orquestación de calendarios tácticos a 14 días",
    architecture: "LangGraph StateGraph",
    sourceFile: "src/lib/langgraph-strategy.ts",
    backendModel: "gemini-3.7-flash",
    triggers: "Generación de estrategias desde el panel de Estrategia (/panel/estrategia).",
    summary: "Orquesta un ciclo inteligente de 4 fases (Análisis de Audiencia → Plan Táctico → Validación JSON → Revisor QA). Si el Revisor rechaza el plan por no cumplir las expectativas del cliente, el ciclo se repite hasta perfeccionarlo.",
    capabilities: [
      "Análisis de rubro, expectativas y pilares temáticos",
      "Distribución del mix de contenido orgánico (40% Edu / 30% Conexión / 20% Autoridad / 10% Venta)",
      "Inyección de contexto histórico de posts con mayor rendimiento",
      "Bucle de auto-corrección con agente revisor QA antes de entregar al usuario"
    ],
    inputs: ["Rubro del negocio", "Objetivo principal", "Expectativas", "Historial de métricas", "Contexto de radar"],
    outputs: ["Plan táctico JSON con días, horarios sugeridos, ganchos y llamados a la acción"],
    flowSteps: [
      "1. analysisNode: Estudio de pilares y tono",
      "2. planningNode: Creación del calendario estructurado",
      "3. validationNode: Sanitización y validación de reglas",
      "4. evaluationNode: Aprobación o rechazo con retroalimentación en bucle"
    ],
    badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
  },
  {
    id: "agent-radar",
    name: "Agente Radar de Nicho & Tendencias",
    category: "strategy_ads",
    categoryLabel: "Estrategia & Ads",
    icon: "📡",
    role: "Extracción de tendencias de mercado de los últimos 30 días",
    architecture: "Direct Engine",
    sourceFile: "src/lib/niche-radar.ts",
    backendModel: "gemini-3.7-flash",
    triggers: "Pestaña 'Radar de Nicho' (/panel/radar) y al alimentar la generación de estrategias.",
    summary: "Investiga y sintetiza las dinámicas que están funcionando en Instagram, TikTok y LinkedIn para un rubro específico en las últimas semanas, identificando preguntas frecuentes de la audiencia, ganchos magnéticos e ideas de publicación.",
    capabilities: [
      "Detección de tendencias en alza clasificadas por nivel de popularidad",
      "Mapeo de dudas y preguntas que los clientes hacen en comentarios y foros",
      "Banco de ganchos magnéticos categorizados (Curiosidad, Mito vs Realidad, etc.)",
      "Generación de bosquejos de contenido listos para crear con 1 clic"
    ],
    inputs: ["Nombre de la marca", "Nicho o rubro", "Público objetivo", "Palabras clave"],
    outputs: ["Reporte completo de tendencias, preguntas, ganchos e ideas con esquema"],
    flowSteps: [
      "1. Análisis de patrones virales del sector en los últimos 30 días",
      "2. Síntesis de ángulos de contenido con mayor retención",
      "3. Estructuración en JSON limpio para la interfaz interactiva",
      "4. Guardado en caché de negocio en Firestore"
    ],
    badgeColor: "bg-sky-500/10 text-sky-400 border-sky-500/20"
  },
  {
    id: "agent-ad-spy",
    name: "Agente Espía de Competencia de Anuncios",
    category: "strategy_ads",
    categoryLabel: "Estrategia & Ads",
    icon: "🕵️",
    role: "Inteligencia competitiva en Meta, TikTok y Google Ads",
    architecture: "Direct Engine",
    sourceFile: "src/lib/bh-skills.ts (runAdSpy)",
    backendModel: "gemini-3.7-flash",
    triggers: "Sección Meta Ads (/panel/ads) y módulo de espionaje publicitario.",
    summary: "Analiza los anuncios activos de competidores. Aplica el principio de duración (+30 días = rentable, +90 días = ganador confirmado) y elabora un mapa de ángulos saturados vs. ángulos NO explotados en el mercado.",
    capabilities: [
      "Identificación de formatos dominantes y ganchos de apertura",
      "Estimación de presupuestos y tiempo de vida de los anuncios",
      "Mapeo de ángulos de mercado (Saturados, Poco explotados y Oportunidades)",
      "Recomendaciones directas de ángulos ganadores para la campaña propia"
    ],
    inputs: ["Nombres o URLs de competidores", "Nicho", "Plataforma de anuncios", "País/Región"],
    outputs: ["Reporte de inteligencia con tabla de creativos ganadores y oportunidades"],
    flowSteps: [
      "1. Rastreo de estructura publicitaria del competidor",
      "2. Análisis de hooks y llamadas a la acción (WhatsApp, formulario, web)",
      "3. Clasificación de ángulos de persuasión",
      "4. Entrega de recomendaciones para copywriter de anuncios"
    ],
    badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/20"
  },
  {
    id: "agent-ad-copywriter",
    name: "Agente Copywriter de Anuncios Pagados LATAM",
    category: "strategy_ads",
    categoryLabel: "Estrategia & Ads",
    icon: "📢",
    role: "Redacción de anuncios pagados calibrados para PyMEs",
    architecture: "Direct Engine",
    sourceFile: "src/lib/bh-skills.ts (generateAdCopy)",
    backendModel: "gemini-3.7-flash",
    triggers: "Asistente de Meta Ads y creación de campañas de conversión.",
    summary: "Escribe variantes de anuncios pagados optimizados para captar mensajes a WhatsApp, formularios de leads o compras, utilizando lenguaje natural latinoamericano y ángulos de Dolor, Deseo y Prueba Social.",
    capabilities: [
      "Creación de sets completos de anuncios (Variante Dolor, Deseo y Prueba Social)",
      "Cumplimiento estricto de especificaciones (Headline máx 40 chars, Descripción máx 30 chars)",
      "Localización de copy con mención de ciudad y referencias culturales",
      "Instrucciones de configuración paso a paso para el Administrador de Anuncios de Meta"
    ],
    inputs: ["Descripción del negocio", "Objetivo (WhatsApp, leads, ventas, tráfico)", "Nicho", "Presupuesto diario"],
    outputs: ["Set de anuncios multivariante con notas visuales y parámetros de configuración"],
    flowSteps: [
      "1. Segmentación del objetivo de conversión y presupuesto",
      "2. Redacción de variantes diferenciadas por ángulo psicológico",
      "3. Generación de micro-copys para titulares y botones de acción",
      "4. Guía de testing de 5 a 7 días para el administrador de anuncios"
    ],
    badgeColor: "bg-green-500/10 text-green-400 border-green-500/20"
  },
  {
    id: "agent-stories",
    name: "Agente de Instagram Stories",
    category: "strategy_ads",
    categoryLabel: "Estrategia & Ads",
    icon: "📱",
    role: "Secuencias narrativas con micro-copy y stickers",
    architecture: "Direct Engine",
    sourceFile: "src/lib/bh-skills.ts (generateStorySequence)",
    backendModel: "gemini-3.7-flash",
    triggers: "Planificador de historias y secuencias de venta directa al DM.",
    summary: "Construye secuencias de 5 a 7 Stories con micro-copy (máx 125 caracteres por slide) y stickers de interacción estratégica (encuestas, quizzes, cajas de preguntas o sliders) para disparar conversaciones en mensajes directos.",
    capabilities: [
      "Micro-copy ultra-conciso adaptado al consumo rápido en Stories",
      "Selección inteligente de stickers de interacción por cada diapositiva",
      "Narrativas de venta, educación, conexión personal o lanzamientos",
      "Estrategia de derivación fluida al DM o link de biografía"
    ],
    inputs: ["Tema de la historia", "Objetivo", "Llamado a la acción (CTA)", "Voz de marca"],
    outputs: ["Secuencia slide por slide con textos, descripción visual y stickers recomendados"],
    flowSteps: [
      "1. Definición del hilo conductor (Hook → Conflicto → Valor → CTA)",
      "2. Redacción de diapositivas respetando el límite de 125 caracteres",
      "3. Asignación del sticker de mayor interacción",
      "4. Sugerencia de mejores horarios de publicación"
    ],
    badgeColor: "bg-orange-500/10 text-orange-400 border-orange-500/20"
  },
  {
    id: "agent-reels-script",
    name: "Agente Guionista de Reels Hyper-Orgánicos",
    category: "strategy_ads",
    categoryLabel: "Estrategia & Ads",
    icon: "🎥",
    role: "Guiones segundo a segundo con fórmulas de retención",
    architecture: "Direct Engine",
    sourceFile: "src/lib/bh-skills.ts (generateReelScript)",
    backendModel: "gemini-3.7-flash",
    triggers: "Módulo de creación de video corto y calendario de Reels.",
    summary: "Genera libretos completos para Reels de máximo 10 segundos con desglose segundo a segundo: qué se ve en cámara, qué texto va en pantalla y qué debe decir la persona para maximizar la retención.",
    capabilities: [
      "Estructuras específicas según objetivo: Venta, Educación (saves), Viralidad (comentarios) o Branding",
      "Fórmulas de hooks visuales y verbales para los primeros 3 segundos",
      "Formato adaptable a cámara hablada (talking head) o texto animado",
      "Inclusión de caption conversacional y hasta 5 hashtags seguros"
    ],
    inputs: ["Tema del Reel", "Nicho", "Objetivo", "Tono (informal, experto, divertido, inspiracional)", "Duración"],
    outputs: ["Guion desglosado segundo a segundo, overlay visual y caption listo"],
    flowSteps: [
      "1. Selección de la fórmula de retención según el objetivo",
      "2. Redacción de líneas cortas (máximo 10 palabras por frase hablada)",
      "3. Asignación de overlays de texto para soporte visual",
      "4. Cierre con un único llamado a la acción específico"
    ],
    badgeColor: "bg-red-500/10 text-red-400 border-red-500/20"
  },

  // ── 4. SEO, ARTÍCULOS & GEO ──
  {
    id: "agent-seo-strategy",
    name: "Agente Estratega SEO & GEO",
    category: "seo_blog",
    categoryLabel: "SEO & Blog",
    icon: "🌐",
    role: "Arquitectura de contenidos para Google y motores de respuesta IA",
    architecture: "Direct Engine",
    sourceFile: "src/app/api/ai/seo-strategy/route.ts",
    backendModel: "gemini-2.5-pro / gemini-3.7-flash",
    triggers: "Panel de SEO Autopilot (/panel/blog) al analizar el sitio web del cliente.",
    summary: "Extrae y analiza la información del sitio web del negocio para construir una matriz de temas y pilares de posicionamiento optimizados para búsquedas orgánicas tradicionales y motores GEO (ChatGPT, Perplexity, Claude).",
    capabilities: [
      "Scraping y comprensión profunda del sitio web del cliente",
      "Identificación de palabras clave de alta intención de compra",
      "Estructuración de clusters temáticos y pilares de contenido",
      "Optimización para citaciones en motores generativos de respuesta"
    ],
    inputs: ["URL del sitio web del cliente", "Rubro de negocio", "Público objetivo"],
    outputs: ["Calendario de artículos SEO/GEO estructurado con palabras clave prioritarias"],
    flowSteps: [
      "1. Extracción de textos y metaetiquetas con scrape-seo-brain",
      "2. Análisis semántico de nicho e intenciones de búsqueda",
      "3. Generación de títulos y enfoques editoriales",
      "4. Asignación de calendario de redacción automática"
    ],
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
  },
  {
    id: "agent-seo-writer",
    name: "Agente Redactor de Artículos de Blog SEO",
    category: "seo_blog",
    categoryLabel: "SEO & Blog",
    icon: "📰",
    role: "Redacción extensa de artículos con arquitectura H1, H2, H3",
    architecture: "Direct Engine",
    sourceFile: "src/app/api/ai/seo-write-now/route.ts",
    backendModel: "gemini-2.5-pro / gemini-3.7-flash",
    triggers: "Publicación programada o manual de artículos de blog en el panel de SEO.",
    summary: "Redacta artículos completos de más de 1.000 palabras con estructura jerárquica impecable, tablas comparativas, metadescripciones optimizadas e inyección de datos de contacto de la marca.",
    capabilities: [
      "Redacción en profundidad con tono de autoridad natural",
      "Estructura HTML/Markdown lista para WordPress o CMS propio (H1, H2, H3, listas)",
      "Generación de metadescripciones atractivas para el CTR en buscadores",
      "Interlinking y llamados a la acción de conversión dentro del artículo"
    ],
    inputs: ["Título del artículo", "Palabras clave principales y secundarias", "Datos del negocio"],
    outputs: ["Artículo completo maquetado, metadatos SEO e imagen destacada"],
    flowSteps: [
      "1. Planificación del esquema de encabezados y preguntas frecuentes",
      "2. Redacción sección por sección con densidad semántica natural",
      "3. Inyección de enlaces y metadescripción",
      "4. Publicación en el blog del cliente o borrador en Firestore"
    ],
    badgeColor: "bg-teal-500/10 text-teal-400 border-teal-500/20"
  },

  // ── 5. SINCRONIZACIÓN, MÉTRICAS & ATENCIÓN ──
  {
    id: "agent-sync",
    name: "Agente Orquestador de Sincronización Multi-Red",
    category: "sync_clients",
    categoryLabel: "Sincronización & Clientes",
    icon: "🔄",
    role: "Sincronización paralela de métricas y publicaciones externas",
    architecture: "LangGraph StateGraph",
    sourceFile: "src/lib/langgraph-sync.ts",
    backendModel: "Grafo Multi-Agente (Discovery → Meta / TikTok / LinkedIn en paralelo)",
    triggers: "Pestaña de Estadísticas, botón de sincronizar y cron de actualización nocturna.",
    summary: "Ejecuta un flujo concurrente que descubre las redes conectadas por el cliente, descifra sus credenciales seguras (AES-256-GCM) y dispara agentes especializados en paralelo para sincronizar publicaciones, likes y comentarios.",
    capabilities: [
      "Descifrado seguro de tokens OAuth en memoria",
      "Ejecución en paralelo (Fan-out) de subagentes Meta, TikTok y LinkedIn",
      "Normalización de métricas en la colección external_posts de Firestore",
      "Registro detallado de bitácora y recuento de sincronizaciones"
    ],
    inputs: ["ID de usuario (userId)", "ID de perfil de negocio (profileId)"],
    outputs: ["Total de publicaciones sincronizadas, logs de ejecución y métricas unificadas"],
    flowSteps: [
      "1. discoveryNode: Lectura y descifrado de credenciales activas",
      "2. metaAgentNode: Descarga de métricas de Facebook Pages e Instagram Graph API",
      "3. tiktokAgentNode & linkedinAgentNode: Sincronización en paralelo",
      "4. Convergencia y guardado en base de datos"
    ],
    badgeColor: "bg-violet-500/10 text-violet-400 border-violet-500/20"
  },
  {
    id: "agent-metrics-analyst",
    name: "Agente Analista de Métricas & Rendimiento",
    category: "sync_clients",
    categoryLabel: "Sincronización & Clientes",
    icon: "📊",
    role: "Diagnóstico ejecutivo y sugerencias tácticas de crecimiento",
    architecture: "Direct Engine",
    sourceFile: "src/app/api/ai/analyze-metrics/route.ts",
    backendModel: "gemini-3.7-flash-lite / gemini-3.7-flash",
    triggers: "Al abrir el informe de estadísticas (/panel/metricas) y generar reportes PDF.",
    summary: "Analiza el comportamiento numérico de las publicaciones pasadas (alcance, engagement, tipos de post más exitosos) y genera un resumen ejecutivo con 3 recomendaciones accionables para los siguientes contenidos.",
    capabilities: [
      "Interpretación cualitativa de métricas cuantitativas",
      "Identificación de los formatos con mayor tasa de interacción",
      "Generación de insights estratégicos sin tecnicismos complejos",
      "Inclusión automática en los reportes PDF ejecutivos para clientes"
    ],
    inputs: ["Historial de posts del mes", "Métricas de likes, comentarios y alcance", "Rubro"],
    outputs: ["Diagnóstico de rendimiento y 3 acciones tácticas sugeridas"],
    flowSteps: [
      "1. Agregación de estadísticas mensuales",
      "2. Comparativa de rendimiento entre Reels, Carruseles y Posts Fijos",
      "3. Redacción del análisis ejecutivo con tono profesional",
      "4. Visualización interactiva en el panel de analítica"
    ],
    badgeColor: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
  },
  {
    id: "agent-whatsapp",
    name: "Agente de WhatsApp & Calificación de Leads",
    category: "sync_clients",
    categoryLabel: "Sincronización & Clientes",
    icon: "💬",
    role: "Atención automatizada 24/7 y calificación de prospectos",
    architecture: "Webhook / Cloud Tasks",
    sourceFile: "src/app/api/admin/whatsapp/route.ts",
    backendModel: "gemini-3.7-flash-lite",
    triggers: "Mensajes entrantes al webhook oficial de WhatsApp Cloud API.",
    summary: "Atiende a prospectos que escriben por WhatsApp, responde consultas sobre los servicios del negocio, califica su interés y sincroniza las conversaciones en la bandeja de entrada del panel administrativo.",
    capabilities: [
      "Atención inmediata 24/7 con respuestas contextuales del negocio",
      "Calificación de prospectos según intención de compra",
      "Sincronización de historial de chat en tiempo real en Firestore",
      "Notificación y derivación a atención humana cuando se requiere"
    ],
    inputs: ["Mensaje entrante del cliente", "Número de teléfono", "Contexto de servicios del negocio"],
    outputs: ["Respuesta enviada vía WhatsApp Cloud API y registro en CRM"],
    flowSteps: [
      "1. Recepción del payload del webhook de Meta/WhatsApp",
      "2. Carga del historial previo del prospecto",
      "3. Generación de respuesta empática y comercial",
      "4. Envío del mensaje y actualización de estado en Firestore"
    ],
    badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
  },
  {
    id: "agent-webchat",
    name: "Agente Asistente de Chat Web",
    category: "sync_clients",
    categoryLabel: "Sincronización & Clientes",
    icon: "⚡",
    role: "Atención interactiva a visitantes en la landing page",
    architecture: "Direct Engine",
    sourceFile: "src/lib/ai-model-config.ts (webchat)",
    backendModel: "gemini-3.1-flash-lite",
    triggers: "Widget de chat flotante en el sitio web público.",
    summary: "Guía a los visitantes del sitio web, explica las funciones de la plataforma de automatización, resuelve objeciones de contratación y ayuda a los usuarios a agendar demostraciones en vivo.",
    capabilities: [
      "Respuestas de ultra-baja latencia para visitantes web",
      "Explicación guiada de planes, precios y casos de uso",
      "Derivación directa al formulario de registro o agenda",
      "Tono amable, resolutivo y comercial"
    ],
    inputs: ["Mensaje del visitante", "Página actual de navegación"],
    outputs: ["Respuesta inmediata en el widget de chat"],
    flowSteps: [
      "1. Recepción de consulta desde el frontend",
      "2. Consulta a base de conocimiento de Santisoft",
      "3. Respuesta conversacional con llamada a probar la demo",
      "4. Transmisión de respuesta en tiempo real"
    ],
    badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/20"
  }
];

export default function AdminAgentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeAgent, setActiveAgent] = useState<AgentDefinition | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const categories = [
    { id: "all", label: "Todos los Agentes", icon: "🤖", count: ALL_AGENTS.length },
    { id: "multimedia", label: "Creación Multimedia", icon: "🎨", count: ALL_AGENTS.filter(a => a.category === "multimedia").length },
    { id: "langgraph", label: "Flujos LangGraph", icon: "🧠", count: ALL_AGENTS.filter(a => a.category === "langgraph").length },
    { id: "strategy_ads", label: "Estrategia & Ads", icon: "📈", count: ALL_AGENTS.filter(a => a.category === "strategy_ads").length },
    { id: "seo_blog", label: "SEO & Blog", icon: "🌐", count: ALL_AGENTS.filter(a => a.category === "seo_blog").length },
    { id: "sync_clients", label: "Sincronización & Clientes", icon: "🔄", count: ALL_AGENTS.filter(a => a.category === "sync_clients").length },
  ];

  const filteredAgents = useMemo(() => {
    return ALL_AGENTS.filter((agent) => {
      const matchesCategory = selectedCategory === "all" || agent.category === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      if (!query) return matchesCategory;

      const matchesSearch =
        agent.name.toLowerCase().includes(query) ||
        agent.role.toLowerCase().includes(query) ||
        agent.summary.toLowerCase().includes(query) ||
        agent.sourceFile.toLowerCase().includes(query) ||
        agent.backendModel.toLowerCase().includes(query) ||
        agent.capabilities.some(c => c.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-slate-500">Cargando catálogo de agentes especializados...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🤖</span>
            <span className="text-[11px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-800">
              Arquitectura de Agentes Santisoft
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Directorio y Mapeo de Agentes
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
            Catálogo unificado de todos los agentes especializados que impulsan la generación de contenido, redacción persuasiva, dirección de video, auditoría anti-baneos y analítica en la plataforma.
          </p>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center gap-3 flex-wrap">
          <Link
            href="/automatizacion-rrss/panel/admin/modelos-ia"
            className="flex items-center gap-2 px-3.5 py-2.5 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/80 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold text-indigo-700 dark:text-indigo-300 transition-all shadow-sm"
          >
            <span>🧠</span> Configurar Modelos IA
          </Link>
          <Link
            href="/automatizacion-rrss/panel/admin/workflows"
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 transition-all shadow-sm"
          >
            <span>⚙️</span> Workflows N8N
          </Link>
        </div>
      </div>

      {/* Stats Counter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Agentes Activos</p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {ALL_AGENTS.length} <span className="text-xs font-semibold text-emerald-500">operativos</span>
            </p>
          </div>
          <span className="text-3xl opacity-80">🤖</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Flujos LangGraph</p>
            <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
              5 <span className="text-xs font-normal text-slate-400">grafos cíclicos</span>
            </p>
          </div>
          <span className="text-3xl opacity-80">🧠</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Motores Multimedia</p>
            <p className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">
              6 <span className="text-xs font-normal text-slate-400">agentes de arte</span>
            </p>
          </div>
          <span className="text-3xl opacity-80">🎨</span>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Estrategia &amp; Growth</p>
            <p className="text-2xl font-black text-amber-500 mt-1">
              6 <span className="text-xs font-normal text-slate-400">skills tácticos</span>
            </p>
          </div>
          <span className="text-3xl opacity-80">📈</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${selectedCategory === cat.id ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400"}`}>
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, archivo o función..."
            className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
          />
          <span className="absolute left-2.5 top-2.5 text-slate-400 text-xs">🔍</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAgents.map((agent) => (
          <div
            key={agent.id}
            onClick={() => setActiveAgent(agent)}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all cursor-pointer flex flex-col justify-between group"
          >
            <div className="space-y-3">
              {/* Header Card */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                    {agent.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {agent.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 line-clamp-1 font-medium">{agent.role}</p>
                  </div>
                </div>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${agent.badgeColor}`}>
                  {agent.categoryLabel}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  {agent.architecture}
                </span>
              </div>

              {/* Summary */}
              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                {agent.summary}
              </p>

              {/* Core Capabilities */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Capacidades Clave:</p>
                {agent.capabilities.slice(0, 2).map((cap, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="text-indigo-500 font-bold">•</span>
                    <span className="line-clamp-1">{cap}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Card */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="truncate max-w-[200px]" title={agent.sourceFile}>
                📁 {agent.sourceFile.split("/").pop()}
              </span>
              <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                Ver detalle →
              </span>
            </div>
          </div>
        ))}

        {filteredAgents.length === 0 && (
          <div className="col-span-full p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
            <span className="text-4xl">🔍</span>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No se encontraron agentes</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No hay agentes que coincidan con la búsqueda &quot;{searchQuery}&quot; en la categoría seleccionada.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("all");
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all"
            >
              Restablecer Filtros
            </button>
          </div>
        )}
      </div>

      {/* DETAILED AGENT INSPECTOR MODAL */}
      {activeAgent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
          <div
            className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setActiveAgent(null)}
          ></div>

          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-[32px] shadow-2xl border border-slate-200 dark:border-slate-800 relative z-10 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="p-6 md:p-8 bg-slate-950 text-white border-b border-slate-800 flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-3xl shadow-inner flex-shrink-0">
                  {activeAgent.icon}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {activeAgent.categoryLabel}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {activeAgent.architecture}
                    </span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-black tracking-tight text-white mt-1">
                    {activeAgent.name}
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">{activeAgent.role}</p>
                </div>
              </div>

              <button
                onClick={() => setActiveAgent(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 md:p-8 space-y-6 overflow-y-auto">
              {/* Summary */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2">
                  Propósito &amp; Función
                </h4>
                <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  {activeAgent.summary}
                </p>
              </div>

              {/* Technical Specifications */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Archivo Fuente</span>
                  <p className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 break-all">
                    {activeAgent.sourceFile}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-400">Motor de Ejecución</span>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 break-words">
                    {activeAgent.backendModel}
                  </p>
                </div>
              </div>

              {/* Trigger */}
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1">
                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-black uppercase">
                  <span>⚡</span> Punto de Disparo (Trigger)
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300">{activeAgent.triggers}</p>
              </div>

              {/* Pipeline Steps if exists */}
              {activeAgent.flowSteps && activeAgent.flowSteps.length > 0 && (
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
                    Flujo de Ejecución (Pipeline)
                  </h4>
                  <div className="space-y-2">
                    {activeAgent.flowSteps.map((step, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200"
                      >
                        <span className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0">
                          {idx + 1}
                        </span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Capabilities */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3">
                  Capacidades &amp; Reglas Especiales
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {activeAgent.capabilities.map((cap, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300"
                    >
                      <span className="text-emerald-500 font-bold">✓</span>
                      <span>{cap}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inputs & Outputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Entradas (Inputs)</h5>
                  <ul className="space-y-1.5">
                    {activeAgent.inputs.map((inp, i) => (
                      <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                        <span className="text-slate-400">📥</span> {inp}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h5 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Salidas (Outputs)</h5>
                  <ul className="space-y-1.5">
                    {activeAgent.outputs.map((out, i) => (
                      <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2">
                        <span className="text-slate-400">📤</span> {out}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="p-4 md:p-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <Link
                href="/automatizacion-rrss/panel/admin/modelos-ia"
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <span>⚙️</span> Ajustar modelo asignado en Modelos IA
              </Link>
              <button
                onClick={() => setActiveAgent(null)}
                className="px-5 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl hover:opacity-90 transition-opacity"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
