export type ImageRequirement = 'none' | 'optional' | 'required';

export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  prompt: string;
  previewUrl: string;
  imageRequirement: ImageRequirement;
  isCommercialPoster?: boolean;
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
  },
  {
    id: "style-blueprint",
    title: "Blueprint (Plano técnico)",
    description: "Dibuja esquemas con líneas blancas o celestes sobre un fondo azul oscuro, estilo arquitectura o ingeniería.",
    category: "Estilos Técnicos",
    prompt: "A classic architectural blueprint of [Estructura u objeto:ej. un cohete espacial], white and light blue technical lines on a dark navy blue background, precise measurements, drafting aesthetic, engineering schematic.",
    previewUrl: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=500&q=80",
    imageRequirement: "optional",
  },
  {
    id: "style-anatomy",
    title: "Cross-section (Corte transversal)",
    description: "Corta un objeto a la mitad para mostrar sus capas y su interior con precisión.",
    category: "Estilos Técnicos",
    prompt: "A detailed cross-section anatomy of [Objeto o sujeto:ej. un volcán en erupción], cut in half revealing the intricate inner layers and internal structures, educational textbook illustration, hyper-detailed.",
    previewUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=500&q=80",
    imageRequirement: "optional",
  },
  {
    id: "style-isometric",
    title: "Isometric 3D",
    description: "Presenta escenarios en un ángulo de 3/4, aspecto limpio tipo maqueta o videojuego de estrategia.",
    category: "Diseño y 3D",
    prompt: "An isometric 3D render of [Escenario:ej. una pequeña cafetería acogedora], clean miniature diorama style, smooth lighting, tilt-shift effect, strategy game aesthetic, colorful, highly detailed.",
    previewUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80",
    imageRequirement: "optional",
  },
  {
    id: "style-wireframe",
    title: "Wireframe (Malla de alambre)",
    description: "Forma figuras usando solo líneas y puntos geométricos. Muestra la estructura digital básica.",
    category: "Diseño y 3D",
    prompt: "A glowing 3D digital wireframe of [Objeto:ej. un automóvil deportivo], made of geometric neon lines and points on a dark background, cyberpunk structure, cyber grid, tech aesthetic.",
    previewUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=500&q=80",
    imageRequirement: "optional",
  },
  {
    id: "style-lowpoly",
    title: "Low Poly",
    description: "Construye la imagen con pocos triángulos y figuras geométricas simples. Aspecto retro o minimalista.",
    category: "Diseño y 3D",
    prompt: "A beautiful low poly 3D rendering of [Escenario o sujeto:ej. un paisaje de montañas al atardecer], constructed with simple geometric triangles and facets, minimalist flat shading, retro computer graphics style, pastel colors.",
    previewUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80",
    imageRequirement: "optional",
  },
  {
    id: "style-papercraft",
    title: "Papercraft (Arte en papel)",
    description: "Hace que todo parezca hecho a mano con recortes de papel de colores doblados y superpuestos.",
    category: "Artísticos y Creativos",
    prompt: "A beautiful papercraft illustration of [Escenario o sujeto:ej. un bosque mágico con hadas], made entirely of layered and folded colorful paper cutouts, drop shadows, tactile texture, handmade origami aesthetic.",
    previewUrl: "https://images.unsplash.com/photo-1502691876148-a84978e59af8?w=500&q=80",
    imageRequirement: "optional",
  },
  {
    id: "style-claymation",
    title: "Claymation (Arcilla)",
    description: "Personajes y objetos modelados con plastilina o arcilla, estilo stop-motion.",
    category: "Artísticos y Creativos",
    prompt: "A cute claymation 3D render of [Sujeto:ej. un pingüino bebiendo café], made of modeled plasticine, visible fingerprints on the clay, stop-motion animation style, tactile realistic texture, studio lighting.",
    previewUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=500&q=80",
    imageRequirement: "optional",
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
  },
  {
    id: "style-food-ad-minimalist",
    title: "Póster Gastronómico Swiss & Behance (Food Ad)",
    description: "Publicidad gastronómica moderna estilo diseño suizo y Behance, con producto héroe flotante, tipografía grande de fondo, etiquetas redondeadas y composición editorial de app.",
    category: "Publicidad y Ads",
    prompt: "[Nombre del Producto:ej. Vanilla Latte] STYLE & ART DIRECTION: Modern minimalist food advertising aesthetics, Swiss-style advertising composition, premium restaurant social media branding, editorial design for an FMCG campaign, visuals for startup food brands, Pinterest-style food poster aesthetics, playful geometric advertising structure, modern in-app branding style, minimalist luxury restaurant marketing. MAIN OBJECT: Hyper-realistic food hero of [Nombre del Producto:ej. Vanilla Latte] placed in the center of the composition using the reference image as the exact physical product, striking premium food photography design, floating or suspended presentation, realistic glossy textures, detailing of fresh ingredients, mouth-watering commercial presentation, studio-quality dish rendering, premium restaurant advertising campaign atmosphere. LAYOUT & COMPOSITION: Maintain the EXACT composition structure as sampled: large, rounded organic cream background centered on a vibrant full-color backdrop, large, lowercase type placed behind the protagonist and the hero's food object positioned in the center, overlapping, small branding/navigation strip aligned at the top, short editorial text block positioned on the left, floating rounded ingredient or flavor labels in the UI aligned vertically on the right, minimal decorative micro-icons, clean asymmetrical spacing, large breakout room, premium minimalist style hierarchy, social media poster composition. Typography: Large, bold typeface with rounded lowercase letters spelling '[Nombre del Producto:ej. vanilla latte]', modern geometric sans-serif font system, minimal supporting text, clear typography hierarchy for emerging brands, soft, rounded commercial lettering, large-scale typography treatment hidden behind objects. DEPTH AND LIGHT: Soft premium studio lighting, high-quality food highlights, realistic soft shadows, subtle glossy reflections, cinematic commercial lighting, highly detailed texture rendering, high-quality depth separation. ADDITIONAL DESIGN DETAILS: Rounded pill-shaped labels, small plus icons, minimal floating elements in the UI, app-like composition, fresh ingredient garnish, soft shadow blending, modern food delivery branding system, clean visuals, minimal geometric balance. COLOR PALETTE: [Color Primario de Marca:ej. light brown], cream/off-white, warm accent tones, high-contrast food colors, minimal black typography accents, a modern premium commercial palette. Quality: Ultra-high resolution, Behance-level food ad quality, 8k commercial rendering, Pinterest-style restaurant ad campaign design, premium FMCG branding aesthetics, professional art direction, high-quality editorial food poster.",
    previewUrl: "https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&q=80",
    imageRequirement: "required",
    isCommercialPoster: true,
  }
];
