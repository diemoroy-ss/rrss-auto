export interface VideoPromptTemplate {
  id: string;
  title: string;
  category: "Comercial" | "Cinemático" | "Dinámico" | "Sensorial" | "Elegante" | "Urbano";
  cameraMotion: string;
  lightingStyle: string;
  description: string;
  recommendedFor: string;
  icon: string;
  baseEnglishPrompt: string;
}

export const videoPromptCategories = [
  "Comercial",
  "Cinemático",
  "Dinámico",
  "Sensorial",
  "Elegante",
  "Urbano"
] as const;

export const VIDEO_PROMPT_STYLES: VideoPromptTemplate[] = [
  {
    id: "cinematic_slow_push_in",
    title: "Slow Push-In Comercial Cinemático",
    category: "Comercial",
    cameraMotion: "Slow cinematic push-in dolly forward towards the focal subject",
    lightingStyle: "Soft studio key light with subtle volumetric rim glow and gentle falloff",
    description: "Acercamiento lento y sutil hacia el centro de la escena, manteniendo el enfoque nítido sobre el producto o servicio.",
    recommendedFor: "Restaurantes, Clínicas, Retail, Servicios Profesionales",
    icon: "🎯",
    baseEnglishPrompt: "Cinematic commercial video starting with the source image. The camera executes a slow, seamless push-in dolly shot towards the central subject. Delicate ambient motion, realistic micro-movements, volumetric studio lighting, warm specular reflections, ultra-sharp 8k details, premium commercial color grading, 24fps film aesthetic."
  },
  {
    id: "dynamic_drone_orbit",
    title: "Paneo Orbital Dinámico (Gimbal / Drone)",
    category: "Cinemático",
    cameraMotion: "Smooth 35-degree parabolic camera orbit around the scene",
    lightingStyle: "Golden hour natural sunlight with cinematic lens flare and rich shadows",
    description: "Rotación suave de cámara alrededor de la escena creando una perspectiva tridimensional inmersiva y moderna.",
    recommendedFor: "Inmobiliarias, Cabañas, Gimnasios, Talleres, Fachadas",
    icon: "🚁",
    baseEnglishPrompt: "High-end commercial camera orbit motion starting from the image. The camera glides on a smooth, steady arc around the subject. Depth of field subtly shifts, natural atmospheric haze, realistic environment light interaction, crisp textures, smooth 24fps motion, award-winning cinematography."
  },
  {
    id: "elegant_light_sweep_reveal",
    title: "Revelación Elegante con Barrido de Luz",
    category: "Elegante",
    cameraMotion: "Stationary camera with gentle breathing and subtle focal rack",
    lightingStyle: "Dynamic soft light beam sweeping across the surface, creating glowing highlights",
    description: "La cámara se mantiene firme mientras un haz de luz suave recorre la imagen resaltando la textura y exclusividad.",
    recommendedFor: "Joyería, Estética, Salud Dental, Marcas Premium, Abogados",
    icon: "✨",
    baseEnglishPrompt: "Sophisticated luxury product reveal starting from the image. Minimal gentle camera floating motion. A soft, elegant studio light sweep travels across the main elements, catching specular highlights and metallic accents. Shallow depth of field, creamy bokeh, clean high-end aesthetic, 4k commercial render."
  },
  {
    id: "action_burst_ramp",
    title: "Cámara Dinámica con Aceleración Comercial",
    category: "Dinámico",
    cameraMotion: "Dynamic push-in with subtle speed-ramp deceleration into a crisp heroic freeze",
    lightingStyle: "High-contrast dynamic commercial lighting with vibrant saturation",
    description: "Movimiento rápido y enérgico que desacelera en el momento clave para capturar atención en redes de inmediato.",
    recommendedFor: "Ofertas Flash, Eventos, Fitness, Barberías, Descuentos Especiales",
    icon: "⚡",
    baseEnglishPrompt: "High-energy commercial video motion based on the input image. Fast snappy camera move with a smooth speed ramp easing into sharp focus on the central offer. Energetic kinetic feel, vibrant color punch, crisp edge contrast, dynamic social media ad style, ultra-smooth motion."
  },
  {
    id: "sensorial_macro_glide",
    title: "Macro Sensorial en Cámara Lenta",
    category: "Sensorial",
    cameraMotion: "Ultra-close macro slide revealing textures and premium materials",
    lightingStyle: "Macro diffuse studio lighting with soft specular highlights",
    description: "Desplazamiento a escala milimétrica en cámara lenta mostrando la frescura de los ingredientes o la calidad de los materiales.",
    recommendedFor: "Gastronomía, Cafeterías, Pastelería, Cosmética, Calzado",
    icon: "🔍",
    baseEnglishPrompt: "Slow motion 60fps macro camera glide over the primary subject from the image. Extreme close-up perspective showing appetizing textures, subtle steam or moisture particles, shallow depth of field with buttery smooth bokeh, high-end culinary commercial look, flawless realism."
  },
  {
    id: "urban_neon_twilight",
    title: "Atmósfera Urbana & Destellos Neón",
    category: "Urbano",
    cameraMotion: "Low-angle smooth tracking shot moving forward",
    lightingStyle: "Vibrant neon backlight, deep twilight blues and magenta rim reflections",
    description: "Cámara baja con luces de neón y reflejos cinematográficos nocturnos para marcas con personalidad moderna.",
    recommendedFor: "Bares, Hamburgueserías, Tatuajes, Moda Urbana, Concesionarias",
    icon: "🌃",
    baseEnglishPrompt: "Moody urban cinematic tracking shot starting from the image. Low-angle camera slowly creeping forward. Atmospheric neon light spill, rain-slicked surface reflections, cinematic vapor mist, deep rich blacks with vibrant contrast, stylized color palette, high-budget film look."
  }
];

export function buildImageToVideoPrompt(
  template: VideoPromptTemplate,
  params: {
    businessName: string;
    rubro: string;
    offerText?: string;
    customDirection?: string;
  }
): {
  promptEnglish: string;
  promptSpanishSummary: string;
  cameraNotes: string;
} {
  const { businessName, rubro, offerText, customDirection } = params;

  const subject = businessName ? `for the brand "${businessName}" (${rubro})` : `for ${rubro}`;
  const offerContext = offerText ? `Visual accentuating the concept: "${offerText}".` : "";
  const custom = customDirection ? `Direction details: ${customDirection}.` : "";

  const promptEnglish = `${template.baseEnglishPrompt} Context: High-impact video ${subject}. ${offerContext} ${custom} Maintain subject identity from the start frame, photorealistic textures, no text distortion, smooth coherent motion. Maximum duration: 10 seconds.`.trim();

  const promptSpanishSummary = `Estilo "${template.title}": ${template.description} (Optimizado para ${rubro}${businessName ? ` - ${businessName}` : ""}).`;

  return {
    promptEnglish,
    promptSpanishSummary,
    cameraNotes: `${template.cameraMotion}. Iluminación: ${template.lightingStyle}.`,
  };
}
