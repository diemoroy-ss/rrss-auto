export type FlowCategory = 
  | "E-Commerce & Productos" 
  | "Servicios & Marcas" 
  | "Lanzamientos & Revelación" 
  | "Creativos & Tendencias" 
  | string;

export interface FlowCommandDef {
  command: string;
  name: string;
  category: FlowCategory;
  description: string;
  icon: string;
  cameraMovement: string;
  physicsEffect: string;
  lightingStyle: string;
  defaultEnglishPrompt: string;
  sampleBaseImage?: string;
  sampleFinalVideo?: string;
}

export const FLOW_COMMANDS: FlowCommandDef[] = [
  // ==========================================
  // GRUPO A: E-COMMERCE & PRODUCTOS FÍSICOS
  // ==========================================
  {
    command: "/360 product orbit",
    name: "360 Product Orbit",
    category: "E-Commerce & Productos",
    description: "Órbita circular completa de 360 grados alrededor del producto con profundidad tridimensional e iluminación continua.",
    icon: "🔄",
    cameraMovement: "Smooth continuous 360-degree orbital camera rotation around the subject",
    physicsEffect: "Background parallax shifting smoothly while the product remains anchored at center",
    lightingStyle: "Multi-point commercial studio lighting creating rolling specular highlights on all contours",
    defaultEnglishPrompt: "Commercial 360-degree camera orbit video starting from the input image. The camera glides on a seamless, perfectly stabilized 360-degree circular path around the central product. Beautiful parallax in the background environment, shallow depth of field, studio lights creating dynamic rolling specular highlights across every contour. Flawless 3D spatial presence, ultra-smooth 24fps cinematography, pristine 4k commercial look."
  },
  {
    command: "/water splash reveal",
    name: "Water Splash Reveal",
    category: "E-Commerce & Productos",
    description: "Salpicadura de agua cristalina en ultra cámara lenta resaltando frescura, hidratación y pureza.",
    icon: "💧",
    cameraMovement: "Stationary camera with extreme slow-motion macro focal tracking",
    physicsEffect: "Crystal clear water droplets splashing outward in 1000fps slow-motion fluid dynamics",
    lightingStyle: "Bright clean commercial light with crisp specular highlights on every individual water bead",
    defaultEnglishPrompt: "Ultra slow-motion commercial product reveal based on the source image. A burst of crystal-clear water droplets erupts and curves outward in majestic 1000fps slow motion, framing the pristine product at the center. Crisp specular highlights glisten across each individual water bead. Ultra-clean high-key commercial lighting, fresh appetizing energy, razor-sharp focus."
  },
  {
    command: "/fresh food reveal",
    name: "Fresh Food Reveal",
    category: "E-Commerce & Productos",
    description: "Presentación gastronómica con iluminación apetitosa, vapor sutil y texturas jugosas resaltadas en cámara lenta.",
    icon: "🍔",
    cameraMovement: "Slow low-angle push-in with gentle upward tilt showcasing food layering",
    physicsEffect: "Delicate curls of warm culinary steam rising and glistening sauce textures",
    lightingStyle: "Warm golden commercial culinary key light with glistening specular highlights",
    defaultEnglishPrompt: "Sensory culinary commercial video starting from the input image. Slow-motion macro push-in towards the freshly prepared food. Delicate wisps of warm steam rise gracefully into the air. Golden warm studio lighting emphasizes crispy textures, glossy glazes, and fresh ingredient vibrancy. Highly appetizing commercial food cinematography, rich color grading, shallow depth of field, 4k quality."
  },
  {
    command: "/macro product shot",
    name: "Macro Product Shot",
    category: "E-Commerce & Productos",
    description: "Acercamiento cinematográfico extremo a detalles, costuras, texturas y materiales finos de alta gama.",
    icon: "🔍",
    cameraMovement: "Extreme close-up macro tracking shot gliding across textures and surfaces",
    physicsEffect: "Subtle rack focus shifting smoothly between micro-details and brand typography",
    lightingStyle: "Raking side light revealing fine micro-textures and premium material craftsmanship",
    defaultEnglishPrompt: "High-end commercial macro video starting from the source image. Extreme close-up lens smoothly glides across the product's premium materials, stitching, and fine surface textures. Cinematic rack focus reveals intricate craftsmanship and pristine branding with razor sharpness. Elegant grazing light, velvety background blur, prestige advertising aesthetic."
  },
  {
    command: "/ice reveal",
    name: "Ice Reveal",
    category: "E-Commerce & Productos",
    description: "Bloque de hielo cristalino o escarcha translúcida que se agrieta y derrite con destellos de luz pura.",
    icon: "❄️",
    cameraMovement: "Slow forward glide with gentle focal rack through crystalline refractions",
    physicsEffect: "Frost crystals dissolving and clear ice fracturing cleanly into suspended particles",
    lightingStyle: "Cool arctic tones, crisp sapphire rim lighting with diamond prismatic refractions",
    defaultEnglishPrompt: "Luxury product reveal starting from the image. The product emerges through a sheet of pristine clear ice that smoothly fractures into gleaming crystalline particles, drifting away in slow motion. Cool cyan and sapphire backlight refraction, frost micro-textures dissolving into crystal-clear clarity. High-end beverage and cosmetics commercial grade, 4k."
  },
  {
    command: "/fire reveal",
    name: "Fire Reveal",
    category: "E-Commerce & Productos",
    description: "Llamas ardientes controladas y chispas incandescentes que dan paso al producto con energía y reflejos cálidos.",
    icon: "🔥",
    cameraMovement: "Low-angle smooth push-in with subtle vertical pan up",
    physicsEffect: "Dynamic embers and soft controlled flame curtain parting away",
    lightingStyle: "Warm amber key light with glowing orange rim highlights and soft bokeh",
    defaultEnglishPrompt: "Dramatic commercial video reveal starting from the image. Gentle controlled flames and glowing embers swirl in the foreground, parting smoothly to uncover the central product. Warm amber reflections dance across glossy surfaces. The camera glides forward with cinematic momentum. Shallow depth of field, realistic flame physics, intense warm contrast, 60fps film look."
  },
  {
    command: "/top-down product reveal",
    name: "Top-Down Flat Lay",
    category: "E-Commerce & Productos",
    description: "Vista cenital flat lay desde arriba con composición de diseño y juego de sombras arquitectónicas.",
    icon: "📐",
    cameraMovement: "Perpendicular top-down bird's-eye view with gentle slow counter-clockwise rotation and slow descent",
    physicsEffect: "Dynamic shadow play moving across a designer textured tabletop surface",
    lightingStyle: "Soft diffused daylight with elegant directional window shadows sliding across",
    defaultEnglishPrompt: "Aesthetic flat lay commercial reveal starting from the input image. Perfectly aligned top-down overhead perspective descending smoothly toward the curated arrangement. Soft architectural shadows glide across a premium stone or textured surface. Minimalist art direction, balanced editorial composition, hyper-clean commercial styling, 4k."
  },

  // ==========================================
  // GRUPO B: SERVICIOS, SOFTWARE & MARCAS
  // ==========================================
  {
    command: "/billboard takeover",
    name: "Billboard Takeover",
    category: "Servicios & Marcas",
    description: "Cartel publicitario gigante en una avenida transitada con tráfico y peatones pasando de noche.",
    icon: "🏙️",
    cameraMovement: "Wide cinematic drone pan tracking upward from street level toward the massive illuminated billboard",
    physicsEffect: "Dynamic vehicle light trails and bustling urban movement below",
    lightingStyle: "Vibrant high-contrast urban night lights with high-intensity billboard illumination",
    defaultEnglishPrompt: "Grand commercial brand video starting from the source image. The image is featured prominently across a massive illuminated high-rise billboard dominating an iconic city boulevard. Cinematic camera moves smoothly from bustling street traffic up toward the giant display. Atmospheric dusk lighting, bokeh headlights, realistic city scale, prestigious Fortune 500 commercial vibe."
  },
  {
    command: "/Times Square 3D reveal",
    name: "Times Square 3D",
    category: "Servicios & Marcas",
    description: "Pantalla 3D curva anamórfica gigante en Times Square donde el logo o mockup parece salir físicamente a la calle.",
    icon: "🌆",
    cameraMovement: "Low-angle street perspective tilting up toward the monumental curved corner screen",
    physicsEffect: "Anamorphic optical illusion creating depth where elements break the screen boundary",
    lightingStyle: "Dazzling neon atmosphere of Times Square reflecting on wet asphalt and glass facades",
    defaultEnglishPrompt: "Spectacular anamorphic 3D billboard video starting from the image. Set on the giant curved LED screen in Times Square at night, the brand visuals break the fourth wall, appearing to physically extend outwards toward the awe-inspired street crowd below. Vibrant reflections on wet pavement, cinematic depth, hyper-realistic optical illusion, ultra-high production value."
  },
  {
    command: "/minimalist luxury ad",
    name: "Minimalist Luxury Ad",
    category: "Servicios & Marcas",
    description: "Entorno arquitectónico sobrio con mármol, sombras suaves y luz natural para consultorías o marcas de categoría.",
    icon: "🏛️",
    cameraMovement: "Slow, elegant tracking dolly moving horizontally with subtle breathing motion",
    physicsEffect: "Soft organic shadows casting gentle geometric patterns across matte stone",
    lightingStyle: "Warm architectural golden-hour light streaming through minimalist apertures",
    defaultEnglishPrompt: "Quiet luxury commercial film starting from the source image. Placed within a sunlit brutalist architectural pavilion featuring honed travertine and warm plaster textures. A soft breeze casts moving shadows of minimalist foliage across the scene. The camera glides with whisper-quiet grace. Timeless prestige, understated sophistication, museum-grade art direction, 4k."
  },
  {
    command: "/premium studio advertisement",
    name: "Premium Studio Tech",
    category: "Servicios & Marcas",
    description: "Pedestal minimalista con iluminación de tres puntos y reflejos de softbox para software, mockups o marcas.",
    icon: "🖥️",
    cameraMovement: "Smooth sweeping curved dolly shot orbiting 45 degrees around the display pedestal",
    physicsEffect: "Subtle gloss reflections shifting gracefully across the pedestal surface",
    lightingStyle: "Three-point studio lighting with razor-sharp softbox reflections and deep graphite contrast",
    defaultEnglishPrompt: "Flawless tech commercial studio reveal based on the source image. The subject rests atop an impeccably designed matte charcoal pedestal. Two giant curved softbox lights slowly sweep overhead, cascading liquid-like white reflections across polished surfaces. Controlled camera orbit, razor-sharp focus, Apple-caliber industrial design commercial aesthetic."
  },
  {
    command: "/cinematic dolly in",
    name: "Cinematic Dolly In",
    category: "Servicios & Marcas",
    description: "Acercamiento lento, gradual y perfectamente estabilizado que concentra toda la atención en la marca.",
    icon: "🎬",
    cameraMovement: "Slow, steady linear dolly push-in directly toward the center of interest",
    physicsEffect: "Gradual background focal compression and expanding bokeh circles",
    lightingStyle: "Balanced cinematic key lighting with soft fill and gentle ambient falloff",
    defaultEnglishPrompt: "Classic cinematic dolly-in commercial shot starting from the input image. Perfectly stabilized forward push-in camera movement smoothly closing the distance to the subject. The background gently melts into lush, creamy bokeh while the central subject remains in tack-sharp focus. Pure cinematic storytelling, premium color grade, smooth 24fps motion."
  },

  // ==========================================
  // GRUPO C: LANZAMIENTOS & REVELACIÓN
  // ==========================================
  {
    command: "/spotlight reveal",
    name: "Spotlight Reveal",
    category: "Lanzamientos & Revelación",
    description: "Foco directo de escenario encendiéndose en la penumbra para centrar toda la atención en el producto.",
    icon: "🔦",
    cameraMovement: "Center-aligned gentle push-in towards the illumination circle",
    physicsEffect: "Instantaneous or fading-in round spotlight circle on a dark floor",
    lightingStyle: "Single round theatrical spotlight from directly above, pure black surroundings",
    defaultEnglishPrompt: "Dramatic minimalist product reveal based on the input image. In pure pitch darkness, a single crisp circular overhead spotlight fades up dramatically, pinning the product in a pool of immaculate white light. The camera glides forward with subtle momentum. Pristine clean aesthetic, maximum focus on the offer, high-end commercial quality."
  },
  {
    command: "/smoke reveal",
    name: "Smoke Reveal",
    category: "Lanzamientos & Revelación",
    description: "Humo denso y atmosférico que se abre suavemente en cámara lenta revelando el producto con iluminación perimetral.",
    icon: "💨",
    cameraMovement: "Slow cinematic push-in dolly forward toward the center",
    physicsEffect: "Dense volumetric smoke billowing outward and dissipating smoothly",
    lightingStyle: "Moody backlighting with sharp rim glow highlighting smoke edges and product contours",
    defaultEnglishPrompt: "Cinematic commercial product reveal starting from the source image. The scene begins shrouded in dense, elegant volumetric smoke. As the camera executes a slow, steady push-in dolly, the smoke rolls outward and smoothly dissipates, revealing the product with pinpoint clarity. Volumetric studio rim lighting, subtle floating particles, rich dark contrast, 60fps slow-motion feel, high-end commercial aesthetic, 4k resolution."
  },
  {
    command: "/light beam reveal",
    name: "Light Beam Reveal",
    category: "Lanzamientos & Revelación",
    description: "Haz de luz volumétrica cortando la oscuridad para destacar la silueta y textura del producto.",
    icon: "🔦",
    cameraMovement: "Stationary camera with slow tilt up as the light angle sweeps",
    physicsEffect: "Volumetric light shaft cutting through delicate atmospheric haze",
    lightingStyle: "Dramatic spotlight beam sweeping from side to center, creating long moody shadows",
    defaultEnglishPrompt: "Dramatic commercial showcase starting from the image. In an atmospheric shadowed space, a powerful cinematic light beam sweeps smoothly across the scene, carving through soft ambient dust motes and illuminating the product in glorious heroic detail. Deep velvety shadows contrasting against bright specular highlights, 24fps cinematic motion."
  },
  {
    command: "/particle reveal",
    name: "Particle Reveal",
    category: "Lanzamientos & Revelación",
    description: "Torbellino de partículas brillantes doradas que se reúnen formando el producto.",
    icon: "✨",
    cameraMovement: "Slow rotational camera pan orbiting around the swirling vortex",
    physicsEffect: "Thousands of glowing micro-particles converging or exploding gently outward",
    lightingStyle: "Warm golden luminescence with soft glowing halo and cinematic depth",
    defaultEnglishPrompt: "Magical commercial product reveal starting from the image. Thousands of delicate golden micro-particles spiral in an ethereal vortex around the subject, expanding softly outward to reveal the flawless product at the epicenter. Beautiful bokeh circles, warm luminescence, gentle slow-motion drift, premium prestige brand quality."
  },
  {
    command: "/liquid chrome reveal",
    name: "Liquid Chrome Reveal",
    category: "Lanzamientos & Revelación",
    description: "Cromo líquido reflectante y futurista que fluye y se contrae para descubrir el producto.",
    icon: "🪞",
    cameraMovement: "Fluid 45-degree rotational orbit with forward momentum",
    physicsEffect: "Molten silver liquid metal rippling and retracting toward the base",
    lightingStyle: "High-contrast studio reflection map with mirror-like metallic sheen",
    defaultEnglishPrompt: "Futuristic luxury commercial reveal beginning from the input image. Seamless liquid chrome ripples across the frame, elegantly peeling back and consolidating into smooth metallic droplets to unveil the product. Mirror-like reflections of ambient neon and white softboxes smear across the fluid mercury surface. Flawless 3D fluid physics, ultra-sleek modern commercial finish."
  },

  // ==========================================
  // GRUPO D: CREATIVOS & TENDENCIAS
  // ==========================================
  {
    command: "/zero gravity",
    name: "Zero Gravity",
    category: "Creativos & Tendencias",
    description: "El producto flota suavemente en ingravidez en el aire con pequeñas partículas u objetos suspendidos alrededor.",
    icon: "🪐",
    cameraMovement: "Weightless 3D floating camera drifting slowly along an undulating path",
    physicsEffect: "True zero-gravity suspension with gentle continuous micro-rotations and floating droplets",
    lightingStyle: "Soft atmospheric ambient lighting with subtle iridescent rim glints",
    defaultEnglishPrompt: "Hypnotic zero-gravity product commercial starting from the input image. The hero product floats effortlessly suspended in zero gravity, performing a slow, hypnotic weightless drift. Tiny complementary elements float peacefully around it in shallow depth of field. Soft studio lighting with delicate chromatic aberrations, ethereal and modern aesthetic."
  },
  {
    command: "/neon commercial",
    name: "Neon Commercial",
    category: "Creativos & Tendencias",
    description: "Luces de neón cyberpunk con reflejos vibrantes sobre el producto y ambiente nocturno futurista.",
    icon: "⚡",
    cameraMovement: "Dynamic Dutch-angle tracking push through glowing neon tubes",
    physicsEffect: "Pulsing atmospheric neon tubes casting dynamic color washes",
    lightingStyle: "Dual-tone cyberpunk neon lighting with intense magenta and electric cyan rim glows",
    defaultEnglishPrompt: "High-octane commercial video starting from the source image. Bathed in vibrant dual-tone neon tubes pulsing with magenta, ultraviolet, and cyan energy. Glossy surfaces reflect saturated light bars in slow motion. The camera glides on a stylized low angle with energetic flair. Ultra-modern street and tech vibe, 60fps fluid visual impact."
  },
  {
    command: "/product in the clouds",
    name: "Product in the Clouds",
    category: "Creativos & Tendencias",
    description: "Flotando suavemente sobre un mar de nubes al atardecer para bienestar, perfumes, descanso o viajes.",
    icon: "☁️",
    cameraMovement: "Slow drifting camera flying through wisps of clouds toward the product",
    physicsEffect: "Volumetric fluffy clouds parting smoothly with soft turbulence",
    lightingStyle: "Dreamy golden-hour sunset light casting warm peach and lavender hues across cloud tops",
    defaultEnglishPrompt: "Dreamlike surreal commercial film starting from the source image. The product rests majestically atop a bed of soft, billowing volumetric clouds at sunset. Warm golden hour light paints the sky in pastel amber and blush tones. Gentle cloud wisps drift across the lens in dreamy slow motion. Serene, aspirational, ethereal commercial aesthetic."
  }
];

export function buildVeoPromptFromCommand(
  cmdDef: FlowCommandDef,
  options?: {
    productName?: string;
    rubro?: string;
    aspectRatio?: "9:16" | "16:9" | "1:1";
    additionalDetails?: string;
  }
): string {
  const productSubject = options?.productName
    ? `the product "${options.productName}"`
    : `the featured commercial subject from the image`;

  const nicheContext = options?.rubro
    ? ` calibrated for ${options.rubro}`
    : "";

  const extraNotes = options?.additionalDetails
    ? ` Additional artistic direction: ${options.additionalDetails}.`
    : "";

  const base = cmdDef.defaultEnglishPrompt.replace(
    /the (central product|product|subject)/gi,
    productSubject
  );

  return `${base}${nicheContext}.${extraNotes} Camera: ${cmdDef.cameraMovement}. Lighting: ${cmdDef.lightingStyle}. Maximum duration: 10 seconds. Preserving image composition and brand fidelity.`;
}
