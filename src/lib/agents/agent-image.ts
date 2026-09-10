import { generateFreeText } from "../gemini-free";
import { HARDCODED_STYLES, ImageGenBehavior, BrandVisualIdentity, buildVisualIdentityContext, pickStyleFromMix } from "../prompt-templates";

export interface ImageAgentParams {
  idea: string;
  rubro?: string;
  businessName?: string;
  businessDescription?: string;
  aspectRatio?: '1:1' | '9:16' | '16:9';
  logoPrompt?: string;
  logoUrl?: string;     // URL del logo PNG original en Firebase Storage
  userId?: string;      // ID de usuario para almacenar la imagen con marca
  includeLogo?: boolean;
  bannerStyle?: 'banner' | 'clean'; // 'banner' (cartel publicitario con textos y badge) o 'clean' (solo foto)
  promotions?: string;  // Promociones habituales del perfil (Nivel 1) o de la quincena (Nivel 2)
  customOffer?: string; // Oferta específica de este post (Nivel 3)
  /** ID del template de estilo visual seleccionado (de HARDCODED_STYLES) */
  promptTemplateId?: string;
  /** Nombre del estilo visual (para inyectar en el prompt si no hay template) */
  visualStyle?: string;
  /** URL de imagen base previa / subida por el usuario para anclar estilo fotográfico */
  baseImageUrl?: string;
  /** ADN de Identidad Visual del cliente */
  brandVisualIdentity?: BrandVisualIdentity;
}

/**
 * Construye el system instruction de Claude-Banana según el comportamiento visual del estilo seleccionado.
 * Cada behavior tiene instrucciones específicas — ninguno fuerza "foto real con personas" por defecto.
 */
function buildSystemInstruction(
  behavior: ImageGenBehavior | undefined,
  styleKeywords: string | undefined,
  isVerticalStory: boolean,
  rubro: string,
  brandVisualIdentity?: BrandVisualIdentity
): string {
  const verticalRule = isVerticalStory
    ? 'FORMATO OBLIGATORIO: Vertical 9:16 (Instagram Story). Encuadre vertical dinámico de alto impacto con sujeto principal en el tercio medio/inferior y composición cinematográfica limpia.'
    : '';

  const styleBlock = styleKeywords
    ? `\nESTILO VISUAL OBLIGATORIO (aplicar a TODO el prompt):\n${styleKeywords}\n`
    : '';

  const visualIdentityBlock = buildVisualIdentityContext(brandVisualIdentity);

  switch (behavior) {
    // ──────────────────────────────────────────────────────────────────────
    // ILUSTRACIÓN 3D / CLAYMATION / LOW POLY / WIREFRAME / PAPERCRAFT
    // ──────────────────────────────────────────────────────────────────────
    case 'illustration-3d':
      return `Eres Claude Banana, un arquitecto de prompts para modelos de generación de imagen de alta fidelidad.
Tu objetivo es tomar la idea de un post y el rubro del cliente y generar UN ÚNICO PROMPT en INGLÉS descriptivo en prosa narrativa (100 a 160 palabras).

REGLA DE ORO: El prompt debe evocar el estilo de arte o ilustración especificado. NO es fotografía realista. Es arte digital, ilustración 3D, o render artístico.
${verticalRule}
${styleBlock}${visualIdentityBlock}
Estructura del prompt:
1. Estilo visual (30%): Describe el estilo artístico específico con términos técnicos precisos en inglés.
2. Sujeto central (25%): El objeto, escena o personaje relacionado con el rubro (${rubro}).
3. Composición y encuadre (20%): Ángulo, disposición espacial, punto focal.
4. Iluminación y color (15%): Paleta de colores, fuentes de luz dentro del estilo artístico.
5. Atmósfera y detalles (10%): Textura, acabado, elementos de ambiente coherentes con el estilo.

REGLAS:
- El prompt DEBE estar en INGLÉS.
- Texto plano en prosa continua, SIN listas, SIN etiquetas.
- NUNCA menciones: "4K", "8K", "masterpiece", "photorealistic", "best quality", "trending on ArtStation".
- El sujeto debe estar relacionado con el rubro: ${rubro}.
- Comienza directamente con la descripción del estilo o el sujeto principal.`;

    // ──────────────────────────────────────────────────────────────────────
    // PRODUCTO — El producto como héroe, sin personas obligatorias
    // ──────────────────────────────────────────────────────────────────────
    case 'product':
      return `Eres Claude Banana, un arquitecto de prompts para modelos de generación de imagen de alta fidelidad.
Tu objetivo es tomar la idea de un post y el rubro del cliente y generar UN ÚNICO PROMPT en INGLÉS descriptivo en prosa narrativa (120 a 180 palabras).

REGLA DE ORO: El prompt debe evocar una fotografía o render comercial de producto. El PRODUCTO es el héroe absoluto. NO se requieren personas. El ambiente complementa y realza el producto.
${verticalRule}
${styleBlock}${visualIdentityBlock}
Estructura obligatoria de 7 componentes:
1. Product Hero (30%): Describe el producto central relacionado con el rubro (${rubro}), sus características visuales, materiales, colores y acabados.
2. Style & Aesthetic (20%): Fotografía comercial de alta gama, iluminación de estudio profesional, o render CGI comercial según el estilo.
3. Environment (15%): Superficie, fondo o entorno que complementa el producto (neutro, dramático, natural, lifestyle).
4. Lighting (15%): Luz de estudio, rim lighting, reflectores, luz natural — describe temperatura y dirección.
5. Composition (10%): Encuadre del producto: ${isVerticalStory ? 'vertical 9:16, producto en tercio central' : 'centered, rule of thirds, product filling 60-70% of frame'}.
6. Atmosphere (5%): Detalles de ambiente que realzan el producto sin competir con él.
7. Quality & Finish (5%): Detalles fotográficos: reflejos, sombras suaves, profundidad de campo.

REGLAS CRÍTICAS:
- El prompt DEBE estar en INGLÉS.
- Texto plano en prosa, SIN listas, SIN etiquetas.
- NUNCA incluyas: "4K", "8K", "masterpiece", "best quality", "trending on ArtStation".
- Comienza directamente con la descripción del producto.
- No intentes generar texto o logos con la IA.`;

    // ──────────────────────────────────────────────────────────────────────
    // EDITORIAL — Persona o producto en contexto aspiracional/lifestyle
    // ──────────────────────────────────────────────────────────────────────
    case 'editorial':
      return `Eres Claude Banana, un arquitecto de prompts para modelos de generación de imagen de alta fidelidad.
Tu objetivo es tomar la idea de un post y el rubro del cliente y generar UN ÚNICO PROMPT en INGLÉS descriptivo en prosa narrativa (120 a 180 palabras).

REGLA DE ORO: El prompt debe evocar fotografía editorial o de lifestyle aspiracional, de calidad de revista o campaña de marca. Puede incluir personas o productos como sujeto principal según el rubro.
${verticalRule}
${styleBlock}${visualIdentityBlock}
Estructura obligatoria:
1. Subject (25%): Persona (edad, rasgos, expresión, atuendo) O producto en contexto aspiracional — relacionado con el rubro (${rubro}).
2. Style & Aesthetic (20%): Fotografía editorial, campaña de marca, lifestyle, moda — estilo de revista o campaña publicitaria premium.
3. Environment (20%): Entorno aspiracional coherente con el rubro: urbano, natural, lujoso, minimalista, etc.
4. Lighting (15%): Luz cinematográfica o editorial: golden hour, studio strobe, luz natural suave, luz de ventana.
5. Composition (15%): Encuadre editorial: ${isVerticalStory ? 'vertical dinámico 9:16' : 'wide or medium shot, editorial framing'}, espacio negativo para texto si aplica.
6. Mood & Atmosphere (5%): Emoción y atmósfera: inspiracional, sofisticado, auténtico, aspiracional.

REGLAS:
- El prompt DEBE estar en INGLÉS.
- Texto plano en prosa, SIN listas.
- NUNCA incluyas: "4K", "8K", "masterpiece", "photorealistic", "best quality".
- Comienza directamente con la descripción del sujeto o escena.`;

    // ──────────────────────────────────────────────────────────────────────
    // TÉCNICO — Blueprint, Exploded View, Cross-Section
    // ──────────────────────────────────────────────────────────────────────
    case 'technical':
      return `Eres Claude Banana, un arquitecto de prompts para modelos de generación de imagen de alta fidelidad.
Tu objetivo es tomar la idea de un post y el rubro del cliente y generar UN ÚNICO PROMPT en INGLÉS descriptivo en prosa narrativa (80 a 140 palabras).

REGLA DE ORO: El prompt debe evocar una ilustración técnica, diagrama de ingeniería o visualización científica. Precisa, limpia, informativa.
${verticalRule}
${styleBlock}${visualIdentityBlock}
Estructura:
1. Technical Style (30%): El tipo de ilustración técnica específico (blueprint, exploded view, cross-section, schematic).
2. Subject (30%): El objeto o sistema a ilustrar, relacionado con el rubro (${rubro}).
3. Composition (20%): Distribución espacial de componentes, etiquetas, líneas guía.
4. Color & Background (20%): Fondo neutro o técnico, paleta de colores del estilo (azul blueprint, blanco limpio, etc.).

REGLAS:
- El prompt DEBE estar en INGLÉS.
- Texto plano en prosa, SIN listas.
- Comienza con el tipo de ilustración técnica.`;

    // ──────────────────────────────────────────────────────────────────────
    // ABSTRACT — Billboard 3D, Portales, Explosiones artísticas
    // ──────────────────────────────────────────────────────────────────────
    case 'abstract':
      return `Eres Claude Banana, un arquitecto de prompts para modelos de generación de imagen de alta fidelidad.
Tu objetivo es tomar la idea de un post y el rubro del cliente y generar UN ÚNICO PROMPT en INGLÉS descriptivo en prosa narrativa (100 a 160 palabras).

REGLA DE ORO: El prompt debe evocar una composición visual espectacular, cinematográfica y visualmente impactante. Puede ser surrealista, futurista, o dramáticamente artística.
${verticalRule}
${styleBlock}${visualIdentityBlock}
Estructura:
1. Visual Concept (30%): El efecto o concepto visual central (portal, explosión, billboard 3D, ambiente surreal), relacionado con el rubro (${rubro}).
2. Subject (25%): El producto, persona o escena que es el héroe visual dentro del concepto.
3. Style & Execution (25%): Estética cinematográfica, dramática, futurista o artística. Iluminación espectacular.
4. Composition & Impact (20%): Cómo se organiza el encuadre para máximo impacto visual: ${isVerticalStory ? 'vertical 9:16 con sujeto central' : 'composición cinematográfica de alto impacto'}.

REGLAS:
- El prompt DEBE estar en INGLÉS.
- Texto plano en prosa, SIN listas.
- NUNCA menciones: "4K", "8K", "masterpiece", "best quality".
- Comienza directamente con la descripción del concepto visual.`;

    // ──────────────────────────────────────────────────────────────────────
    // PHOTO-REAL (default) — Fotografía real, adaptada al rubro
    // ──────────────────────────────────────────────────────────────────────
    case 'photo-real':
    default:
      return `Eres Claude Banana, un arquitecto de prompts para modelos de generación de imagen de alta fidelidad.
Tu objetivo es tomar la idea de un post y el rubro del cliente y generar UN ÚNICO PROMPT en INGLÉS descriptivo en prosa narrativa (120 a 180 palabras).

REGLA DE ORO: El prompt DEBE evocar UNA FOTOGRAFÍA REAL tomada con cámara profesional. Nunca ilustración, render 3D ni animación.
${verticalRule}
${styleBlock ? styleBlock : `\nSUJETO: Adapta el sujeto principal al rubro (${rubro}). Si el rubro vende productos físicos, el sujeto puede ser el producto en un entorno real. Si es un servicio profesional, puede ser una persona en acción relacionada con ese servicio. NO asumas siempre que debe haber una persona — adáptalo al tipo de negocio.\n`}${visualIdentityBlock}
Estructura obligatoria de 7 componentes:
1. Subject (25%): Describe el sujeto principal relacionado con el rubro (${rubro}): puede ser una persona real (con rasgos específicos) o un producto/ambiente, según lo que sea más natural para este negocio.
2. Style & Aesthetic (20%): "shot on Sony A7IV with 85mm f/1.4 lens" o "Canon EOS R5, 50mm prime lens" — fotografía documental/comercial, tonos naturales.
3. Environment (15%): Escenario real y cotidiano coherente con el rubro.
4. Lighting & Atmosphere (15%): Luz natural suave o luz de estudio softbox. Temperatura de color específica.
5. Action & Dynamics (10%): Acción natural y auténtica en tiempo presente.
6. Composition & Camera (10%): ${isVerticalStory ? '"vertical 9:16 composition, medium eye-level shot with clean visual focal point"' : '"medium close-up, rule of thirds, shallow depth of field with bokeh background"'}.
7. Material & Texture (5%): Detalles táctiles reales coherentes con el rubro.

REGLAS CRÍTICAS:
- NUNCA incluyas: "4K", "8K", "masterpiece", "photorealistic", "ultra detailed", "best quality", "trending on ArtStation".
- El prompt DEBE estar en INGLÉS.
- Texto plano en prosa continua, SIN listas.
- Comienza con la descripción del sujeto principal.
- Evita: "cartoon", "anime", "digital art", "3D render", "CGI".`;

  }
}

/**
 * Agente de Imagen: Usa la fórmula de 7 componentes de Claude-Banana para diseñar el prompt
 * fotográfico limpio, genera la imagen vía n8n (o Pollinations) y, si se solicita,
 * estampa el cartel publicitario comercial con titulares, badges y logo usando Sharp.
 */
export async function generateImageWithAgent(params: ImageAgentParams): Promise<string> {
  const { 
    idea, 
    rubro = 'General', 
    businessName = '',
    businessDescription = '', 
    aspectRatio = '1:1', 
    logoPrompt = '', 
    logoUrl = '', 
    userId = 'system',
    includeLogo = false,
    bannerStyle = 'banner',
    promotions = '',
    customOffer = '',
    promptTemplateId,
    visualStyle,
    baseImageUrl,
    brandVisualIdentity,
  } = params;

  let width = 1080;
  let height = 1080;
  if (aspectRatio === '9:16') {
    width = 1080;
    height = 1920;
  } else if (aspectRatio === '16:9') {
    width = 1920;
    height = 1080;
  }

  // 1. Resolver el template de estilo visual si existe o desde el ADN de la marca
  const effectiveTemplateId = promptTemplateId || pickStyleFromMix(brandVisualIdentity);
  const isVerticalStory = aspectRatio === '9:16';
  let selectedBehavior: ImageGenBehavior | undefined;
  let selectedKeywords: string | undefined;

  if (effectiveTemplateId) {
    const template = HARDCODED_STYLES.find(t => t.id === effectiveTemplateId);
    if (template) {
      selectedBehavior = template.imageGenBehavior;
      selectedKeywords = template.styleKeywords;
      console.log(`[AgentImage] Estilo visual resuelto: "${template.title}" (behavior: ${selectedBehavior})`);
    } else {
      console.warn(`[AgentImage] Template "${effectiveTemplateId}" no encontrado en HARDCODED_STYLES, usando photo-real como fallback.`);
    }
  } else if (visualStyle) {
    // Fallback: buscar por nombre si no hay ID
    const template = HARDCODED_STYLES.find(t => t.title === visualStyle || t.id === visualStyle);
    if (template) {
      selectedBehavior = template.imageGenBehavior;
      selectedKeywords = template.styleKeywords;
      console.log(`[AgentImage] Estilo visual por nombre: "${template.title}" (behavior: ${selectedBehavior})`);
    }
  }

  // 2. Diseñar el Prompt usando la técnica Claude-Banana con el estilo y ADN visual
  const sysInstruction = buildSystemInstruction(selectedBehavior, selectedKeywords, isVerticalStory, rubro, brandVisualIdentity);

  const promptInput = `Negocio / Rubro: ${rubro}
Descripción del Negocio: ${businessDescription}
Idea o Tema del Post: ${idea}
Relación de Aspecto: ${aspectRatio} (${isVerticalStory ? 'Formato Vertical Historia 9:16' : 'Formato Cuadrado Feed 1:1'})

Genera el prompt narrativo en inglés (prosa, según las instrucciones del sistema):`;

  let optimizedPrompt = '';
  try {
    optimizedPrompt = await generateFreeText(promptInput, sysInstruction, true);
    optimizedPrompt = optimizedPrompt.trim().replace(/^["']|["']$/g, '');
  } catch (err) {
    console.warn('[AgentImage] Error generando prompt con Claude-Banana, usando fallback directo:', err);
    optimizedPrompt = `A professional business owner in their early 30s with warm olive skin, wearing a neat casual blazer, smiling confidently while working at a modern desk in a bright office. Shot on Canon EOS R5 with 85mm f/1.4 lens, natural side window light at 5500K. ${isVerticalStory ? 'Vertical 9:16 composition' : 'Medium close-up framing'} with shallow depth of field, background softly blurred showing a clean workspace. Scene related to ${rubro}. Authentic, documentary-style commercial photograph with realistic skin texture and natural colors. No text overlay.`;
  }

  console.log(`[AgentImage] Prompt Claude-Banana generado (${aspectRatio}):`, optimizedPrompt);

  // Si se envió una imagen base previa o subida, inspeccionar y anclar con visión computacional
  if (baseImageUrl && typeof baseImageUrl === 'string' && baseImageUrl.startsWith('http')) {
    try {
      console.log(`[AgentImage] 🔍 Inspeccionando imagen base con Agente Revisor de Producto:`, baseImageUrl);
      const { analyzeAndAnchorProductPrompt } = await import('./agent-product-vision');
      const visionResult = await analyzeAndAnchorProductPrompt(baseImageUrl, optimizedPrompt || idea, rubro);
      if (visionResult?.enrichedPrompt) {
        optimizedPrompt = visionResult.enrichedPrompt;
        console.log(`[AgentImage] 🎯 Prompt anclado con éxito a producto de imagen base.`);
      }
    } catch (visionErr: any) {
      console.warn(`[AgentImage] Error inspeccionando imagen base, continuando con prompt estándar:`, visionErr);
    }
  }

  let rawGeneratedUrl = '';

  // 2. Intento Primario: Webhook de n8n
  const n8nWebhookUrl = 'https://n8n.santisoft.cl/webhook/img-rrss-auto';
  try {
    console.log(`[AgentImage] Intentando generar imagen vía n8n webhook (${n8nWebhookUrl})...`);
    
    // Timeout de 90 segundos para dar tiempo suficiente a la generación de Gemini/Nano Banana en n8n
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);

    const n8nRes = await fetch(n8nWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: optimizedPrompt,
        promptEnglish: optimizedPrompt,
        rawIdea: idea,
        rubro: rubro,
        aspectRatio: aspectRatio,
        includeLogo: includeLogo,
        logoPrompt: logoPrompt,
        baseImageUrl: baseImageUrl || undefined,
        width: width,
        height: height
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (n8nRes.ok) {
      const rawData = await n8nRes.json();
      const data = Array.isArray(rawData) ? rawData[0] : rawData;
      const n8nImageUrl = data?.img_url || data?.imageUrl || data?.url || data?.output || data?.image || data?.outputUrl || (typeof rawData === 'string' && rawData.startsWith('http') ? rawData : null);
      if (n8nImageUrl && typeof n8nImageUrl === 'string' && n8nImageUrl.startsWith('http')) {
        console.log(`[AgentImage] ✅ Imagen generada con éxito por n8n:`, n8nImageUrl);
        rawGeneratedUrl = n8nImageUrl;
      } else {
        console.warn(`[AgentImage] ⚠️ n8n respondió 200 pero no trajo una URL válida:`, rawData);
      }
    } else {
      console.warn(`[AgentImage] ⚠️ n8n respondió con status: ${n8nRes.status}`);
    }
  } catch (n8nErr: any) {
    console.warn(`[AgentImage] ⚠️ Fallo o Timeout al llamar al webhook de n8n:`, n8nErr.message || n8nErr);
  }

  // 3. Fallback si n8n no entregó imagen: Pollinations (Flux)
  if (!rawGeneratedUrl) {
    console.log(`[AgentImage] 🔄 Ejecutando Fallback a Pollinations (modelo flux) con el prompt narrativo...`);
    const seed = Math.floor(Math.random() * 1000000);
    const encodedPrompt = encodeURIComponent(optimizedPrompt);
    rawGeneratedUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=flux&nologo=true&enhance=true&seed=${seed}`;
  }

  // 4. Modo Cartel Publicitario: Generar micro-copys de venta y estampar con Sharp + SVG
  if (bannerStyle === 'banner') {
    try {
      console.log(`[AgentImage] 🎯 Modo Cartel Publicitario activo. Invocando Agente de Textos Publicitarios...`);
      const { generateBannerCopyWithAgent } = await import('./agent-banner-copy');
      const { composeBannerOnImage } = await import('../banner-compositor');

      const bannerCopy = await generateBannerCopyWithAgent({
        idea,
        rubro,
        businessName,
        businessDescription,
        promotions,
        customOffer,
        aspectRatio: isVerticalStory ? '9:16' : '1:1'
      });

      console.log(`[AgentImage] 🎨 Textos comerciales generados:`, bannerCopy.badgeText, '-', bannerCopy.mainHeadline);

      const finalBannerUrl = await composeBannerOnImage({
        baseImageUrl: rawGeneratedUrl,
        bannerCopy,
        logoUrl,
        userId,
        aspectRatio: isVerticalStory ? '9:16' : '1:1',
        includeLogo
      });

      return finalBannerUrl;
    } catch (bannerErr: any) {
      console.warn('[AgentImage] Error en composición de banner, recurriendo a modo estándar:', bannerErr.message || bannerErr);
    }
  }

  // 5. Modo Fotografía Limpia: Superposición de Logo PNG tradicional
  if (includeLogo && logoUrl) {
    try {
      console.log(`[AgentImage] 🏷️ Estampando logo PNG real de la marca (${logoUrl}) sobre la imagen limpia...`);
      const { overlayLogoOnImage } = await import('../image-watermark');
      const watermarkedUrl = await overlayLogoOnImage(rawGeneratedUrl, logoUrl, userId, {
        position: 'bottom-right',
        padding: isVerticalStory ? 48 : 36,
        logoWidthPercent: isVerticalStory ? 0.20 : 0.16
      });
      return watermarkedUrl;
    } catch (wmErr: any) {
      console.warn('[AgentImage] Error aplicando watermark de logo, devolviendo imagen sin marca:', wmErr.message || wmErr);
      return rawGeneratedUrl;
    }
  }

  return rawGeneratedUrl;
}
