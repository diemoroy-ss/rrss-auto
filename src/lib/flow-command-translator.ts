export interface FlowCommandDef {
  command: string;
  name: string;
  category: "Product Reveals" | "Camera Movements" | "Cinematic Atmosphere";
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
  {
    command: "/smoke reveal",
    name: "Smoke Reveal",
    category: "Product Reveals",
    description: "Humo denso y atmosférico que se abre suavemente en cámara lenta revelando el producto con iluminación perimetral.",
    icon: "💨",
    cameraMovement: "Slow cinematic push-in dolly forward toward the center",
    physicsEffect: "Dense volumetric smoke billowing outward and dissipating smoothly",
    lightingStyle: "Moody backlighting with sharp rim glow highlighting smoke edges and product contours",
    defaultEnglishPrompt: "Cinematic commercial product reveal starting from the source image. The scene begins shrouded in dense, elegant volumetric smoke. As the camera executes a slow, steady push-in dolly, the smoke rolls outward and smoothly dissipates, revealing the product with pinpoint clarity. Volumetric studio rim lighting, subtle floating particles, rich dark contrast, 60fps slow-motion feel, high-end commercial aesthetic, 4k resolution."
  },
  {
    command: "/fire reveal",
    name: "Fire Reveal",
    category: "Product Reveals",
    description: "Llamas ardientes o rescoldos incandescentes que dan paso al producto con reflejos cálidos y vibrantes.",
    icon: "🔥",
    cameraMovement: "Low-angle smooth push-in with subtle vertical pan up",
    physicsEffect: "Dynamic embers and soft controlled flame curtain parting away",
    lightingStyle: "Warm amber key light with glowing orange rim highlights and soft bokeh",
    defaultEnglishPrompt: "Dramatic commercial video reveal starting from the image. Gentle controlled flames and glowing embers swirl in the foreground, parting smoothly to uncover the central product. Warm amber reflections dance across glossy surfaces. The camera glides forward with cinematic momentum. Shallow depth of field, realistic flame physics, intense warm contrast, 60fps film look."
  },
  {
    command: "/water splash reveal",
    name: "Water Splash Reveal",
    category: "Product Reveals",
    description: "Salpicadura de agua cristalina en ultra cámara lenta resaltando frescura, hidratación y pureza.",
    icon: "💧",
    cameraMovement: "Stationary camera with extreme slow-motion macro focal tracking",
    physicsEffect: "Crystal clear water droplets splashing outward in 1000fps slow-motion physics",
    lightingStyle: "Bright clean commercial light with crisp specular highlights on every water bead",
    defaultEnglishPrompt: "Ultra slow-motion commercial product reveal based on the source image. A burst of crystal-clear water droplets erupts and curves outward in majestic 1000fps slow motion, framing the pristine product at the center. Crisp specular highlights glisten across each individual water bead. Ultra-clean high-key commercial lighting, fresh appetizing energy, razor-sharp focus."
  },
  {
    command: "/ice reveal",
    name: "Ice Reveal",
    category: "Product Reveals",
    description: "Escarcha translúcida o bloque de hielo cristalino que se derrite o agrieta con destellos de luz.",
    icon: "❄️",
    cameraMovement: "Slow forward glide with gentle focal rack",
    physicsEffect: "Frost crystals evaporating or clear ice cracking cleanly outward",
    lightingStyle: "Cool arctic tones, crisp blue rim lighting with prismatic diamond refractions",
    defaultEnglishPrompt: "Luxury product reveal starting from the image. The product emerges through a sheet of pristine clear ice that smoothly fractures into gleaming crystalline particles, drifting away in slow motion. Cool cyan and sapphire backlight refraction, frost micro-textures dissolving into crystal-clear clarity. High-end beverage and cosmetics commercial grade, 4k."
  },
  {
    command: "/liquid chrome reveal",
    name: "Liquid Chrome Reveal",
    category: "Product Reveals",
    description: "Cromo líquido reflectante y futurista que fluye y se contrae para descubrir el producto.",
    icon: "🪞",
    cameraMovement: "Fluid 45-degree rotational orbit with forward momentum",
    physicsEffect: "Molten silver liquid metal rippling and retracting toward the base",
    lightingStyle: "High-contrast studio reflection map with mirror-like metallic sheen",
    defaultEnglishPrompt: "Futuristic luxury commercial reveal beginning from the input image. Seamless liquid chrome ripples across the frame, elegantly peeling back and consolidating into smooth metallic droplets to unveil the product. Mirror-like reflections of ambient neon and white softboxes smear across the fluid mercury surface. Flawless 3D fluid physics, ultra-sleek modern commercial finish."
  },
  {
    command: "/glass reveal",
    name: "Glass Reveal",
    category: "Product Reveals",
    description: "Vidrio esmerilado que se vuelve transparente o se fractura en fragmentos flotantes.",
    icon: "🥃",
    cameraMovement: "Steady frontal push-in focusing through transparent layers",
    physicsEffect: "Frosted frosted glass clarifying or shattering softly into suspended bokeh shards",
    lightingStyle: "Clean architectural lighting with soft prismatic caustics",
    defaultEnglishPrompt: "Sophisticated commercial product reveal starting from the source image. The shot opens behind textured frosted glass that smoothly clarifies into pure transparency, pulling the product into crisp focus. Subtle prism refractions and clean glass caustics play across the edges. Gentle breathing camera motion, minimalist elegant styling, premium luxury feel."
  },
  {
    command: "/light beam reveal",
    name: "Light Beam Reveal",
    category: "Product Reveals",
    description: "Haz de luz volumétrica cortando la oscuridad para destacar la silueta y textura del producto.",
    icon: "🔦",
    cameraMovement: "Stationary camera with slow tilt up as the light angle sweeps",
    physicsEffect: "Volumetric light shaft cutting through delicate atmospheric haze",
    lightingStyle: "Dramatic spotlight beam sweeping from side to center, creating long moody shadows",
    defaultEnglishPrompt: "Dramatic commercial showcase starting from the image. In an atmospheric shadowed space, a powerful cinematic light beam sweeps smoothly across the scene, carving through soft ambient dust motes and illuminating the product in glorious heroic detail. Deep velvety shadows contrasting against bright specular highlights, 24fps cinematic motion."
  },
  {
    command: "/laser reveal",
    name: "Laser Reveal",
    category: "Product Reveals",
    description: "Líneas láser de alta tecnología escaneando el producto en 3D antes de iluminarlo por completo.",
    icon: "⚡",
    cameraMovement: "Smooth horizontal tracking shot tracing the laser beam path",
    physicsEffect: "Vibrant laser scan lines tracing geometry, leaving a glowing luminescence",
    lightingStyle: "High-tech cyberpunk electric blue or emerald laser lines with neon bloom",
    defaultEnglishPrompt: "High-tech commercial reveal based on the source image. Sleek horizontal and vertical laser grid lines scan the exact contours of the product with surgical precision, leaving a luminous trail that dissolves into brilliant studio lighting. Modern tech aesthetic, subtle digital dust particles, smooth tracking camera glide, sharp clean edges."
  },
  {
    command: "/particle reveal",
    name: "Particle Reveal",
    category: "Product Reveals",
    description: "Torbellino de partículas brillantes doradas o cósmicas que se reúnen formando el producto.",
    icon: "✨",
    cameraMovement: "Slow rotational camera pan orbiting around the swirling vortex",
    physicsEffect: "Thousands of glowing micro-particles converging or exploding gently outward",
    lightingStyle: "Warm golden luminescence with soft glowing halo and cinematic depth",
    defaultEnglishPrompt: "Magical commercial product reveal starting from the image. Thousands of delicate golden micro-particles spiral in an ethereal vortex around the subject, expanding softly outward to reveal the flawless product at the epicenter. Beautiful bokeh circles, warm luminescence, gentle slow-motion drift, premium prestige brand quality."
  },
  {
    command: "/dust reveal",
    name: "Dust Reveal",
    category: "Product Reveals",
    description: "Polvo sutil de pigmento o destellos minerales suspendidos en el aire dispersándose suavemente.",
    icon: "🌪️",
    cameraMovement: "Macro low-angle tracking shot moving parallel to the surface",
    physicsEffect: "Fine powder particles bursting and floating away on a gentle breeze",
    lightingStyle: "Directional side lighting accentuating texture and airborne particle motes",
    defaultEnglishPrompt: "Sensory commercial reveal starting from the source image. A delicate puff of fine mineral powder or colorful pigment bursts softly and billows into the air, caught in a dramatic side light as it clears to showcase the product. Tactile, organic, hyper-detailed micro-particles floating in slow motion, rich natural color grading."
  },
  {
    command: "/fog reveal",
    name: "Fog Reveal",
    category: "Product Reveals",
    description: "Niebla baja y sedosa deslizándose al nivel del suelo hasta despejar la toma.",
    icon: "🌫️",
    cameraMovement: "Smooth low-angle dolly slide forward across the reflective surface",
    physicsEffect: "Heavy ground fog rolling softly away like dry ice vapor",
    lightingStyle: "Subtle moody twilight lighting with cool cyan underglow",
    defaultEnglishPrompt: "Atmospheric luxury reveal based on the input image. Heavy, velvety ground fog creeps across a glossy dark floor, smoothly parting as the camera executes a low-angle dolly forward. Soft diffused lighting outlines the product's silhouette with refined elegance. Mystical commercial tone, continuous fluid motion."
  },
  {
    command: "/explosion reveal",
    name: "Explosion Reveal",
    category: "Product Reveals",
    description: "Estallido enérgico de color o impacto cinemático que expande energía alrededor del objeto.",
    icon: "💥",
    cameraMovement: "Fast push-in with speed-ramp deceleration into a crisp heroic stop",
    physicsEffect: "Dynamic colorful shockwave exploding radially outward from behind the product",
    lightingStyle: "Vibrant high-energy flash with high contrast and saturated rim reflections",
    defaultEnglishPrompt: "High-energy commercial reveal starting from the source image. A controlled radial burst of vibrant color pigment and energy particles explodes outward from behind the hero product in slow motion. The camera snaps forward with a quick speed ramp, locking into a razor-sharp heroic freeze. Energetic social media ad style, impactful and modern."
  },
  {
    command: "/curtain reveal",
    name: "Curtain Reveal",
    category: "Product Reveals",
    description: "Telón de seda o terciopelo ondeando suavemente hacia un lado con caída elegante.",
    icon: "🎭",
    cameraMovement: "Eye-level steady camera with gentle push forward",
    physicsEffect: "Heavy satin fabric blowing and gliding smoothly off-camera",
    lightingStyle: "Classic theatre spotlight with rich fabric sheen and warm tones",
    defaultEnglishPrompt: "Theatrical luxury product reveal starting from the image. A rich, heavy satin fabric curtain floats and glides smoothly aside in slow motion, catching warm amber spotlight highlights across its folds to unveil the centerpiece product. Regal, prestigious atmosphere, smooth 24fps motion, timeless elegance."
  },
  {
    command: "/shadow reveal",
    name: "Shadow Reveal",
    category: "Product Reveals",
    description: "Sombra profunda que retrocede gradualmente mientras la fuente de luz se desplaza.",
    icon: "👥",
    cameraMovement: "Static camera allowing the light and shadow movement to drive the scene",
    physicsEffect: "Crisp architectural shadow receding smoothly across the surface",
    lightingStyle: "High-contrast chiaroscuro lighting evolving from dark silhouette to full illumination",
    defaultEnglishPrompt: "Artistic commercial product reveal starting from the source image. The product begins largely concealed in deep graphic shadow. A primary light source moves slowly on an arc overhead, causing the crisp shadow to retract smoothly across the product, illuminating textures and branding with cinematic precision. Minimalist, bold, premium editorial visual style."
  },
  {
    command: "/spotlight reveal",
    name: "Spotlight Reveal",
    category: "Product Reveals",
    description: "Foco directo de escenario encendiéndose en la oscuridad para centrar toda la atención.",
    icon: "🔦",
    cameraMovement: "Center-aligned gentle push-in towards the illumination circle",
    physicsEffect: "Instantaneous or fading-in round spotlight circle on a dark floor",
    lightingStyle: "Single round theatrical spotlight from directly above, pure black surroundings",
    defaultEnglishPrompt: "Dramatic minimalist product reveal based on the input image. In pure pitch darkness, a single crisp circular overhead spotlight fades up dramatically, pinning the product in a pool of immaculate white light. The camera glides forward with subtle momentum. Pristine clean aesthetic, maximum focus on the offer, high-end commercial quality."
  },
  {
    command: "/360 product orbit",
    name: "360 Product Orbit",
    category: "Camera Movements",
    description: "Órbita circular completa de 360 grados alrededor del producto con profundidad de campo tridimensional.",
    icon: "🔄",
    cameraMovement: "Smooth continuous 360-degree orbital camera rotation around the subject",
    physicsEffect: "Background parallax shifting smoothly while the product remains anchored at center",
    lightingStyle: "Multi-point commercial studio lighting creating rolling specular highlights on all sides",
    defaultEnglishPrompt: "Commercial 360-degree camera orbit video starting from the input image. The camera glides on a seamless, perfectly stabilized 360-degree circular path around the central product. Beautiful parallax in the background environment, shallow depth of field, studio lights creating dynamic rolling specular highlights across every contour. Flawless 3D spatial presence, ultra-smooth 24fps cinematography."
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

  return `${base}${nicheContext}.${extraNotes} Camera: ${cmdDef.cameraMovement}. Lighting: ${cmdDef.lightingStyle}. Preserving image composition and brand fidelity.`;
}
