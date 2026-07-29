export type ImageRequirement = 'none' | 'optional' | 'required';

export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  prompt: string;
  previewUrl: string; // URL to a sample image generated with this prompt
  imageRequirement: ImageRequirement;
  variables: string[]; // e.g. ["PRODUCTO", "COLOR", "ENTORNO"]
}

export const promptCategories = [
  "Fotorealismo",
  "Ilustración 3D",
  "Minimalista",
  "Arte Conceptual",
  "Cyberpunk",
  "Producto (E-commerce)"
];

export const promptTemplates: PromptTemplate[] = [
  {
    id: "prod-001",
    title: "Fotografía de Producto Premium",
    description: "Ideal para destacar un producto sobre un fondo elegante y con iluminación de estudio.",
    category: "Producto (E-commerce)",
    prompt: "Commercial photography of a [PRODUCTO], centered, resting on a clean minimalist podium. Soft studio lighting, highly detailed, 8k resolution, elegant [ENTORNO] background, photorealistic, shot on 85mm lens, depth of field.",
    previewUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop",
    imageRequirement: "optional",
    variables: ["PRODUCTO", "ENTORNO"]
  },
  {
    id: "3d-001",
    title: "Personaje 3D Estilo Pixar",
    description: "Genera un personaje o mascota en 3D con un estilo amigable tipo animación.",
    category: "Ilustración 3D",
    prompt: "A cute 3D animated character of a [PERSONAJE_O_ANIMAL] wearing [ROPA], Pixar style, Disney style, vibrant colors, expressive eyes, octane render, unreal engine 5, soft lighting, 8k, highly detailed.",
    previewUrl: "https://images.unsplash.com/photo-1618331835717-801e976710b2?q=80&w=600&auto=format&fit=crop",
    imageRequirement: "none",
    variables: ["PERSONAJE_O_ANIMAL", "ROPA"]
  },
  {
    id: "cyber-001",
    title: "Ciudad Cyberpunk Neón",
    description: "Crea un entorno urbano futurista lleno de luces de neón.",
    category: "Cyberpunk",
    prompt: "Cyberpunk cityscape at night, neon lights illuminating wet streets, a futuristic [VEHICULO] driving by, cinematic lighting, highly detailed, concept art, blade runner style, 8k, photorealistic.",
    previewUrl: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=600&auto=format&fit=crop",
    imageRequirement: "none",
    variables: ["VEHICULO"]
  },
  {
    id: "img-001",
    title: "Rediseño Arquitectónico",
    description: "Sube un boceto o foto de un espacio y conviértelo en un render hiperrealista.",
    category: "Fotorealismo",
    prompt: "Architectural visualization of a [TIPO_DE_ESPACIO] interior, modern luxury design, [COLOR_DOMINANTE] color palette, natural sunlight coming through large windows, photorealistic, 8k, unreal engine 5 render, highly detailed.",
    previewUrl: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=600&auto=format&fit=crop",
    imageRequirement: "required",
    variables: ["TIPO_DE_ESPACIO", "COLOR_DOMINANTE"]
  },
  {
    id: "min-001",
    title: "Logo / Icono Minimalista",
    description: "Diseño vectorial limpio y moderno para un logo o icono de app.",
    category: "Minimalista",
    prompt: "A minimalist flat vector logo of a [OBJETO], clean lines, modern design, solid [COLOR_DE_FONDO] background, high contrast, ui ux icon style, dribbble style.",
    previewUrl: "https://images.unsplash.com/photo-1626785774573-4b799315345d?q=80&w=600&auto=format&fit=crop",
    imageRequirement: "optional",
    variables: ["OBJETO", "COLOR_DE_FONDO"]
  },
  {
    id: "img-002",
    title: "Transformación a Anime",
    description: "Sube tu foto y transfórmala en un estilo anime japonés de alta calidad.",
    category: "Arte Conceptual",
    prompt: "A beautiful anime style portrait of a [SUJETO], studio ghibli style, makoto shinkai style, vibrant colors, detailed eyes, cinematic lighting, beautiful background, 8k anime art.",
    previewUrl: "https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=600&auto=format&fit=crop",
    imageRequirement: "required",
    variables: ["SUJETO"]
  }
];
