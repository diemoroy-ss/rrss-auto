export type ImageRequirement = 'none' | 'optional' | 'required';
export type ImageGenBehavior = 'photo-real' | 'illustration-3d' | 'product' | 'editorial' | 'technical' | 'abstract';

export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  /** Lista de múltiples categorías asignadas a este estilo */
  categories?: string[];
  prompt: string;
  previewUrl: string;
  imageRequirement: ImageRequirement;
  isCommercialPoster?: boolean;
  /** How Claude-Banana should approach image generation for this style */
  imageGenBehavior?: ImageGenBehavior;
  /** English style keywords injected into the image prompt */
  styleKeywords?: string;
}

export function getPromptCategories(p?: { category?: string; categories?: string[] } | null): string[] {
  if (!p) return ['General'];
  const cats: string[] = [];
  if (Array.isArray(p.categories)) {
    p.categories.forEach(c => {
      if (typeof c === 'string' && c.trim() && !cats.includes(c.trim())) {
        cats.push(c.trim());
      }
    });
  }
  if (p.category && typeof p.category === 'string' && p.category.trim() && !cats.includes(p.category.trim())) {
    cats.push(p.category.trim());
  }
  return cats.length > 0 ? cats : ['General'];
}

export interface StyleMix {
  styleId: string;
  weight: number;
}

export interface BrandVisualIdentity {
  styleMix: StyleMix[];
  lockStyle: boolean;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  colorDescription?: string;
  toneAdjectives?: string[];
  recurringElements?: string;
  subjectType?: 'person' | 'product' | 'mixed' | 'abstract';
  audienceDescription?: string;
  websiteUrl?: string;
  extractedFrom?: 'manual' | 'website' | 'logo' | 'mixed';
  setupAt?: string;
}

export const SUBJECT_TYPE_OPTIONS = [
  { value: 'product' as const, label: 'Producto', description: 'El producto es siempre el héroe. Sin personas obligatorias.', emoji: '📦' },
  { value: 'person' as const, label: 'Persona', description: 'Personas reales usando o relacionadas con tu marca.', emoji: '🧑' },
  { value: 'mixed' as const, label: 'Mixto', description: 'Combina personas y productos según el contexto del post.', emoji: '✨' },
  { value: 'abstract' as const, label: 'Abstracto / Arte', description: 'Composiciones artísticas, ilustraciones o conceptuales.', emoji: '🎨' },
];

export function buildVisualIdentityContext(identity: BrandVisualIdentity | null | undefined): string {
  if (!identity) return '';
  const lines: string[] = [];

  const colorParts: string[] = [];
  if (identity.colorDescription) colorParts.push(identity.colorDescription);
  if (identity.primaryColor) colorParts.push(`primary ${identity.primaryColor}`);
  if (identity.secondaryColor) colorParts.push(`secondary ${identity.secondaryColor}`);
  if (identity.accentColor) colorParts.push(`accent ${identity.accentColor}`);
  if (colorParts.length > 0) lines.push(`Color palette: ${colorParts.join(', ')}.`);

  if (identity.toneAdjectives && identity.toneAdjectives.length > 0) {
    lines.push(`Visual mood: ${identity.toneAdjectives.join(', ')}.`);
  }

  if (identity.recurringElements && identity.recurringElements.trim()) {
    lines.push(`Recurring visual elements: ${identity.recurringElements.trim()}.`);
  }

  if (identity.subjectType) {
    const desc: Record<string, string> = {
      product: 'product as absolute visual hero — no mandatory person required',
      person: 'real person as main subject, naturally interacting with the brand',
      mixed: 'mix of products and people depending on context',
      abstract: 'abstract or artistic composition — maximum creative freedom',
    };
    lines.push(`Subject preference: ${desc[identity.subjectType]}.`);
  }

  if (identity.audienceDescription && identity.audienceDescription.trim()) {
    lines.push(`Visual target: ${identity.audienceDescription.trim()}.`);
  }

  if (lines.length === 0) return '';
  return `\n\nBRAND VISUAL IDENTITY (MANDATORY — apply consistently to every visual element):\n${lines.join('\n')}`;
}

export function pickStyleFromMix(identity: BrandVisualIdentity | null | undefined): string | undefined {
  if (!identity || !identity.styleMix || identity.styleMix.length === 0) return undefined;
  if (identity.lockStyle || identity.styleMix.length === 1) return identity.styleMix[0].styleId;

  const totalWeight = identity.styleMix.reduce((sum, s) => sum + s.weight, 0);
  if (totalWeight === 0) return identity.styleMix[0].styleId;

  let random = Math.random() * totalWeight;
  for (const style of identity.styleMix) {
    random -= style.weight;
    if (random <= 0) return style.styleId;
  }
  return identity.styleMix[0].styleId;
}

export function distributeStylesForPosts(
  identity: BrandVisualIdentity | null | undefined,
  count: number
): (string | undefined)[] {
  if (!identity || !identity.styleMix || identity.styleMix.length === 0) return Array(count).fill(undefined);
  if (identity.lockStyle || identity.styleMix.length === 1) return Array(count).fill(identity.styleMix[0].styleId);

  const totalWeight = identity.styleMix.reduce((sum, s) => sum + s.weight, 0);
  if (totalWeight === 0) return Array(count).fill(identity.styleMix[0].styleId);

  const counts = identity.styleMix.map(style => ({
    styleId: style.styleId,
    allocated: Math.round((style.weight / totalWeight) * count),
  }));

  const allocatedTotal = counts.reduce((sum, c) => sum + c.allocated, 0);
  if (allocatedTotal !== count) counts[0].allocated += count - allocatedTotal;

  const result: string[] = [];
  for (const { styleId, allocated } of counts) {
    for (let i = 0; i < allocated; i++) result.push(styleId);
  }

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

export const promptCategories = [
  "Fotorealismo",
  "Ilustración 3D",
  "Minimalista",
  "Arte Conceptual",
  "Cyberpunk",
  "Producto (E-commerce)",
  "Estilos Técnicos",
  "Diseño y 3D",
  "Artísticos y Creativos",
  "Publicidad y Ads",
  "Editorial y Revista",
  "Gastronomía & Carteles",
];

export const HARDCODED_STYLES: PromptTemplate[] = [
  {
    id: "style-exploded",
    title: "Exploded View (Vista despiezada)",
    description: "Muestra un objeto desarmado con todas sus piezas flotando en orden para ver cómo se conectan por dentro.",
    category: "Estilos Técnicos",
    prompt: "A highly detailed exploded view of [Objeto a despiezar:ej. un motor de automóvil], showing all individual components floating in perfect order, technical illustration style, precise spacing, 8k resolution, clean background.",
    previewUrl: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=500&q=80",
    imageRequirement: "optional",
    imageGenBehavior: "technical",
    styleKeywords: "highly detailed exploded view technical illustration, all individual components floating in precise order, clean white background, engineering schematic aesthetic, labeled parts, precise spacing",
  },
  {
    id: "style-blueprint",
    title: "Blueprint (Plano técnico)",
    description: "Dibuja esquemas con líneas blancas o celestes sobre un fondo azul oscuro, estilo arquitectura o ingeniería.",
    category: "Estilos Técnicos",
    prompt: "A classic architectural blueprint of [Estructura u objeto:ej. un cohete espacial], white and light blue technical lines on a dark navy blue background, precise measurements, drafting aesthetic, engineering schematic.",
    previewUrl: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=500&q=80",
    imageRequirement: "optional",
    imageGenBehavior: "technical",
    styleKeywords: "classic blueprint architectural drawing, white and light blue technical lines on dark navy blue background, precise measurements annotations, drafting table aesthetic, engineering schematic style",
  },
  {
    id: "style-anatomy",
    title: "Cross-section (Corte transversal)",
    description: "Corta un objeto a la mitad para mostrar sus capas y su interior con precisión.",
    category: "Estilos Técnicos",
    prompt: "A detailed cross-section anatomy of [Objeto o sujeto:ej. un volcán en erupción], cut in half revealing the intricate inner layers and internal structures, educational textbook illustration, hyper-detailed.",
    previewUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=500&q=80",
    imageRequirement: "optional",
    imageGenBehavior: "technical",
    styleKeywords: "detailed cross-section cut revealing inner layers and internal structure, educational textbook illustration style, labeled internal anatomy, hyper-detailed scientific diagram",
  },
  {
    id: "style-isometric",
    title: "Isometric 3D",
    description: "Presenta escenarios en un ángulo de 3/4, aspecto limpio tipo maqueta o videojuego de estrategia.",
    category: "Diseño y 3D",
    prompt: "An isometric 3D render of [Escenario:ej. una pequeña cafetería acogedora], clean miniature diorama style, smooth lighting, tilt-shift effect, strategy game aesthetic, colorful, highly detailed.",
    previewUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80",
    imageRequirement: "optional",
    imageGenBehavior: "illustration-3d",
    styleKeywords: "isometric 3D render, clean miniature diorama style, smooth soft studio lighting, tilt-shift effect, strategy game aesthetic, colorful and detailed, 45-degree isometric camera angle",
  },
  {
    id: "style-wireframe",
    title: "Wireframe (Malla de alambre)",
    description: "Forma figuras usando solo líneas y puntos geométricos. Muestra la estructura digital básica.",
    category: "Diseño y 3D",
    prompt: "A glowing 3D digital wireframe of [Objeto:ej. un automóvil deportivo], made of geometric neon lines and points on a dark background, cyberpunk structure, cyber grid, tech aesthetic.",
    previewUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=500&q=80",
    imageRequirement: "optional",
    imageGenBehavior: "illustration-3d",
    styleKeywords: "glowing 3D digital wireframe, geometric neon lines and vertex points, dark background, cyberpunk tech aesthetic, cyber grid, neon glow edges",
  },
  {
    id: "style-lowpoly",
    title: "Low Poly",
    description: "Construye la imagen con pocos triángulos y figuras geométricas simples. Aspecto retro o minimalista.",
    category: "Diseño y 3D",
    prompt: "A beautiful low poly 3D rendering of [Escenario o sujeto:ej. un paisaje de montañas al atardecer], constructed with simple geometric triangles and facets, minimalist flat shading, retro computer graphics style, pastel colors.",
    previewUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80",
    imageRequirement: "optional",
    imageGenBehavior: "illustration-3d",
    styleKeywords: "low poly 3D art style, geometric triangular facets, flat shading, minimalist retro computer graphics, polygonal shapes, pastel color palette",
  },
  {
    id: "style-papercraft",
    title: "Papercraft (Arte en papel)",
    description: "Hace que todo parezca hecho a mano con recortes de papel de colores doblados y superpuestos.",
    category: "Artísticos y Creativos",
    prompt: "A beautiful papercraft illustration of [Escenario o sujeto:ej. un bosque mágico con hadas], made entirely of layered and folded colorful paper cutouts, drop shadows, tactile texture, handmade origami aesthetic.",
    previewUrl: "https://images.unsplash.com/photo-1502691876148-a84978e59af8?w=500&q=80",
    imageRequirement: "optional",
    imageGenBehavior: "illustration-3d",
    styleKeywords: "papercraft illustration style, layered and folded colorful paper cutouts, visible drop shadows between paper layers, tactile handmade texture, origami aesthetic, paper diorama",
  },
  {
    id: "style-claymation",
    title: "Claymation (Arcilla)",
    description: "Personajes y objetos modelados con plastilina o arcilla, estilo stop-motion.",
    category: "Artísticos y Creativos",
    prompt: "A cute claymation 3D render of [Sujeto:ej. un pingüino bebiendo café], made of modeled plasticine, visible fingerprints on the clay, stop-motion animation style, tactile realistic texture, studio lighting.",
    previewUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80",
    imageRequirement: "optional",
    imageGenBehavior: "illustration-3d",
    styleKeywords: "claymation plasticine style, modeled clay texture with visible fingerprints, stop-motion animation aesthetic, colorful handmade clay characters, studio lighting on clay surface",
  },

  // ─── PUBLICIDAD Y ADS ────────────────────────────────────────────────────
  {
    id: "style-meta-ads",
    title: "Meta Ads",
    description: "Modificación de imagen con preservación absoluta del producto original (geometría, proporciones, iluminación y marca intactos).",
    category: "Publicidad y Ads",
    prompt: `MODIFICACIÓN DE IMAGEN — PRESERVACIÓN DEL PRODUCTO

Utiliza la imagen proporcionada como referencia principal y realiza ÚNICAMENTE la modificación solicitada.

El producto original tiene PRIORIDAD ABSOLUTA sobre cualquier interpretación creativa del modelo.

PRESERVAR SIN CAMBIOS:
1. Producto principal.
2. Geometría y proporciones.
3. Dimensiones relativas.
4. Ángulo y perspectiva.
5. Posición de cámara.
6. Materiales y texturas.
7. Color y acabado.
8. Detalles constructivos.
9. Iluminación.
10. Sombras y reflejos.
11. Fondo, salvo que se solicite modificarlo.
12. Logotipos, textos y elementos de marca.

NO HACER:
- No rediseñar el producto.
- No reinterpretar el producto.
- No mejorar su diseño.
- No agregar elementos no solicitados.
- No eliminar elementos no solicitados.
- No cambiar dimensiones.
- No cambiar materiales.
- No cambiar el punto de vista.
- No convertirlo en otro producto.
- No generar una nueva versión desde cero.

MODIFICACIÓN EXACTA:
[CAMBIO:ej. Cambiar el fondo por un entorno de estudio minimalista con iluminación suave]

La modificación debe parecer físicamente integrada en la fotografía original. Respeta perspectiva, escala, profundidad, iluminación, sombras, reflejos y comportamiento realista de los materiales.

REGLA FINAL:
Si existe alguna duda entre modificar un elemento o conservarlo, CONSÉRVALO.

El resultado debe parecer una fotografía profesional del producto original después de haber realizado físicamente el cambio solicitado.`,
    previewUrl: "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=500&q=80",
    imageRequirement: "required",
    isCommercialPoster: true,
    imageGenBehavior: "product",
    styleKeywords: "premium commercial studio product photography, clean minimalist background, professional advertising quality, product as the absolute hero, sharp details, realistic lighting and shadows",
  },
  {
    id: "style-floating-product",
    title: "Producto Flotante (Floating Product)",
    description: "Presenta tu producto suspendido en el aire con iluminación cinematográfica de estudio y sombras hiperrealistas sin alterar el producto.",
    category: "Publicidad y Ads",
    prompt: `Create a premium commercial product photograph using the provided image as the exact product reference.

The ORIGINAL PRODUCT must remain visually identical. Preserve its exact geometry, proportions, materials, colors, textures, finishes, components, construction details, logos and typography.

Do NOT redesign, reinterpret, simplify, improve or replace the product.

Transform ONLY the presentation into a dramatic FLOATING PRODUCT composition.

The product must appear naturally suspended in mid-air with absolutely no visible support, cables, hooks, hands, stands or mounting system.

Create realistic depth, contactless atmospheric separation and physically accurate soft shadows beneath and around the product to communicate that it is genuinely floating.

Use premium studio photography:
- cinematic but realistic lighting
- controlled highlights
- realistic reflections
- physically accurate shadows
- subtle ambient light
- sharp product details
- professional commercial photography
- realistic depth of field
- clean luxury aesthetic

The product must remain the visual hero and occupy the appropriate amount of the frame.

Use a sophisticated minimal background with subtle gradients and enough contrast to clearly separate the product from the background: [Fondo o tonalidad:ej. fondo minimalista en degradado neutro con iluminación dramática de estudio].

Do not add decorative objects unless explicitly requested.

The final image must look like a real high-end advertising photograph of the EXACT SAME PRODUCT floating in space.

ABSOLUTE RULE:
Everything that was not explicitly requested to change must remain unchanged from the original image.`,
    previewUrl: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&q=80",
    imageRequirement: "required",
    isCommercialPoster: true,
    imageGenBehavior: "product",
    styleKeywords: "premium commercial product floating in mid-air, dramatic studio lighting, realistic soft shadows beneath the product, clean luxury background, high-end advertising photograph, product as visual hero",
  },
  {
    id: "style-highspeed-splash",
    title: "Efecto Splash High-Speed",
    description: "Salpicadura dinámica de líquido congelada en alta velocidad alrededor de tu producto intacto, con gotas hiperrealistas e iluminación publicitaria.",
    category: "Publicidad y Ads",
    prompt: `Create a premium high-speed commercial product photograph using the provided image as the EXACT product reference.

The ORIGINAL PRODUCT must remain visually identical.

Preserve:
- exact product geometry
- proportions
- dimensions
- materials
- colors
- textures
- finishes
- components
- construction details
- logos
- typography
- labels
- original perspective and orientation

DO NOT redesign, reinterpret, improve, simplify, replace or modify the product.

ONLY transform the surrounding scene by adding a realistic SPLASH effect.

Create a dynamic liquid splash surrounding the product, frozen in mid-air as if captured with a professional high-speed camera: [Tipo o color del líquido:ej. agua cristalina con microgotas flotantes].

The liquid must contain:
- realistic droplets
- droplets of different sizes
- suspended micro-droplets
- organic splash shapes
- realistic transparency
- realistic refraction
- specular highlights
- physically accurate reflections
- natural motion
- convincing depth

The splash should interact naturally with the product and surrounding environment while NEVER damaging, deforming or obscuring the product.

Keep all important product details, logos and text clearly visible.

Use premium studio advertising lighting with realistic highlights, shadows, reflections and depth.

The composition should be dramatic, energetic and visually striking while remaining elegant and commercially usable.

Use a clean, sophisticated background with strong enough contrast to separate the product and splash: [Fondo o contraste:ej. fondo oscuro degradado con iluminación de estudio].

The final result must look like a REAL professional high-speed advertising photograph, not a CGI render or AI-generated illustration.

ABSOLUTE RULE:
Everything that was not explicitly requested to change must remain unchanged from the original image.

The product is ALWAYS the hero.
The splash is a supporting visual effect.`,
    previewUrl: "https://images.unsplash.com/photo-1556881286-fc6915169721?w=500&q=80",
    imageRequirement: "required",
    isCommercialPoster: true,
    imageGenBehavior: "product",
    styleKeywords: "dynamic high-speed liquid splash surrounding product frozen mid-air, realistic droplets specular highlights, organic splash shapes, clean studio advertising lighting, product intact and clearly visible at center",
  },
  {
    id: "style-portal-dimensional",
    title: "Portal Dimensional (Portal Effect)",
    description: "Portal futurista y volumétrico que enmarca tu producto con iluminación dimensional y reflejos cinematográficos sin alterar el producto.",
    category: "Publicidad y Ads",
    prompt: `Create a premium commercial product image using the provided image as the EXACT product reference.

The ORIGINAL PRODUCT must remain visually identical.

PRESERVE ABSOLUTELY:
- exact product geometry
- proportions
- dimensions
- materials
- colors
- textures
- finishes
- components
- construction details
- logos
- typography
- labels
- packaging details
- original perspective and orientation

DO NOT redesign, reinterpret, improve, simplify, replace, deform or modify the product in any way.

ONLY transform the surrounding environment by introducing a visually striking PORTAL effect.

PORTAL EFFECT:
Create a sophisticated dimensional portal surrounding or positioned behind the product, as if the product is emerging from or passing through a futuristic gateway: [Estilo o color del portal:ej. portal circular de luz neón cian y dorado con iluminación volumétrica].

The portal must feel physically integrated into the scene, with:
- realistic depth
- dimensional layers
- atmospheric effects
- subtle volumetric lighting
- realistic light interaction
- controlled glow
- particles or energy details used sparingly
- natural shadows
- realistic reflections
- cinematic spatial separation

The portal must NEVER alter the physical appearance of the product.

POSITIONING:
The product must remain the primary visual subject.

The portal should frame, highlight and enhance the product without covering important details, logos, text or identifying characteristics.

The product should appear naturally positioned in relation to the portal, with convincing perspective, scale and depth.

LIGHTING:
Create premium commercial studio lighting combined with the portal's environmental illumination.

Portal light should realistically influence the product through subtle:
- highlights
- reflections
- rim lighting
- ambient illumination
- shadows

The lighting must remain physically plausible.

STYLE:
Premium advertising photography.
Modern.
Futuristic.
Sophisticated.
High-end.
Cinematic but realistic.
Visually striking without becoming visually chaotic.

BACKGROUND:
Use a clean, sophisticated environment that complements the portal: [Fondo o atmósfera:ej. entorno minimalista oscuro con reflejos sutiles en el suelo].

Avoid unnecessary objects, visual clutter or distracting elements.

REALISM:
The final image must look like a professionally photographed commercial campaign with a practical or digitally enhanced portal effect.

Avoid an obvious CGI appearance.
Avoid cartoon aesthetics.
Avoid excessive fantasy effects.
Avoid generic sci-fi imagery.

AUTOMATION RULE:
This prompt must adapt naturally to ANY product provided as the input image.

The portal design, lighting, scale and surrounding environment may automatically adapt to the product category, colors, materials and composition, while the product itself must remain unchanged.

ABSOLUTE RULE:
Everything that was not explicitly requested to change must remain unchanged from the original image.

The PRODUCT is always the hero.
The PORTAL is only a visual environment/effect designed to enhance and frame the product.`,
    previewUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=500&q=80",
    imageRequirement: "required",
    isCommercialPoster: true,
      imageGenBehavior: "abstract",
    styleKeywords: "sophisticated dimensional portal surrounding the product, futuristic glowing gateway effect, volumetric lighting, dimensional depth layers, cinematic spatial separation, product as absolute hero in center",
  },
  {
    id: "style-controlled-explosion",
    title: "Explosión Controlada (Controlled Explosion)",
    description: "Ráfaga y explosión cinematográfica controlada con partículas, destellos y ondas de energía alrededor de tu producto intacto.",
    category: "Publicidad y Ads",
    prompt: `Create a premium commercial product image using the provided image as the EXACT product reference.

The ORIGINAL PRODUCT must remain visually identical.

PRESERVE ABSOLUTELY:
- exact product geometry
- proportions
- dimensions
- materials
- colors
- textures
- finishes
- components
- construction details
- logos
- typography
- labels
- packaging details
- original perspective and orientation

DO NOT redesign, reinterpret, improve, simplify, replace, deform or modify the product in any way.

ONLY transform the surrounding environment by introducing a controlled EXPLOSION effect.

EXPLOSION EFFECT:
Create a dramatic, cinematic explosion surrounding or behind the product, as if the product is positioned at the center of a powerful controlled burst: [Estilo o color de la explosión:ej. ráfaga de polvo de color y partículas doradas con destellos de chispas].

The explosion should contain realistic:
- particles
- fragments
- dust
- debris
- energy waves
- sparks
- atmospheric distortion
- smoke
- volumetric illumination
- dynamic motion frozen in time

The explosion must visually enhance the product without covering or obscuring important product details.

Do NOT create fragments that appear to originate from or damage the product unless explicitly requested.

The product must remain intact and undamaged.

COMPOSITION:
The product is ALWAYS the visual hero.

Use the explosion as a framing and energy element around the product, creating depth and visual impact while maintaining a clear silhouette.

LIGHTING:
Use cinematic high-end commercial lighting.

The explosion should realistically illuminate the product through:
- warm highlights where appropriate
- reflected light
- rim lighting
- subtle environmental illumination
- realistic shadows

Lighting must respect the material and reflective properties of the original product.

STYLE:
Premium advertising photography.
Cinematic.
Powerful.
Dynamic.
High-impact.
Photorealistic.
Sophisticated.

Avoid excessive destruction, chaotic debris or visual clutter.

REALISM:
The final image must look like a professionally produced commercial photograph using practical effects and high-speed photography or sophisticated cinematic visual effects.

Avoid cartoon aesthetics, generic CGI and artificial-looking effects.

AUTOMATION RULE:
Adapt the explosion's scale, intensity, particles, lighting and composition automatically according to the product category, size, materials, colors and original image composition.

ABSOLUTE RULE:
Everything that was not explicitly requested to change must remain unchanged from the original image.

The PRODUCT is always the hero.
The EXPLOSION is only a surrounding visual effect.`,
    previewUrl: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&q=80",
    imageRequirement: "required",
    isCommercialPoster: true,
      imageGenBehavior: "abstract",
    styleKeywords: "controlled cinematic explosion surrounding the product, dynamic particles fragments and dust frozen mid-air, volumetric energy burst, product intact and clearly visible at center, dramatic cinematic lighting",
  },
  {
    id: "style-cinematic-smoke",
    title: "Humo Volumétrico (Cinematic Smoke)",
    description: "Humo cinemático elegante y volumétrico que envuelve y resalta tu producto con iluminación de estudio premium sin ocultarlo ni modificarlo.",
    category: "Publicidad y Ads",
    prompt: `Create a premium commercial product image using the provided image as the EXACT product reference.

The ORIGINAL PRODUCT must remain visually identical.

PRESERVE ABSOLUTELY:
- exact product geometry
- proportions
- dimensions
- materials
- colors
- textures
- finishes
- components
- construction details
- logos
- typography
- labels
- packaging details
- original perspective and orientation

DO NOT redesign, reinterpret, improve, simplify, replace, deform or modify the product in any way.

ONLY transform the surrounding environment by introducing a realistic SMOKE effect.

SMOKE EFFECT:
Create elegant, cinematic volumetric smoke surrounding and/or flowing behind the product: [Tono o color del humo:ej. volutas de humo etéreo en tonos oscuros e iluminación de borde].

The smoke must have:
- realistic fluid movement
- organic shapes
- multiple levels of density
- soft edges
- transparent areas
- volumetric depth
- realistic light scattering
- subtle atmospheric particles
- natural turbulence
- physically believable movement

The smoke should frame and enhance the product without obscuring important details.

IMPORTANT:
Keep logos, text, labels and essential product characteristics clearly visible.

Do not make the smoke appear to originate from the product unless the original image or requested concept specifically requires it.

The product must remain completely intact and visually unchanged.

COMPOSITION:
The product must remain the main focal point.

Use the smoke to create depth, atmosphere, sophistication and visual movement.

LIGHTING:
Use premium studio and cinematic lighting.

The smoke must interact naturally with the existing lighting and create realistic:
- light diffusion
- shadows
- highlights
- atmospheric depth
- subtle reflections

STYLE:
Premium commercial photography.
Elegant.
Cinematic.
Atmospheric.
Modern.
Sophisticated.
Photorealistic.

Avoid excessive smoke density, which could hide the product.

Avoid artificial-looking fog, flat overlays or generic CGI smoke.

REALISM:
The final result must look like a professionally photographed product with real volumetric smoke captured in a controlled studio environment.

AUTOMATION RULE:
Adapt the smoke's density, movement, scale, direction, lighting and visual character automatically according to the product category, materials, colors and composition.

ABSOLUTE RULE:
Everything that was not explicitly requested to change must remain unchanged from the original image.

The PRODUCT is always the hero.
The SMOKE is only an environmental visual effect.`,
    previewUrl: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=500&q=80",
    imageRequirement: "required",
    isCommercialPoster: true,
      imageGenBehavior: "product",
    styleKeywords: "elegant cinematic volumetric smoke surrounding the product, organic fluid smoke shapes, multiple density levels, soft atmospheric depth, premium studio lighting interacting with smoke, product clearly visible",
  },
  {
    id: "style-underwater-scene",
    title: "Escenario Subacuático (Underwater Scene)",
    description: "Sumerge tu producto en un entorno subacuático de lujo con cáusticas de luz, microburbujas y rayos volumétricos sin alterar el producto.",
    category: "Publicidad y Ads",
    prompt: `Create a premium commercial product image using the provided image as the EXACT product reference.

The ORIGINAL PRODUCT must remain visually identical.

PRESERVE ABSOLUTELY:
- exact product geometry
- proportions
- dimensions
- materials
- colors
- textures
- finishes
- components
- construction details
- logos
- typography
- labels
- packaging details
- original perspective and orientation

DO NOT redesign, reinterpret, improve, simplify, replace, deform or modify the product in any way.

ONLY transform the surrounding environment into a realistic UNDERWATER scene.

UNDERWATER ENVIRONMENT:
Place the product naturally within a sophisticated underwater environment: [Tipo de agua o entorno:ej. agua cristalina con rayos solares penetrando desde la superficie y cáusticas doradas].

Create realistic:
- water volume
- underwater atmosphere
- caustic light patterns
- light rays penetrating the water
- floating particles
- tiny bubbles
- subtle water movement
- realistic depth
- atmospheric perspective
- natural underwater shadows
- physically believable light absorption

The underwater environment must feel immersive and photographic.

IMPORTANT:
The product itself must remain completely unchanged.

Do not add algae, marine growth, corrosion, scratches, damage or water effects directly onto the product unless explicitly requested.

Do not distort the product through excessive water refraction.

Keep logos, text, labels and essential product characteristics clearly readable whenever physically possible.

COMPOSITION:
The product remains the absolute visual hero.

Position the product naturally within the underwater environment, with convincing scale, perspective and depth.

Create sufficient separation between the product and the background.

LIGHTING:
Use realistic underwater cinematic lighting.

Light should behave naturally as it passes through water, producing:
- volumetric light rays
- soft blue/ambient environmental illumination where appropriate
- realistic caustics
- subtle highlights
- natural shadows
- depth-dependent contrast

The lighting must adapt to the product's original materials and reflective properties.

STYLE:
Premium commercial advertising photography.
Luxury.
Cinematic.
Immersive.
Futuristic where appropriate.
Photorealistic.
High-end visual campaign.

Avoid fantasy underwater scenes unless the product category naturally calls for them.

Avoid excessive blue tint that changes the product's original colors.

REALISM:
The final image must look like a professionally produced underwater advertising photograph, captured with sophisticated underwater photography and controlled lighting.

Avoid cartoon aesthetics, obvious CGI, excessive distortion and artificial-looking water overlays.

AUTOMATION RULE:
Adapt the underwater environment, depth, lighting, particles, bubbles, water color, caustics and composition automatically according to the product category, materials, colors and original image.

The visual environment should complement the product rather than impose a generic underwater scene.

ABSOLUTE RULE:
Everything that was not explicitly requested to change must remain unchanged from the original image.

The PRODUCT is always the hero.
The UNDERWATER ENVIRONMENT is only a visual setting designed to enhance the product.`,
    previewUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=500&q=80",
    imageRequirement: "required",
    isCommercialPoster: true,
      imageGenBehavior: "abstract",
    styleKeywords: "premium commercial underwater environment, realistic caustic light patterns, volumetric light rays through water, floating micro-bubbles, immersive depth, product unchanged and clearly visible underwater",
  },
  {
    id: "style-360-turntable-view",
    title: "Vista 360° de Producto (360° View)",
    description: "Visualización comercial de producto en 360 grados tipo tornamesa de estudio profesional, mostrando ángulos múltiples consistentes sin alterar el diseño original.",
    category: "Producto (E-commerce)",
    prompt: `Create a premium commercial product presentation using the provided image as the EXACT product reference.

The ORIGINAL PRODUCT must remain visually identical and must be treated as the single source of truth.

PRESERVE ABSOLUTELY:
- exact product geometry
- proportions
- dimensions
- materials
- colors
- textures
- finishes
- components
- construction details
- logos
- typography
- labels
- packaging details
- functional elements
- original design language

DO NOT redesign, reinterpret, improve, simplify, replace or modify the product.

360° VIEW CONCEPT:
Create a professional 360-degree product visualization that communicates the product from multiple viewing angles: [Fondo o estilo de estudio:ej. estudio minimalista con fondo neutro sin costuras e iluminación suave difusa].

The visualization should present the product as if it were photographed on a professional 360° turntable.

Show consistent views corresponding to different rotation angles around the SAME product:
- front
- front three-quarter
- side
- rear three-quarter
- rear
- opposite side
- returning toward the front

The product must maintain EXACTLY the same:
- dimensions
- proportions
- component placement
- materials
- colors
- construction logic
- branding
- surface details

Do not invent details that are not visible or supported by the reference image.

IMPORTANT:
When a surface or component is not visible in the original reference, infer it conservatively from the existing product geometry and design language.

Do NOT invent elaborate features, controls, connectors, openings, textures or components.

GEOMETRIC CONSISTENCY:
Every viewing angle must represent the SAME physical product.

Maintain strict consistency between all angles.

The product must not change shape, size, thickness, proportions or component configuration as the viewing angle changes.

PRESENTATION:
Create a premium e-commerce / commercial 360° product presentation.

Use a clean, neutral studio environment with:
- seamless background
- professional product lighting
- realistic soft shadows
- subtle floor reflection when appropriate
- consistent illumination across all viewing angles
- realistic depth and perspective

The background and lighting must remain consistent throughout the rotation.

CAMERA:
Simulate a professional camera mounted around a rotating product.

Maintain:
- consistent camera height
- consistent focal length
- consistent distance
- consistent perspective
- consistent framing

Only the viewing angle changes.

Do not create exaggerated wide-angle distortion.

REALISM:
The result must look like a real professional 360° product photography session.

Use realistic materials, reflections, shadows and physically coherent lighting.

Avoid:
- CGI-looking surfaces
- artificial geometry
- distorted proportions
- inconsistent product details
- changing logos
- changing colors
- changing components
- fantasy elements
- unnecessary decorative objects

AUTOMATION RULE:
This prompt must work with ANY product category provided as the input image.

Automatically adapt the studio environment, camera framing, lighting and presentation to the product while preserving the product's original identity.

For complex products, maintain every visible structural component consistently across all viewing angles.

For simple products, prioritize clean geometry, accurate proportions and material consistency.

ABSOLUTE RULE:
The provided image defines the product.

Everything that can be determined from the reference must remain consistent.

Do not transform the product into a different design.

The final result must communicate:
"THE EXACT SAME PRODUCT VIEWED FROM 360 DEGREES."

The PRODUCT is always the hero.
The 360° rotation is the presentation method, not a product redesign.`,
    previewUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80",
    imageRequirement: "required",
    isCommercialPoster: true,
      imageGenBehavior: "product",
    styleKeywords: "professional 360-degree turntable product visualization, multiple consistent viewing angles, seamless studio background, uniform professional lighting, product as sole visual subject, e-commerce premium presentation",
  },
  {
    id: "style-ads-lifestyle",
    title: "Ads Lifestyle (Producto en uso)",
    description: "Muestra tu producto siendo usado en un contexto real y aspiracional, perfecto para anuncios de lifestyle en redes sociales.",
    category: "Publicidad y Ads",
    prompt: "A cinematic lifestyle advertising photo of [Producto:ej. unas zapatillas deportivas], being used by a person in a natural aspirational setting, golden hour lighting, shallow depth of field, editorial fashion photography, magazine quality, vibrant colors, authentic and candid mood.",
    previewUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80",
    imageRequirement: "required",
    isCommercialPoster: true,
    imageGenBehavior: "editorial",
    styleKeywords: "cinematic lifestyle advertising photography, product in natural aspirational use context, golden hour lighting, shallow depth of field, editorial magazine quality, authentic candid mood",
  },
  {
    id: "style-ads-hero-shot",
    title: "Hero Shot de Producto",
    description: "Toma tu imagen de producto y la transforma en una foto tipo campaña de marca: fondo dramático, iluminación premium y composición de alta atención.",
    category: "Publicidad y Ads",
    prompt: "A dramatic high-end hero product shot of [Producto:ej. una botella de perfume de lujo], cinematic studio lighting with colored gels, dark moody background, fine mist or smoke effect, luxury brand campaign aesthetics, ultra-sharp focus, 8k commercial photography.",
    previewUrl: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=500&q=80",
    imageRequirement: "required",
    isCommercialPoster: true,
    imageGenBehavior: "product",
    styleKeywords: "dramatic hero product shot, cinematic studio lighting with colored gels, dark moody background, fine mist atmosphere, luxury brand campaign aesthetics, ultra-sharp product focus",
  },
  {
    id: "style-product-explosion",
    title: "Product Explosion (Despiezado de Producto)",
    description: "Desensambla visualmente tu producto mostrando todos sus componentes flotando ordenados alrededor. Perfecto para resaltar calidad de ingredientes o materiales.",
    category: "Publicidad y Ads",
    prompt: "A stunning exploded product view of [Producto:ej. una cápsula de suplemento vitamínico], all individual ingredients and components floating symmetrically around the hero product on a clean white background, premium cosmetic or supplement brand aesthetic, macro photography style, commercial ad quality, no text.",
    previewUrl: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=500&q=80",
    imageRequirement: "required",
    isCommercialPoster: true,
    imageGenBehavior: "product",
    styleKeywords: "exploded product view, individual ingredients and components floating symmetrically around hero product, clean white background, premium brand aesthetic, macro commercial photography, no text overlay",
  },

  // ─── EDITORIAL Y REVISTA ──────────────────────────────────────────────────
  {
    id: "style-magazine-cover",
    title: "Magazine Cover (Portada de Revista)",
    description: "Transforma tu foto en una portada de revista de alta gama. Composición editorial, iluminación de estudio y espacio reservado para título y subtítulos.",
    category: "Editorial y Revista",
    prompt: "A stunning [Tipo de revista:ej. Vogue] magazine cover featuring [Sujeto o producto:ej. una modelo en vestido rojo], professional editorial studio photography, dramatic high-contrast lighting, cover composition with negative space at the top for a masthead, premium fashion magazine aesthetic, glossy finish look, ultra-detailed.",
    previewUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=500&q=80",
    imageRequirement: "required",
    isCommercialPoster: true,
    imageGenBehavior: "editorial",
    styleKeywords: "premium fashion magazine cover composition, professional editorial studio photography, dramatic high-contrast lighting, negative space at top for masthead, glossy magazine aesthetic",
  },
  {
    id: "style-magazine-spread",
    title: "Editorial Spread (Doble Página)",
    description: "Crea una composición editorial de doble página tipo revista de moda o lifestyle, con espacio para texto y un visual impactante como protagonista.",
    category: "Editorial y Revista",
    prompt: "A full bleed editorial magazine double-page spread featuring [Tema o sujeto:ej. colección de ropa de invierno], cinematic wide composition, moody or vibrant color grading depending on the subject, high fashion editorial photography, luxury lifestyle aesthetic, professional retouching, space reserved on one side for copy text.",
    previewUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=500&q=80",
    imageRequirement: "required",
    isCommercialPoster: true,
    imageGenBehavior: "editorial",
    styleKeywords: "full bleed editorial magazine double-page spread, cinematic wide composition, high fashion editorial photography, luxury lifestyle aesthetic, space reserved for copy text",
  },
  {
    id: "style-brand-campaign",
    title: "Brand Campaign (Campaña de Marca)",
    description: "Genera un visual de campaña de marca completo: concepto, sujeto, mensaje visual y estética coherente de marca en una sola imagen.",
    category: "Publicidad y Ads",
    prompt: "A powerful [Marca o industria:ej. marca de ropa deportiva] brand campaign hero image featuring [Sujeto:ej. atleta corriendo en ciudad al amanecer], bold cinematic composition, brand color palette tones, inspirational mood, commercial campaign photography quality, wide-format billboard composition, dynamic motion blur, aspirational lifestyle.",
    previewUrl: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=500&q=80",
    imageRequirement: "required",
    isCommercialPoster: true,
    imageGenBehavior: "editorial",
    styleKeywords: "brand campaign hero image, bold cinematic composition, aspirational lifestyle mood, commercial campaign photography quality, wide billboard format, dynamic motion, inspirational atmosphere",
  },
  {
    id: "style-everyday-real",
    title: "Toma Real y Cotidiana (UGC)",
    description: "Coloca tu producto en un entorno real, natural y casual, como si fuera una foto tomada por un cliente con su teléfono.",
    category: "Fotorealismo",
    prompt: "A highly realistic casual lifestyle photo of [Producto:ej. una lata de bebida], placed on a [Superficie:ej. mesa de madera rústica] in a [Entorno:ej. terraza soleada], next to [Acompañamiento:ej. un tazón con mangos frescos], natural daylight, candid everyday shot, authentic UGC style, shot on iPhone 14 Pro, photorealistic.",
    previewUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&q=80",
    imageRequirement: "required",
    isCommercialPoster: true,
    imageGenBehavior: "product",
    styleKeywords: "authentic UGC style casual lifestyle product photo, natural daylight, candid everyday environment, real surfaces and settings, shot on smartphone aesthetic, unposed natural composition",
  },
  {
    id: "style-pro-studio-splash",
    title: "Sesión Profesional de Estudio",
    description: "Transforma una foto simple en una fotografía comercial de alta gama con iluminación dramática, condensación y elementos de fondo.",
    category: "Fotorealismo",
    prompt: "A high-end professional commercial studio photography of [Producto:ej. una lata de bebida], covered in fresh condensation water drops, resting on a wet dark surface, dramatic rim lighting, vibrant [Color de luz de fondo:ej. azul oscuro y dorado] background, premium advertising aesthetics, 8k resolution, macro lens.",
    previewUrl: "https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=500&q=80",
    imageRequirement: "required",
    isCommercialPoster: true,
    imageGenBehavior: "product",
    styleKeywords: "high-end professional commercial studio photography, dramatic rim lighting, fresh condensation water drops on product, premium advertising aesthetics, macro lens detail, studio backdrop",
  },
  {
    id: "style-newspaper-frontpage",
    title: "Portada de Periódico",
    description: "Integra tu producto como la noticia principal en la portada de un periódico impreso.",
    category: "Editorial y Revista",
    prompt: "A photorealistic mockup of a folded daily newspaper lying on a table, the main front page article features a large prominent photo of [Producto:ej. una lata de bebida energética], traditional newspaper layout with columns of text and headlines, morning news aesthetic, natural soft window lighting, highly detailed.",
    previewUrl: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=500&q=80",
    imageRequirement: "required",
    isCommercialPoster: true,
    imageGenBehavior: "editorial",
    styleKeywords: "photorealistic newspaper front page mockup, traditional print newspaper layout, prominent featured product photo, morning news aesthetic, natural window lighting, editorial composition",
  },
  {
    id: "style-dynamic-ad-splash",
    title: "Arte Dinámico (Redes Sociales)",
    description: "Un diseño explosivo e impactante con salpicaduras y elementos volando, ideal para anuncios llamativos. Sin texto para agregarlo después.",
    category: "Publicidad y Ads",
    prompt: "An explosive and dynamic commercial product shot of [Producto:ej. una lata de bebida energética], surrounded by flying [Elementos voladores:ej. trozos de mango y hojas de menta], spectacular liquid splashes, vibrant high-contrast colors, dramatic studio lighting, extreme action freeze-frame, hyper-detailed 3D render style, clean background for typography, no text.",
    previewUrl: "https://images.unsplash.com/photo-1556881286-fc6915169721?w=500&q=80",
    imageRequirement: "required",
    isCommercialPoster: true,
    imageGenBehavior: "product",
    styleKeywords: "explosive dynamic commercial product shot, flying ingredients and elements surrounding the product, spectacular liquid splashes frozen in mid-air, vibrant high-contrast colors, action freeze-frame, no text overlay",
  },
  {
    id: "style-3d-billboard",
    title: "Valla Publicitaria 3D (Times Square)",
    description: "Simula una espectacular valla publicitaria anamórfica 3D en una calle muy transitada estilo Times Square o Tokio.",
    category: "Publicidad y Ads",
    prompt: "An ultra-realistic nighttime photography of a giant anamorphic 3D digital billboard on a modern skyscraper building in a busy city like Times Square, the billboard displays a stunning glowing 3D render of [Producto:ej. una lata de bebida], the product appears to be popping out of the screen, neon lights, rainy street reflections, crowds of people walking below, cinematic cyberpunk city vibe, highly detailed.",
    previewUrl: "https://images.unsplash.com/photo-1555921015-5532091f6026?w=500&q=80",
    imageRequirement: "required",
    isCommercialPoster: true,
    imageGenBehavior: "abstract",
    styleKeywords: "giant anamorphic 3D digital billboard on a city skyscraper, product popping out of the billboard screen, Times Square style nighttime cityscape, neon lights, rainy reflections, crowds below, cinematic cyberpunk atmosphere",
  },
  {
    id: "style-food-ad-minimalist",
    title: "Póster Gastronómico Swiss & Behance (Food Ad)",
    description: "Publicidad gastronómica moderna estilo diseño suizo y Behance, con producto héroe flotante, tipografía grande de fondo, etiquetas redondeadas y composición editorial de app.",
    category: "Gastronomía & Carteles",
    categories: ["Gastronomía & Carteles", "Publicidad y Ads", "Minimalista"],
    prompt: "[Nombre del Producto:ej. Vanilla Latte] STYLE & ART DIRECTION: Modern minimalist food advertising aesthetics, Swiss-style advertising composition, premium restaurant social media branding, editorial design for an FMCG campaign, visuals for startup food brands, Pinterest-style food poster aesthetics, playful geometric advertising structure, modern in-app branding style, minimalist luxury restaurant marketing. MAIN OBJECT: Hyper-realistic food hero of [Nombre del Producto:ej. Vanilla Latte] placed in the center of the composition using the reference image as the exact physical product, striking premium food photography design, floating or suspended presentation, realistic glossy textures, detailing of fresh ingredients, mouth-watering commercial presentation, studio-quality dish rendering, premium restaurant advertising campaign atmosphere. LAYOUT & COMPOSITION: Maintain the EXACT composition structure as sampled: large, rounded organic cream background centered on a vibrant full-color backdrop, large, lowercase type placed behind the protagonist and the hero's food object positioned in the center, overlapping, small branding/navigation strip aligned at the top, short editorial text block positioned on the left, floating rounded ingredient or flavor labels in the UI aligned vertically on the right, minimal decorative micro-icons, clean asymmetrical spacing, large breakout room, premium minimalist style hierarchy, social media poster composition. Typography: Large, bold typeface with rounded lowercase letters spelling '[Nombre del Producto:ej. vanilla latte]', modern geometric sans-serif font system, minimal supporting text, clear typography hierarchy for emerging brands, soft, rounded commercial lettering, large-scale typography treatment hidden behind objects. DEPTH AND LIGHT: Soft premium studio lighting, high-quality food highlights, realistic soft shadows, subtle glossy reflections, cinematic commercial lighting, highly detailed texture rendering, high-quality depth separation. ADDITIONAL DESIGN DETAILS: Rounded pill-shaped labels, small plus icons, minimal floating elements in the UI, app-like composition, fresh ingredient garnish, soft shadow blending, modern food delivery branding system, clean visuals, minimal geometric balance. COLOR PALETTE: [Color Primario de Marca:ej. light brown], cream/off-white, warm accent tones, high-contrast food colors, minimal black typography accents, a modern premium commercial palette. Quality: Ultra-high resolution, Behance-level food ad quality, 8k commercial rendering, Pinterest-style restaurant ad campaign design, premium FMCG branding aesthetics, professional art direction, high-quality editorial food poster.",
    previewUrl: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&q=80",
    imageRequirement: "required",
    isCommercialPoster: true,
    imageGenBehavior: "product",
    styleKeywords: "modern minimalist food advertising aesthetics, Swiss-style composition, food hero floating presentation, premium restaurant campaign, realistic glossy food textures, mouth-watering commercial food photography, soft studio lighting",
  },
  {
    id: "style-food-combo-ad",
    title: "Anuncio de Combo Promocional (Combo Ad)",
    description: "Convierte tu plato en un combo publicitario completo con acompañamientos (papas, bebida), titular en mayúsculas, badge de contenido, precio destacado en amarillo y CTA, con espacio negativo superior para no tapar la comida.",
    category: "Gastronomía & Carteles",
    categories: ["Gastronomía & Carteles", "Publicidad y Ads"],
    prompt: `Commercial food advertising poster layout for social media with strict two-tier composition.
COMPOSITION & SPATIAL HIERARCHY:
- LOWER 55%-60%: High-end commercial food photography featuring [Nombre del Plato Principal:ej. una hamburguesa gourmet con queso fundido y tocino crujiente], accompanied by crispy golden french fries and a tall glass of cold soda with ice cubes and condensation drops, arranged cleanly on a dark rustic wooden table in a warm atmospheric pub setting. The food dish is 100% unobstructed, glistening, and mouth-watering.
- UPPER 40%-45%: Clean, dark, moody atmospheric negative space (copyspace) with subtle soft rising steam and vignette, reserved exclusively for advertising typography.

GRAPHIC DESIGN & ON-IMAGE TYPOGRAPHY (MANDATORY RENDERED TEXT):
STRICT PLACEMENT AND NEGATIVE RULE: All rendered typography, headlines, subtitles, badges, prices, and stickers MUST be located strictly within the upper dark negative space (copyspace) or upper side margins. Typography and stickers MUST NEVER overlap, touch, obscure, or cover the food dish, burger, fries, or drink. The dish remains 100% clean, unobstructed, and appetizing in the lower half of the frame.
- Top Headline: Large bold white uppercase typography prominently centered in the upper dark negative space reading "[Nombre del Combo:ej. COMBO BURGER]"
- Subtitle Bar: Clean uppercase tagline in a subtle underline frame reading "[Subtítulo o Eslogan:ej. EL PLAN PERFECTO]"
- Content Badge: Circular dark badge with white text floating in the upper-left margin reading "[Contenido del Combo:ej. BURGER + PAPAS + BEBIDA]"
- Highlighted Price Tag: High-contrast bright yellow ribbon sticker floating cleanly in the upper-right corner with bold black numbers reading "[Precio:ej. $24.900]"
- Call to Action: Compact rounded promotional pill sticker reading "[Texto CTA:ej. ¡ORDENA AHORA!]" positioned cleanly at the bottom edge without touching the food plate.

All rendered typography must be sharp, high contrast, perfectly legible and stylized like a real restaurant advertising poster. Food hero is 100% visible and delicious below, 8k resolution, professional commercial food photography.`,
    previewUrl: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=500&q=80",
    imageRequirement: "required",
    isCommercialPoster: true,
    imageGenBehavior: "product",
    styleKeywords: "commercial food combo advertising poster, two-tier layout, upper 40% dark copyspace for bold crisp on-image typography 'COMBO BURGER', subtitle 'EL PLAN PERFECTO', circular badge 'BURGER + PAPAS + BEBIDA', vibrant yellow price badge '$24.900' in upper corner, compact CTA sticker '¡ORDENA AHORA!', mouth-watering burger with fries and cold soda 100% unobstructed in lower 60% on dark table, text never overlaps food",
  },
  {
    id: "style-food-dish-launch",
    title: "Lanzamiento de Nuevo Plato (Signature Dish Launch)",
    description: "Campaña de lanzamiento para un nuevo plato de autor: kicker 'NUEVO EN NUESTRO MENÚ', gran titular del plato, subtítulo de sabor, 3 badges de beneficios con iconos y botón '¡PRUÉBALO HOY!', con cabecera oscura superior.",
    category: "Gastronomía & Carteles",
    categories: ["Gastronomía & Carteles", "Publicidad y Ads", "Editorial y Revista"],
    prompt: `Premium commercial restaurant launch advertisement poster with clear two-tier layout hierarchy.
COMPOSITION & SPATIAL HIERARCHY:
- LOWER 55%-60%: High-end culinary photography of [Nombre del Plato:ej. Pollo al Curry cremoso con arroz basmati y pan naan recién horneado], served in a rustic ceramic bowl with fresh herb garnishes and delicate rising steam, completely unobstructed and glistening on a dark wooden table in an authentic restaurant setting.
- UPPER 40%-45%: Clean, dark, elegant atmospheric negative space with subtle botanical framing, reserved exclusively for editorial typography and brand elements.

GRAPHIC DESIGN & ON-IMAGE TYPOGRAPHY (MANDATORY RENDERED TEXT):
STRICT PLACEMENT AND NEGATIVE RULE: All typography and badges MUST be placed strictly in the upper dark negative space header. Text must NEVER overlap, touch, cover, or obscure the food, bowl, or ingredients.
- Top Kicker: Small centered uppercase typography at the top reading "[Encabezado Superior:ej. NUEVO EN NUESTRO MENÚ]"
- Main Dish Headline: Large, imposing serif typography centered in the upper negative space reading "[Nombre del Plato:ej. POLLO AL CURRY]"
- Flavor Descriptor: Neat spaced descriptive subtitle under the headline reading "[Descripción de Sabor:ej. CREMOSO. AUTÉNTICO. DELICIOSO.]"
- Feature Attribute Badges: Three clean minimalist icon badges positioned in the upper section reading "[Beneficio 1:ej. INGREDIENTES NATURALES]", "[Beneficio 2:ej. RECETA AUTÉNTICA]", and "[Beneficio 3:ej. UN SABOR INOLVIDABLE]"
- Bottom CTA Button: Warm golden-amber rounded pill button with bold dark text reading "[Texto CTA:ej. ¡PRUÉBALO HOY!]" at the very bottom margin, clear of the food.

Seamless graphic design layout, crisp legible typography in the upper copyspace, mouth-watering gourmet dish hero clean and unobstructed below, editorial restaurant campaign aesthetic, 8k resolution.`,
    previewUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?w=500&q=80",
    imageRequirement: "required",
    isCommercialPoster: true,
    imageGenBehavior: "editorial",
    styleKeywords: "restaurant signature dish launch poster, two-tier composition, crisp on-image typography in upper 40% copyspace 'NUEVO EN NUESTRO MENÚ', bold dish title 'POLLO AL CURRY', subtitle 'CREMOSO. AUTÉNTICO. DELICIOSO.', feature badges 'INGREDIENTES NATURALES' and 'RECETA AUTÉNTICA', amber CTA button '¡PRUÉBALO HOY!', gourmet bowl presentation 100% unobstructed in lower 60%, text never covers food",
  },
  {
    id: "style-food-hero-poster",
    title: "Póster Publicitario de Alto Impacto (Food Hero Poster)",
    description: "Póster vertical dramático y cinematográfico con acción apetitosa: titular grande en zona superior oscura, frase de calidad lateral y sticker circular llamativo sin tapar el plato.",
    category: "Gastronomía & Carteles",
    categories: ["Gastronomía & Carteles", "Publicidad y Ads"],
    prompt: `Dramatic high-impact commercial food advertising poster with dynamic vertical composition.
COMPOSITION & SPATIAL HIERARCHY:
- LOWER 55%-60%: Dynamic action photography hero shot of [Nombre del Plato:ej. Pizza Artesanal Napolitana recién horneada], featuring an irresistible cheese pull with melted stringy mozzarella stretching upwards, fresh basil leaves and ripe cherry tomatoes floating dynamically, 100% visible, delicious, and unobstructed.
- UPPER 40%-45%: Dark moody restaurant background with dramatic warm rim lighting, designed as clean negative space (copyspace) for bold typography.

GRAPHIC DESIGN & ON-IMAGE TYPOGRAPHY (MANDATORY RENDERED TEXT):
STRICT PLACEMENT AND NEGATIVE RULE: Typography and stickers MUST sit exclusively in the upper dark negative space or top side margin. Text and badges MUST NEVER overlap, touch, or obscure the main food item or cheese pull.
- Giant Dish Headline: Large bold serif/sans uppercase typography for "[Nombre del Plato:ej. PIZZA]" combined with fluid, dynamic cursive script for "[Palabra de Impacto:ej. Irresistible]", rendered boldly in the upper dark negative space.
- Left Quality Tagline: Clean vertical text block in the upper-left margin reading "[Lema de Calidad:ej. INGREDIENTES FRESCOS. SABOR PERFECTO.]"
- Circular CTA Sticker: High-contrast round yellow badge sticker floating in the upper-right corner with bold dark text reading "[Texto Sticker CTA:ej. ¡ORDENA AHORA!]"

Cinematic restaurant advertising aesthetics, high-energy composition, crisp typography overlay in top copyspace, glistening appetizing textures 100% unobstructed below, 8k resolution.`,
    previewUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80",
    imageRequirement: "required",
    isCommercialPoster: true,
    imageGenBehavior: "product",
    styleKeywords: "dramatic action food advertising poster, two-tier layout, on-image typography in upper 40% copyspace with bold header 'PIZZA' and script 'Irresistible', side copy 'INGREDIENTES FRESCOS. SABOR PERFECTO.', circular yellow sticker '¡ORDENA AHORA!' in upper corner, dynamic melted cheese pull 100% unobstructed in lower 60%, dark moody cinematic lighting, text never covers food",
  },
  {
    id: "style-food-menu-visual",
    title: "Ficha Editorial de Carta & Menú (Menu Visual Board)",
    description: "Diseño editorial refinado de carta y menú gastronómico: nombre en cursiva elegante, subtítulo descriptivo, precio grande en destaque en cabecera superior y plato completamente visible.",
    category: "Gastronomía & Carteles",
    categories: ["Gastronomía & Carteles", "Publicidad y Ads", "Producto (E-commerce)"],
    prompt: `Refined editorial restaurant menu visual board with balanced vertical hierarchy.
COMPOSITION & SPATIAL HIERARCHY:
- LOWER 55%-60%: Premium commercial food photography of [Nombre del Plato:ej. Biryani de Arroz Especiado con Pollo], served in an authentic ornate metal bowl with aromatic spices, fresh coriander garnish, and traditional tableware, completely unobstructed in a softly blurred culinary setting.
- UPPER 40%-45%: Warm, softly blurred dark culinary negative space providing ample clean copyspace for elegant menu typography and pricing.

GRAPHIC DESIGN & ON-IMAGE TYPOGRAPHY (MANDATORY RENDERED TEXT):
STRICT PLACEMENT AND NEGATIVE RULE: All menu typography MUST be positioned in the upper dark negative space. Text must NEVER overlap, cover, or touch the food bowl, rice, or plate.
- Calligraphic Signature Title: Large, fluid elegant script typography at the top reading "[Nombre en Cursiva:ej. Biryani]"
- Subtitle: Clean geometric uppercase text reading "[Subtítulo del Plato:ej. ARROZ ESPECIADO CON POLLO]"
- Tradition Tagline: Delicate italic sentence reading "[Lema Tradicional:ej. Tradición en cada bocado]"
- Prominent Price Tag: Large bold price typography in clear contrasting numerals floating in the upper-right corner reading "[Precio:ej. $29.900]"
- Feature Attribute Badges: Three neatly stacked minimalist icon badges in the upper section reading "[Atributo 1:ej. ESPECIAS NATURALES]", "[Atributo 2:ej. RECETA TRADICIONAL]", and "[Atributo 3:ej. SABOR INOLVIDABLE]"

Sophisticated editorial menu card composition, generous upper negative space for text, unobstructed authentic gourmet presentation below, 8k resolution.`,
    previewUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&q=80",
    imageRequirement: "required",
    isCommercialPoster: true,
    imageGenBehavior: "product",
    styleKeywords: "editorial restaurant menu board poster, two-tier composition, crisp on-image typography in upper 40% copyspace with calligraphic script 'Biryani', uppercase subtitle 'ARROZ ESPECIADO CON POLLO', bold price '$29.900' in upper corner, attribute badges 'ESPECIAS NATURALES' and 'RECETA TRADICIONAL', authentic traditional gourmet presentation 100% unobstructed in lower 60%, text never covers food",
  },
  {
    id: "style-food-cafe-lifestyle",
    title: "Cafetería Lifestyle & Momentos (Café Lifestyle)",
    description: "Cartel cálido y aspiracional de cafetería: titular emocional en espacio superior, subtítulo en cursiva con corazón y taza con arte latte completamente despejada abajo.",
    category: "Gastronomía & Carteles",
    categories: ["Gastronomía & Carteles", "Editorial y Revista", "Fotorealismo"],
    prompt: `Cozy and aspirational café lifestyle commercial advertising poster with balanced two-tier composition.
COMPOSITION & SPATIAL HIERARCHY:
- LOWER 55%-60%: Atmospheric commercial photography of [Bebida o Producto:ej. una taza de café cappuccino artesanal con arte latte en taza de cerámica rústica], paired with a golden flaky croissant, resting on a warm wooden coffee table in soft natural morning sunlight with blurred café plants in the background, 100% unobstructed.
- UPPER 40%-45%: Warm, soft, atmospheric negative space with softly blurred café background, reserved for lifestyle typography.

GRAPHIC DESIGN & ON-IMAGE TYPOGRAPHY (MANDATORY RENDERED TEXT):
STRICT PLACEMENT AND NEGATIVE RULE: All typography MUST be rendered in the upper negative space. Text must NEVER cover, overlap, or touch the coffee cup, latte art, or croissant.
- Main Headline: Large stylized white typography combining bold and serif lettering in the upper area reading "[Titular Emocional:ej. BUEN CAFÉ DÍAS MÁS LINDOS]"
- Emotional Subtitle: Elegant script cursive text with heart icon reading "[Subtítulo Cercano:ej. Un momento para ti ♡]"
- Side Rhythm Tagline: Minimalist spaced uppercase typography in the upper-left margin reading "[Frase de Ritmo:ej. PAUSA. DISFRUTA. REPITE.]"
- Bottom Icon Badges: Three minimalist line-art icon badges aligned horizontally at the upper or lower edge reading "[Insignia 1:ej. CAFÉ DE ESPECIALIDAD]", "[Insignia 2:ej. BUENOS MOMENTOS]", and "[Insignia 3:ej. SIEMPRE UNA BUENA IDEA]"

Artistic aesthetic coffee shop campaign layout, soft organic tones, crisp legible lettering in upper copyspace, unobstructed appetizing beverage below, 8k resolution.`,
    previewUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=500&q=80",
    imageRequirement: "required",
    isCommercialPoster: true,
    imageGenBehavior: "editorial",
    styleKeywords: "warm cafe lifestyle advertising poster, two-tier layout, crisp on-image typography in upper 40% copyspace 'BUEN CAFÉ DÍAS MÁS LINDOS', cursive script 'Un momento para ti', side text 'PAUSA. DISFRUTA. REPITE.', icon badges 'CAFÉ DE ESPECIALIDAD' and 'BUENOS MOMENTOS', latte art with croissant 100% unobstructed on wooden table below, text never covers cup",
  },
  {
    id: "style-food-delivery-ad",
    title: "Anuncio Delivery & Para Llevar (Food Delivery Ad)",
    description: "Publicidad de delivery de alto impacto: titular en cabecera oscura superior, badges de servicio (Rápido, Seguro, A tiempo) y comida para llevar 100% visible abajo.",
    category: "Gastronomía & Carteles",
    categories: ["Gastronomía & Carteles", "Publicidad y Ads"],
    prompt: `High-impact commercial food delivery advertising poster with clean two-zone composition.
COMPOSITION & SPATIAL HIERARCHY:
- LOWER 55%-60%: Tempting commercial photography of [Plato Principal:ej. una hamburguesa doble con queso derretido y tocino], accompanied by golden french fries in a takeout carton and a cold drink with straw, next to a branded brown kraft paper delivery bag with a round stamp logo reading "[Nombre en Bolsa:ej. TASTY BITES]", fully visible on a dark rustic surface.
- UPPER 40%-45%: Dark moody restaurant backdrop with warm ambient lights, designed as clean negative space (copyspace) for promotional typography.

GRAPHIC DESIGN & ON-IMAGE TYPOGRAPHY (MANDATORY RENDERED TEXT):
STRICT PLACEMENT AND NEGATIVE RULE: All promotional text MUST be positioned strictly in the upper negative space header. Text must NEVER overlap, cover, or obscure the food, burger, fries, or drink.
- Top Headline: Large condensed bold typography with crisp white and yellow lettering in the upper negative space reading "[Titular de Delivery:ej. TU COMIDA FAVORITA EN TU CASA]"
- Delivery Feature Badges: Three clean icon badges positioned directly beneath the headline in the upper zone reading "[Beneficio 1:ej. RÁPIDO]", "[Beneficio 2:ej. SEGURO]", and "[Beneficio 3:ej. A TIEMPO]"
- Promotional CTA Button: Bright yellow rounded rectangular button with arrow reading "[Texto Botón CTA:ej. ¡ORDENA AHORA! ->]" floating in the upper right or bottom edge without touching the food.
- Bottom Footer Tagline: Clean modern text at bottom right margin reading "[Lema Secundario:ej. COMIDA REAL EN CUALQUIER LUGAR]"

High-energy commercial delivery ad design, perfectly readable bold fonts in upper copyspace, irresistible food hero 100% unobstructed below, 8k resolution.`,
    previewUrl: "https://images.unsplash.com/photo-1526367790999-0150786686a2?w=500&q=80",
    imageRequirement: "required",
    isCommercialPoster: true,
    imageGenBehavior: "product",
    styleKeywords: "commercial food delivery poster, two-tier layout, bold on-image typography in upper 40% copyspace 'TU COMIDA FAVORITA EN TU CASA', icon badges 'RÁPIDO', 'SEGURO', 'A TIEMPO', kraft paper delivery bag with logo, yellow CTA button '¡ORDENA AHORA! ->', footer tagline 'COMIDA REAL EN CUALQUIER LUGAR', food hero 100% unobstructed in lower 60%, text never covers food",
  },
  {
    id: "style-food-special-offer",
    title: "Oferta Especial & Descuento Flash (Special Offer Promo)",
    description: "Cartel promocional de alta urgencia: titular '¡OFERTA ESPECIAL!', descuento gigante en cabecera superior y plato gourmet completamente despejado abajo.",
    category: "Gastronomía & Carteles",
    categories: ["Gastronomía & Carteles", "Publicidad y Ads"],
    prompt: `Limited-time restaurant promotional advertisement poster with split vertical layout.
COMPOSITION & SPATIAL HIERARCHY:
- LOWER 55%-60%: Appetizing commercial food photography of [Plato en Promoción:ej. un plato abundante de pasta fettuccine con salsa cremosa de champiñones y queso parmesano], presented in a ceramic bowl on a rustic dining table with fresh herbs, completely unobstructed and glistening.
- UPPER 40%-45%: Dark, rich, atmospheric restaurant background dedicated exclusively to high-urgency promotional typography.

GRAPHIC DESIGN & ON-IMAGE TYPOGRAPHY (MANDATORY RENDERED TEXT):
STRICT PLACEMENT AND NEGATIVE RULE: All promotional typography MUST be located exclusively in the upper dark negative space. Text must NEVER overlap, touch, cover, or obscure the food, pasta, bowl, or plate.
- Top Promo Headline: Bold high-energy typography at top reading "[Titular Promocional:ej. ¡OFERTA ESPECIAL!]"
- Urgency Badge: Minimalist clock icon with text reading "[Vigencia o Urgencia:ej. POR TIEMPO LIMITADO]"
- Giant Discount Callout: Massive, highly visible bold typography in the upper center reading "[Descuento Destacado:ej. 20% DE DESCUENTO]"
- Category Pill Badge: High-contrast rounded pill banner below the discount reading "[Categoría o Producto:ej. EN TODA LA PASTA]"
- Bottom CTA Button: Bright yellow rounded rectangle button with arrow reading "[Texto Botón CTA:ej. ¡ORDENA AHORA! ->]" placed at the bottom edge away from the plate.

High-conversion promotional social media ad design, crisp legible typography in upper negative space, mouth-watering gourmet dish hero completely clean below, 8k resolution.`,
    previewUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&q=80",
    imageRequirement: "required",
    isCommercialPoster: true,
    imageGenBehavior: "product",
    styleKeywords: "promotional discount food ad poster, two-tier layout, on-image typography in upper 40% copyspace '¡OFERTA ESPECIAL!', clock badge 'POR TIEMPO LIMITADO', massive discount text '20% DE DESCUENTO', pill banner 'EN TODA LA PASTA', yellow CTA button '¡ORDENA AHORA! ->', gourmet pasta dish hero 100% unobstructed in lower 60%, text never covers food",
  },
  {
    id: "style-food-brand-experience",
    title: "Experiencia de Marca de Prestigio (Brand Experience Ad)",
    description: "Branding comercial de prestigio: composición sofisticada de dos niveles con iluminación atmosférica de alta gama y espacio visual despejado para tipografía publicitaria.",
    category: "Publicidad y Ads",
    categories: ["Publicidad y Ads", "Gastronomía & Carteles", "Editorial y Revista"],
    prompt: `High-end commercial branding and advertising poster with clean visual hierarchy.
COMPOSITION & SPATIAL HIERARCHY:
- LOWER 55%-60%: Stunning commercial photography of [Producto o Sujeto Destacado:ej. un producto estrella / una casa prefabricada moderna], 100% unobstructed, glistening with premium commercial lighting.
- UPPER 40%-45%: Sophisticated atmospheric ambiance with warm bokeh and rim lighting, reserved entirely for clean brand typography and headline.
Luxury commercial marketing aesthetic, sharp legible layout, hero subject completely unobstructed in the lower half, 8k resolution.`,
    previewUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500&q=80",
    imageRequirement: "required",
    isCommercialPoster: true,
    imageGenBehavior: "editorial",
    styleKeywords: "high-end brand experience ad poster, two-tier layout, upper 40% clean copyspace, hero subject 100% unobstructed in lower 60%, sophisticated warm lighting, 8k commercial finish",
  },
  {
    id: "style-food-split-lateral",
    title: "Póster Asimétrico Split Lateral (Texto al Costado & Sujeto a la Derecha)",
    description: "Composición publicitaria editorial de dos columnas: margen izquierdo amplio y limpio para textos y precio; sujeto o producto estrella 100% despejado a la derecha.",
    category: "Publicidad y Ads",
    categories: ["Publicidad y Ads", "Gastronomía & Carteles", "Editorial y Revista"],
    prompt: `Two-column asymmetrical commercial advertising poster layout for social media.
COMPOSITION & SPATIAL HIERARCHY:
- RIGHT SIDE (55%-60% width): Premium high-end commercial photography featuring [Producto o Sujeto Destacado:ej. un producto estrella / una casa prefabricada], clean and 100% unobstructed with dramatic commercial rim lighting.
- LEFT SIDE (40%-45% width): Dedicated dark atmospheric negative space (copyspace) with subtle warm lighting, designed exclusively for advertising typography and pricing.
Sophisticated advertising poster design, asymmetrical two-column layout, clean copyspace on the left, hero subject clear on the right, 8k resolution.`,
    previewUrl: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500&q=80",
    imageRequirement: "required",
    isCommercialPoster: true,
    imageGenBehavior: "editorial",
    styleKeywords: "asymmetrical split commercial advertising poster, left 45% dark copyspace for bold typography, hero subject 100% unobstructed on right 55%, editorial advertising layout, 8k",
  },
  {
    id: "style-food-recipe-ingredients",
    title: "Ficha Descriptiva con Tira de Características (Feature Board)",
    description: "Cartel editorial con tira de características: titular superior, producto protagonista en el centro y tira inferior con iconos de especificaciones.",
    category: "Publicidad y Ads",
    categories: ["Publicidad y Ads", "Gastronomía & Carteles", "Editorial y Revista"],
    prompt: `Vertical commercial advertising poster and feature board layout.
COMPOSITION & SPATIAL HIERARCHY:
- UPPER SECTION: Dark atmospheric vignette with elegant editorial negative space.
- CENTER SECTION (50% of frame): Mouth-watering commercial hero photography of [Producto o Sujeto Destacado:ej. un producto estrella / una casa prefabricada], completely clear and unobstructed.
- LOWER SECTION (25% of frame): Clean dark translucent board with breathing room for minimalist spec badges.
Editorial commercial campaign, crisp clean composition, hero subject in center, 8k resolution.`,
    previewUrl: "https://images.unsplash.com/photo-1621996346565-e3d5d62817d2?w=500&q=80",
    imageRequirement: "required",
    isCommercialPoster: true,
    imageGenBehavior: "editorial",
    styleKeywords: "feature board commercial poster, hero subject in center, clean upper header negative space, lower translucent specs board, 8k resolution",
  },
  {
    id: "style-food-express-time",
    title: "Cartel Comercial de Alta Energía (High Impact Ad)",
    description: "Publicidad de alta energía para llamados directos: titular impactante, toma en ángulo dinámico y margen inferior con espacio para sellos de calidad.",
    category: "Publicidad y Ads",
    categories: ["Publicidad y Ads", "Gastronomía & Carteles"],
    prompt: `High-impact commercial advertising poster layout.
COMPOSITION & SPATIAL HIERARCHY:
- UPPER 35%: Clean dark atmospheric background with wide open negative space.
- CENTER 45%: Dynamic action commercial photography hero shot of [Producto o Sujeto Destacado:ej. un producto estrella / una casa prefabricada], 100% visible and pristine.
- LOWER 20%: Dedicated dark margin with space for quality badges.
High-energy commercial advertising poster, hero shot in center, 8k resolution.`,
    previewUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&q=80",
    imageRequirement: "required",
    isCommercialPoster: true,
    imageGenBehavior: "product",
    styleKeywords: "high-impact commercial poster, hero shot in center, clean upper 35% negative space, lower margin for badges, 8k resolution",
  },
];

/**
 * Fusiona un prompt de estilo con directivas de encuadre asimétrico decididas por el Agente Director de Arte.
 */
export function composePromptWithArtDirection(
  basePrompt: string,
  layoutPosition: "split_left" | "split_right" | "top_banner" | "recipe_ingredients" = "top_banner",
  productName: string = "the dish"
): string {
  const directiveMap: Record<string, string> = {
    split_left: `SPATIAL COMPOSITION MANDATE (ASYMMETRICAL SPLIT):
- The hero ${productName} MUST be positioned strictly within the right 50% of the frame.
- The left 50% MUST be an uncluttered, dimly lit surface with soft bokeh, purposefully leaving wide open clean negative space for graphic design typography. Centered product is strictly forbidden. Clean photography without any text or letters.`,
    split_right: `SPATIAL COMPOSITION MANDATE (ASYMMETRICAL SPLIT):
- The hero ${productName} MUST be positioned strictly within the left 50% of the frame.
- The right 50% MUST be an uncluttered, soft-focus background leaving expansive clean negative space for graphic design. Clean photo without any letters.`,
    recipe_ingredients: `SPATIAL COMPOSITION MANDATE (CULINARY BOARD):
- Clean overhead flat-lay restaurant presentation of ${productName} positioned in the middle third of the frame.
- Generous clean negative space at the upper header and lower footer margins for recipe cards. Clean photo without text.`,
    top_banner: `SPATIAL COMPOSITION MANDATE (HERO BANNER):
- The hero ${productName} is positioned in the lower-middle half of the frame at a 45-degree angle.
- Clean open atmospheric background at the top header leaving space for typography. Clean photo without text.`,
  };

  const directive = directiveMap[layoutPosition] || directiveMap.top_banner;
  return `${basePrompt}\n\n${directive}`;
}

