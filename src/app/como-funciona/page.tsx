"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import BrandHeader from "../../components/BrandHeader";
import BrandFooter from "../../components/BrandFooter";
import DotCanvas from "../../components/DotCanvas";
import PageTracker from "../../components/PageTracker";
import WebChatWidget from "../../components/WebChatWidget";

const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "56934428848";
const WA_MSG = encodeURIComponent(
  "¡Hola Santisoft! Vi la página de cómo funciona su equipo de agentes para redes y quiero ver una muestra para mi negocio."
);

type ImageOrigin = "real" | "generated";
type BusinessSector = "gastronomia" | "retail" | "belleza" | "fitness";
type ScenarioKey = "aprobar" | "urgente" | "metricas";
type PromptCategory = "all" | "gastronomia" | "retail" | "belleza" | "servicios";
type ReelNiche = "gastronomia" | "retail" | "belleza" | "fitness";

interface VideoPromptHighlight {
  command: string;
  name: string;
  category: string;
  icon: string;
  tag: string;
  description: string;
  cameraMovement: string;
  physicsEffect: string;
  recommendedFor: string;
  bgUrl: string;
  videoUrl?: string;
  baseImageUrl?: string;
}

const VIDEO_PROMPT_HIGHLIGHTS: VideoPromptHighlight[] = [
  {
    command: "/360 product orbit",
    name: "Órbita 360° de Producto",
    category: "E-Commerce & Retail",
    icon: "🔄",
    tag: "3D & Catálogo",
    description: "Cámara en giro circular continuo y fluido alrededor del producto, revelando relieve, materiales y reflejos de estudio.",
    cameraMovement: "Rotación orbital estabilizada de 360 grados en plano medio",
    physicsEffect: "Paralaje de fondo con reflejos continuos sobre los bordes",
    recommendedFor: "Zapatillas, botellas, cosmética, tecnología, calzado y accesorios",
    bgUrl: "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_360_product_orbit_image_1791908361375.jpg?alt=media&token=8587c752-bbde-49e9-9766-2e0a7e5bd16b",
    baseImageUrl: "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_360_product_orbit_image_1791908361375.jpg?alt=media&token=8587c752-bbde-49e9-9766-2e0a7e5bd16b",
    videoUrl: "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_360_product_orbit_video_1791908370384.mp4?alt=media&token=255d8c89-98e8-4a22-a30a-d8a2feb6f8af",
  },
  {
    command: "/smoke reveal",
    name: "Revelación con Humo Volumétrico",
    category: "Lanzamientos & Estilo",
    icon: "💨",
    tag: "Misterio & Impacto",
    description: "Cortina de humo denso y envolvente que se abre suavemente para revelar el producto con iluminación dramática.",
    cameraMovement: "Dolly push-in frontal suave con desenfoque cinematográfico",
    physicsEffect: "Humo que ondula e interactúa con la luz lateral antes de disiparse",
    recommendedFor: "Tragos de autor, platos a la parrilla, lanzamientos de temporada y moda urbana",
    bgUrl: "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_smoke_reveal_image_1791912549918.webp?alt=media&token=b064d1f1-508e-4a34-b6f5-e487b682dacf",
    baseImageUrl: "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_smoke_reveal_image_1791912549918.webp?alt=media&token=b064d1f1-508e-4a34-b6f5-e487b682dacf",
    videoUrl: "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_smoke_reveal_video_1791912556524.mp4?alt=media&token=fe380098-be2f-44ef-b847-fd532d47a692",
  },
  {
    command: "/water splash reveal",
    name: "Salpicadura de Agua Fresca",
    category: "Bebidas & Cosmética",
    icon: "💧",
    tag: "Frescura a 1000fps",
    description: "Gotas de agua pura que estallan en ultra cámara lenta, transmitiendo frescura irresistible y vitalidad.",
    cameraMovement: "Enfoque macro estático con seguimiento focal de alta definición",
    physicsEffect: "Dinámica de fluidos a 1000fps con destellos cristalinos en cada gota",
    recommendedFor: "Bebidas, cervezas, coctelería, cremas hidratantes y cuidado de la piel",
    bgUrl: "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_water_splash_reveal_image_1791909068083.jpg?alt=media&token=5b2327ed-ee9c-4db3-ac83-0df70ec12f4c",
    baseImageUrl: "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_water_splash_reveal_image_1791909068083.jpg?alt=media&token=5b2327ed-ee9c-4db3-ac83-0df70ec12f4c",
    videoUrl: "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_water_splash_reveal_video_1791909074089.mp4?alt=media&token=1ddff927-8722-42f2-8c42-384ab59fa9df",
  },
  {
    command: "/fresh food reveal",
    name: "Plato Recién Hecho con Vapor",
    category: "Gastronomía",
    icon: "🍔",
    tag: "Apetito Inmediato",
    description: "Cámara lenta cinematográfica con columnas de vapor caliente, salsas brillantes y texturas doradas que invitan a comer.",
    cameraMovement: "Acercamiento en ángulo bajo con suave inclinación cenital",
    physicsEffect: "Ondas sutiles de vapor culinario y brillo dorado sobre los ingredientes",
    recommendedFor: "Hamburguesas, pizzas, pastas, cortes de carne, sándwiches y café",
    bgUrl: "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_fresh_food_reveal_image_1791908932525.jpg?alt=media&token=2f817f96-ef93-4740-998c-c2826d3adb13",
    baseImageUrl: "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_fresh_food_reveal_image_1791908932525.jpg?alt=media&token=2f817f96-ef93-4740-998c-c2826d3adb13",
    videoUrl: "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_fresh_food_reveal_video_1791908993033.mp4?alt=media&token=4ea5d4e0-4c00-4d38-b2e8-009570c14128",
  },
  {
    command: "/Times Square 3D reveal",
    name: "Pantalla Anamórfica 3D",
    category: "Marcas & Servicios",
    icon: "🌆",
    tag: "Efecto Gran Marca",
    description: "Tu marca o producto se proyecta en una gigantesca pantalla curva 3D en Times Square, simulando salir hacia el público.",
    cameraMovement: "Toma callejera angular desde el suelo hacia la esquina monumental",
    physicsEffect: "Ilusión óptica anamórfica donde el contenido rompe el marco de la pantalla",
    recommendedFor: "Servicios profesionales, marcas corporativas, consultorías y lanzamientos",
    bgUrl: "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_times_square_3d_reveal_image_1791914453800.webp?alt=media&token=d4aa6e39-63ee-4f12-bde2-2f73b6b515d8",
    baseImageUrl: "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_times_square_3d_reveal_image_1791914453800.webp?alt=media&token=d4aa6e39-63ee-4f12-bde2-2f73b6b515d8",
    videoUrl: "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_times_square_3d_reveal_video_1791914460145.mp4?alt=media&token=aa6ddf8a-5b0e-4c97-b902-50ccf5ee2deb",
  },
  {
    command: "/macro product shot",
    name: "Macro a Detalles & Texturas",
    category: "Artesanal & Lujo",
    icon: "🔍",
    tag: "Alta Precisión",
    description: "Lente macro deslizándose sobre costuras, maderas, grabados o ingredientes seleccionados con nitidez total.",
    cameraMovement: "Deslizamiento rasante suave con enfoque selectivo progresivo",
    physicsEffect: "Iluminación lateral que acentúa el relieve y la confección auténtica",
    recommendedFor: "Joyería, ropa de autor, repostería fina, marroquinería y calzado",
    bgUrl: "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_macro_product_shot_image_1791908361375.jpg?alt=media&token=8587c752-bbde-49e9-9766-2e0a7e5bd16b",
    baseImageUrl: "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_macro_product_shot_image_1791910011818.jpg?alt=media&token=756d24c1-8169-42e0-b2ca-afd2cbb10a38",
    videoUrl: "https://firebasestorage.googleapis.com/v0/b/rrss-santisoft.firebasestorage.app/o/users%2FAGdJLwdz0QNhBPcRp1FdWWMooAb2%2Fflow_showcase%2F_macro_product_shot_video_1791910036356.mp4?alt=media&token=675a7d7e-a182-44da-b858-81427a4a8255",
  },
];

interface PromptStyleCard {
  id: string;
  name: string;
  category: "gastronomia" | "retail" | "belleza" | "servicios";
  tag: string;
  description: string;
  lightingMood: string;
  recommendedFor: string;
  bgUrl: string;
}

const PROMPT_GALLERY: PromptStyleCard[] = [
  {
    id: "gourmet-moody",
    name: "Gourmet de Autor (Dark & Moody)",
    category: "gastronomia",
    tag: "Alta Cocina & Bares",
    description: "Iluminación rasante tenue, contrastes cálidos y fondos oscuros que resaltan la textura y brillo de la comida.",
    lightingMood: "Luz lateral suave con penumbra de fondo",
    recommendedFor: "Restaurantes de autor, carnes premium, bares de cócteles y vinos",
    bgUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "street-food-vibrant",
    name: "Street Food & Alto Contraste",
    category: "gastronomia",
    tag: "Comida Rápida & Burgers",
    description: "Primeros planos jugosos con queso derretido, colores intensos y fondos con ligero desenfoque urbano.",
    lightingMood: "Luz cenital cálida de alto impacto",
    recommendedFor: "Hamburgueserías, pizzerías, sándwiches, sushi y locales nocturnos",
    bgUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "retail-studio-podio",
    name: "Retail Studio & Podio Minimalista",
    category: "retail",
    tag: "Productos & Calzado",
    description: "Fondo neutro pulido, iluminación difusa de estudio y sombras suaves que destacan materiales y acabados del producto.",
    lightingMood: "Luz de estudio difusa sin brillos molestos",
    recommendedFor: "Zapatillas, relojes, tecnología, accesorios, perfumería y regalos",
    bgUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "boutique-street-style",
    name: "Boutique & Street Style Urbano",
    category: "retail",
    tag: "Moda & Ropa",
    description: "Estilo editorial con luz natural de calle, percheros cuidados y atmósfera de tienda exclusiva con estilo.",
    lightingMood: "Luz natural diurna y tonos orgánicos",
    recommendedFor: "Tiendas de ropa, boutiques, calzado, óptica y accesorios de vestir",
    bgUrl: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "clean-aesthetic-glow",
    name: "Clean Aesthetic & Glow Natural",
    category: "belleza",
    tag: "Estética & Cuidado",
    description: "Tonos claros, luz cálida envolvente, gotas frescas y sensación de bienestar, higiene y pureza absoluta.",
    lightingMood: "Softbox envolvente con rebote blanco",
    recommendedFor: "Centros de estética, spas, tratamientos faciales, cosmética y uñas",
    bgUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "vintage-barber-studio",
    name: "Vintage Barber & Gentleman Studio",
    category: "belleza",
    tag: "Barbería & Peluquería",
    description: "Maderas nobles, cuero, detalles metálicos y luz focal de corte clásico y moderno de alta precisión.",
    lightingMood: "Luz focal cálida sobre texturas oscuras",
    recommendedFor: "Barberías, salones de peinado, tatuajes y cuidado masculino",
    bgUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "high-energy-fitness",
    name: "High Energy & Fuerza Deportiva",
    category: "servicios",
    tag: "Gimnasios & Crossfit",
    description: "Contraste dramático, sombras marcadas, atmósfera deportiva y enfoque en rendimiento, pesas y motivación.",
    lightingMood: "Contraluz rasante con destellos de neón",
    recommendedFor: "Gimnasios, box de crossfit, academias de artes marciales y entrenadores",
    bgUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "clinica-confianza-clean",
    name: "Clínica de Confianza & Salud Clean",
    category: "servicios",
    tag: "Salud, Dental & Profesionales",
    description: "Blancos luminosos, luz suave no invasiva y atmósfera de alta tecnología, serenidad y máximo profesionalismo.",
    lightingMood: "Iluminación diurna pareja y cristalina",
    recommendedFor: "Clínicas dentales, centros médicos, kinesiología, ópticas y veterinarias",
    bgUrl: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80",
  },
];

export default function ComoFuncionaPage() {
  // Origen de la imagen: Real vs Generada por agentes
  const [imageOrigin, setImageOrigin] = useState<ImageOrigin>("real");

  // Modo de texto comercial en showroom: Con texto (cartel con precios/oferta) vs Sin texto comercial (foto limpia)
  const [showroomTextMode, setShowroomTextMode] = useState<"con_texto" | "sin_texto">("con_texto");

  // Rubro seleccionado en el showroom interactivo
  const [selectedSector, setSelectedSector] = useState<BusinessSector>("gastronomia");
  const [showOriginal, setShowOriginal] = useState(false);

  // Filtro de la galería de prompts
  const [activePromptCat, setActivePromptCat] = useState<PromptCategory>("all");

  // Niche en el selector de Reels
  const [activeReelNiche, setActiveReelNiche] = useState<ReelNiche>("gastronomia");

  // Comando seleccionado en la biblioteca de prompts de video
  const [selectedVideoCommand, setSelectedVideoCommand] = useState<string>("/360 product orbit");
  const [videoPreviewMode, setVideoPreviewMode] = useState<"video" | "image">("video");
  const [copiedCommandNotice, setCopiedCommandNotice] = useState<string | null>(null);

  const activeVideoHighlight =
    VIDEO_PROMPT_HIGHLIGHTS.find((v) => v.command === selectedVideoCommand) ||
    VIDEO_PROMPT_HIGHLIGHTS[0];

  const handleCopyVideoCommand = (cmd: string) => {
    try {
      navigator.clipboard.writeText(cmd);
      setCopiedCommandNotice(cmd);
      setTimeout(() => setCopiedCommandNotice(null), 2500);
    } catch {
      // Fallback si clipboard no está disponible
    }
  };

  // Simulador de WhatsApp
  const [activeScenario, setActiveScenario] = useState<ScenarioKey>("aprobar");

  // Formulario express de muestra
  const [businessName, setBusinessName] = useState("");
  const [businessRubro, setBusinessRubro] = useState("Tienda de Ropa, Calzado o Moda");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [sampleTextPreference, setSampleTextPreference] = useState<"mixto" | "con_texto" | "sin_texto">("mixto");
  const [formStatus, setFormStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  // Scroll reveal observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08 }
    );

    const elements = document.querySelectorAll("[data-reveal]");
    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleSampleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !contactPhone) return;

    setFormStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: businessName,
          rubro: businessRubro,
          telefono: contactPhone,
          email: contactEmail || `${businessName.toLowerCase().replace(/\s+/g, "")}@contacto.temporal`,
          mensaje: `Solicitud de muestra comercial para ${businessName} (Rubro: ${businessRubro}). Preferencia visual: ${sampleTextPreference}. WhatsApp: ${contactPhone}`,
          imageTextPreference: sampleTextPreference,
        }),
      });

      if (!res.ok) throw new Error("Error enviando solicitud");
      setFormStatus("success");
    } catch {
      setFormStatus("error");
    }
  };

  const filteredPrompts =
    activePromptCat === "all"
      ? PROMPT_GALLERY
      : PROMPT_GALLERY.filter((p) => p.category === activePromptCat);

  // Configuración de imagen y copy del showroom según rubro
  const sectorData = {
    gastronomia: {
      name: "Gastronomía & Comida",
      icon: "🍔",
      badge: "Restaurantes · Fast Food · Cafés",
      tagReal: "🔥 COMBO IMPERDIBLE",
      subReal: "Edición Especial de la Casa",
      titleReal: "Doble Cheddar & Papas",
      descReal: "Carne angus smash, queso fundido y papas rústicas con salsa especial.",
      priceReal: "$8.990",
      ctaReal: "Pide Aquí ➔",
      imgReal: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1000&q=80",

      tagGen: "⭐ RECOMENDACIÓN DEL CHEF",
      subGen: "Creado por Nuestros Agentes",
      titleGen: "Salmón a las Finas Hierbas",
      descGen: "Sellado en mantequilla clarificada con reducción de cítricos y papas doradas.",
      priceGen: "$14.990",
      ctaGen: "Reserva tu Mesa ➔",
      imgGen: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=80",
    },
    retail: {
      name: "Tiendas & Retail",
      icon: "👟",
      badge: "Ropa · Zapatillas · Accesorios · Hogar",
      tagReal: "⚡ NUEVA TEMPORADA",
      subReal: "Stock Limitado en Tienda",
      titleReal: "Urban Retro Sneakers",
      descReal: "Suela ergonómica amortiguada, lona respirable y acabado de alta resistencia.",
      priceReal: "30% OFF · $39.990",
      ctaReal: "Comprar al WhatsApp ➔",
      imgReal: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1000&q=80",

      tagGen: "✨ EDICIÓN DE AUTOR",
      subGen: "Catálogo de Nuestros Agentes",
      titleGen: "Minimalist Silver Watch",
      descGen: "Cristal de zafiro pulido, correa de cuero genuino y maquinaria de precisión.",
      priceGen: "$49.990",
      ctaGen: "Ver Catálogo Completo ➔",
      imgGen: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1000&q=80",
    },
    belleza: {
      name: "Estética & Belleza",
      icon: "💈",
      badge: "Barberías · Salones · Spas · Uñas",
      tagReal: "💈 PACK SEMANAL",
      subReal: "Agenda de Martes a Jueves",
      titleReal: "Corte Degradé + Barba",
      descReal: "Incluye perfilado navaja, toalla caliente y loción tónica de eucalipto.",
      priceReal: "$16.990",
      ctaReal: "Reservar Turno ➔",
      imgReal: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=1000&q=80",

      tagGen: "🌸 BIENESTAR Y CUIDADO",
      subGen: "Diseñado por Nuestros Agentes",
      titleGen: "Limpieza Facial Glow",
      descGen: "Hidratación profunda con ácido hialurónico, exfoliación suave y máscara botánica.",
      priceGen: "$28.990",
      ctaGen: "Agendar Sesión ➔",
      imgGen: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1000&q=80",
    },
    fitness: {
      name: "Fitness, Salud & Servicios",
      icon: "⚡",
      badge: "Gimnasios · Clínicas · Talleres · Oficios",
      tagReal: "💪 PLAN TRANSFORMACIÓN",
      subReal: "Cupos Disponibles de Mes",
      titleReal: "Pase Libre Trimestral",
      descReal: "Acceso total a máquinas, peso libre, clases dirigidas y evaluación física periódica.",
      priceReal: "Matrícula $0 · $34.990/mes",
      ctaReal: "Empezar Hoy ➔",
      imgReal: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1000&q=80",

      tagGen: "⭐ SALUD DENTAL PREVENTIVA",
      subGen: "Propuesta de Nuestros Agentes",
      titleGen: "Evaluación + Limpieza Pro",
      descGen: "Diagnóstico clínico integral con cámara intraoral, destartraje y pulido profiláctico.",
      priceGen: "$24.990",
      ctaGen: "Pedir Hora Médica ➔",
      imgGen: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1000&q=80",
    },
  };

  const currentSector = sectorData[selectedSector];

  // Reels scripts por rubro
  const reelHooks: Record<ReelNiche, { tag: string; hook: string; bg: string }> = {
    gastronomia: {
      tag: "● REEL GASTRONOMÍA",
      hook: '"Si buscas una hamburguesa que realmente chorree queso en Santiago, tienes que ver esto..."',
      bg: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
    },
    retail: {
      tag: "● REEL MODA & RETAIL",
      hook: '"3 prendas esenciales que combinan con absolutamente todo y no sabías que necesitabas..."',
      bg: "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=800&q=80",
    },
    belleza: {
      tag: "● REEL ESTÉTICA & BARBERÍA",
      hook: '"El cambio de look que rejuvenece 5 años y todos nos están pidiendo esta semana..."',
      bg: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80",
    },
    fitness: {
      tag: "● REEL FITNESS & SALUD",
      hook: '"El único hábito diario que necesitas si pasas más de 6 horas sentado frente al computador..."',
      bg: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",
    },
  };

  return (
    <div className="landing-page-root relative overflow-x-hidden min-h-screen">
      <PageTracker page="como-funciona" />
      <DotCanvas />
      <WebChatWidget />

      {/* ── BANNER SUPERIOR ── */}
      <div className="promo">
        <span className="on-air"></span>
        PRUEBA GRATUITA — <strong>7 DÍAS Y 5 PUBLICACIONES DE MUESTRA</strong> · SIN TARJETA DE CRÉDITO
      </div>

      {/* ── NAVEGACIÓN PRINCIPAL ── */}
      <BrandHeader />

      {/* ── 1. HERO COMERCIAL UNIVERSAL (MULTI-RUBRO) ── */}
      <section className="hero pt-14 pb-20 border-b" style={{ borderColor: "var(--line)" }}>
        <div className="wrap">
          <div className="text-center max-w-4xl mx-auto" data-reveal>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-xs font-bold uppercase tracking-wider mb-6">
              <span>🚀</span> Tu equipo de marketing trabajando 24/7
            </div>

            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight mb-6"
              style={{ color: "var(--ink)" }}
            >
              Gestionamos las redes de tu negocio, atraemos clientes y publicamos{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">
                todos los días por ti.
              </span>
            </h1>

            <p
              className="text-lg sm:text-xl leading-relaxed max-w-3xl mx-auto mb-8"
              style={{ color: "var(--ink-dim)" }}
            >
              Nuestros agentes especializados investigan qué busca tu cliente, arman tu calendario del mes,
              visten las fotos de tus productos o servicios con cartelería comercial de alto impacto y publican
              automáticamente en Instagram, Facebook, TikTok y Google. <strong>Tú solo apruebas desde WhatsApp en 10 segundos.</strong>
            </p>

            {/* Rubros de Negocios Compatibles */}
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto mb-10">
              <span className="text-xs font-bold uppercase mr-1" style={{ color: "var(--ink-faint)" }}>
                Diseñado para:
              </span>
              {[
                "🛍️ Tiendas & Retail",
                "🍽️ Restaurantes & Cafés",
                "💈 Salones & Barberías",
                "🏋️ Gimnasios & Fitness",
                "🩺 Clínicas & Salud",
                "🔧 Talleres & Servicios",
              ].map((pill) => (
                <span
                  key={pill}
                  className="px-3 py-1 rounded-lg text-xs font-semibold border shadow-sm"
                  style={{
                    background: "var(--panel)",
                    borderColor: "var(--line)",
                    color: "var(--ink)",
                  }}
                >
                  {pill}
                </span>
              ))}
            </div>

            {/* Doble CTA Hero */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-xl mx-auto">
              <a
                href="#muestra-gratis"
                className="w-full sm:w-auto px-7 py-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-base shadow-xl shadow-orange-500/25 transition-all transform hover:-translate-y-0.5 text-center flex items-center justify-center gap-2"
              >
                <span>✨</span> Ver Muestra Gratis de Mi Negocio
              </a>

              <a
                href={`https://wa.me/${WA_NUMBER}?text=${WA_MSG}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-7 py-4 rounded-xl border font-semibold text-base transition-all text-center flex items-center justify-center gap-2 shadow-sm"
                style={{
                  background: "var(--panel)",
                  borderColor: "var(--line-strong)",
                  color: "var(--ink)",
                }}
              >
                <span>💬</span> Chatear por WhatsApp
              </a>
            </div>

            {/* Badges de confianza */}
            <div
              className="flex flex-wrap items-center justify-center gap-6 mt-10 text-xs font-medium"
              style={{ color: "var(--ink-dim)" }}
            >
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-500 font-bold">✓</span> Sin contratos forzosos
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-500 font-bold">✓</span> Fotos reales de tu local o catálogo
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-emerald-500 font-bold">✓</span> Control 100% desde tu WhatsApp
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. EL DOLOR REAL DEL CLIENTE (CUALQUIER LOCAL COMERCIAL) ── */}
      <section className="py-24 border-b" style={{ borderColor: "var(--line)" }}>
        <div className="wrap">
          <div className="text-center max-w-3xl mx-auto mb-16" data-reveal>
            <span className="eyebrow text-orange-500 font-bold text-xs uppercase tracking-wider">
              La realidad del día a día
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2" style={{ color: "var(--ink)" }}>
              Llevar un negocio ya es bastante trabajo como para además ser creador de contenido.
            </h2>
            <p className="mt-4 text-base" style={{ color: "var(--ink-dim)" }}>
              Hablamos a diario con dueños de tiendas de ropa, restaurantes, centros de estética, gimnasios, clínicas
              y talleres. Todos enfrentan las mismas 3 frustraciones:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8" data-reveal>
            {/* Tarjeta 1 */}
            <div
              className="p-8 rounded-2xl border shadow-sm flex flex-col justify-between transition-all"
              style={{ background: "var(--panel)", borderColor: "var(--line)" }}
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center text-2xl mb-6">
                  ⏳
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: "var(--ink)" }}>
                  &quot;¿A qué hora diseño si estoy atendiendo clientes?&quot;
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                  Terminas tu jornada agotado. Quieres subir algo a redes, pero te quedas en blanco frente al celular,
                  lo pospones para mañana y tu cuenta pasa semanas en silencio perdiendo clientes frente a los que sí publican.
                </p>
              </div>
              <div
                className="mt-6 pt-4 border-t text-xs text-red-500 font-medium"
                style={{ borderColor: "var(--line)" }}
              >
                ✕ Resultado: Tus competidores locales se quedan con la atención y las ventas.
              </div>
            </div>

            {/* Tarjeta 2 */}
            <div
              className="p-8 rounded-2xl border shadow-sm flex flex-col justify-between transition-all"
              style={{ background: "var(--panel)", borderColor: "var(--line)" }}
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center text-2xl mb-6">
                  💸
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: "var(--ink)" }}>
                  &quot;Las agencias tradicionales cobran caro y demoran días&quot;
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                  Te cobran cientos de miles de pesos cada mes por un par de publicaciones genéricas. Pides una promoción
                  urgente para liquidar stock este fin de semana y tardan 5 días en responderte un correo.
                </p>
              </div>
              <div
                className="mt-6 pt-4 border-t text-xs text-amber-500 font-medium"
                style={{ borderColor: "var(--line)" }}
              >
                ✕ Resultado: Pagar caro por un servicio lento, rígido y poco conectado con tu local.
              </div>
            </div>

            {/* Tarjeta 3 */}
            <div
              className="p-8 rounded-2xl border shadow-sm flex flex-col justify-between transition-all"
              style={{ background: "var(--panel)", borderColor: "var(--line)" }}
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center text-2xl mb-6">
                  📸
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: "var(--ink)" }}>
                  &quot;Saco fotos pero no se ven como las de marcas grandes&quot;
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                  Tu producto, prenda, plato o servicio es de excelente calidad, pero una foto suelta en el celular se ve
                  fría, sin precios claros, sin llamados a la acción y sin el diseño comercial que invita a comprar.
                </p>
              </div>
              <div
                className="mt-6 pt-4 border-t text-xs text-orange-500 font-medium"
                style={{ borderColor: "var(--line)" }}
              >
                ✕ Resultado: Fotos caseras que no transmiten el verdadero valor de tu negocio.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. CÓMO LO HACEMOS (3 PASOS SIN ESFUERZO) ── */}
      <section className="py-24 border-b" style={{ borderColor: "var(--line)" }}>
        <div className="wrap">
          <div className="text-center max-w-3xl mx-auto mb-20" data-reveal>
            <span className="eyebrow text-orange-500 font-bold text-xs uppercase tracking-wider">
              Flujo 100% Sin Fricción
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2" style={{ color: "var(--ink)" }}>
              Tu presencia en redes resuelta en 3 pasos simples.
            </h2>
            <p className="mt-4 text-base" style={{ color: "var(--ink-dim)" }}>
              Olvídate de curvas de aprendizaje o configuraciones eternas. Diseñamos este sistema para que delegues el 100% del trabajo pesado sin perder el control de tu negocio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8" data-reveal>
            {/* Paso 1 */}
            <div
              className="relative p-8 rounded-2xl border shadow-sm flex flex-col justify-between"
              style={{ background: "var(--panel)", borderColor: "var(--line)" }}
            >
              <div>
                <div className="text-xs font-mono font-bold text-orange-500 mb-3 tracking-widest">PASO 01 · 25 MINUTOS</div>
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center text-2xl mb-5">
                  🧬
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: "var(--ink)" }}>
                  Clonamos el ADN de tu Negocio
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                  En solo 25 minutos con nuestro <strong>Setup Llave en Mano</strong> nos conectamos contigo: extraemos la voz de tu marca desde tu web o Instagram, definimos tu paleta corporativa y dejamos tu primera quincena lista sin que toques una sola tecla.
                </p>
              </div>
              <div
                className="mt-6 pt-4 border-t text-xs flex items-center gap-1.5 font-semibold text-emerald-500"
                style={{ borderColor: "var(--line)" }}
              >
                <span>✓</span> Videollamada de 25 min incluida gratis
              </div>
            </div>

            {/* Paso 2 */}
            <div
              className="relative p-8 rounded-2xl border shadow-sm flex flex-col justify-between"
              style={{ background: "var(--panel)", borderColor: "var(--line)" }}
            >
              <div>
                <div className="text-xs font-mono font-bold text-blue-500 mb-3 tracking-widest">PASO 02 · 5 MINUTOS</div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center text-2xl mb-5">
                  ⚡
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: "var(--ink)" }}>
                  Tu Mes Completo, Espía de Competencia y Guiones
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                  En 5 minutos el motor genera tu calendario hiper-orgánico del mes: analiza qué le funciona a tu competencia en Chile, diseña gráficas con tu logo y redacta guiones de Reels palabra por palabra con protección anti-baneos de Instagram.
                </p>
              </div>
              <div
                className="mt-6 pt-4 border-t text-xs flex items-center gap-1.5 font-semibold text-emerald-500"
                style={{ borderColor: "var(--line)" }}
              >
                <span>✓</span> Espía activo + 30 días de contenido
              </div>
            </div>

            {/* Paso 3 */}
            <div
              className="relative p-8 rounded-2xl border shadow-sm flex flex-col justify-between"
              style={{ background: "var(--panel)", borderColor: "var(--line)" }}
            >
              <div>
                <div className="text-xs font-mono font-bold text-purple-500 mb-3 tracking-widest">PASO 03 · 1 CLIC</div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center text-2xl mb-5">
                  🎯
                </div>
                <h3 className="text-xl font-bold mb-3" style={{ color: "var(--ink)" }}>
                  Apruebas en 1 Clic desde tu Celular y a Vender
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                  Revisas todo cómodamente desde tu celular o WhatsApp, apruebas con 1 solo toque y tus publicaciones salen programadas en el horario de mayor venta. Tu marca siempre visible sin consumir tu tiempo.
                </p>
              </div>
              <div
                className="mt-6 pt-4 border-t text-xs flex items-center gap-1.5 font-semibold text-emerald-500"
                style={{ borderColor: "var(--line)" }}
              >
                <span>✓</span> Control total desde WhatsApp
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. SHOWROOM INTERACTIVO MULTI-RUBRO (FOTOS REALES VS CREADAS POR AGENTES) ── */}
      <section className="py-24 border-b" style={{ borderColor: "var(--line)" }}>
        <div className="wrap">
          <div className="text-center max-w-3xl mx-auto mb-16" data-reveal>
            <span className="eyebrow text-orange-500 font-bold text-xs uppercase tracking-wider">
              El gran diferencial visual
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2" style={{ color: "var(--ink)" }}>
              El texto directo sobre la imagen. Tu producto o servicio siempre es el protagonista.
            </h2>
            <p className="mt-4 text-base" style={{ color: "var(--ink-dim)" }}>
              Cero plantillas genéricas con cajas oscuras que tapen lo que vendes. Nuestros agentes estampan tipografía
              publicitaria nítida directamente sobre el espacio libre de la foto, ya sea una foto real tomada con tu
              teléfono o una imagen de catálogo creada por ellos mismos.
            </p>

            {/* Selector de Rubros Comerciales */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
              {(
                [
                  { key: "gastronomia", label: "🍔 Gastronomía & Comida" },
                  { key: "retail", label: "👟 Tiendas & Retail" },
                  { key: "belleza", label: "💈 Estética & Belleza" },
                  { key: "fitness", label: "⚡ Fitness & Salud" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setSelectedSector(tab.key);
                    setShowOriginal(false);
                  }}
                  className="px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-all border shadow-sm"
                  style={{
                    background: selectedSector === tab.key ? "var(--signal)" : "var(--panel)",
                    color: selectedSector === tab.key ? "#FFFFFF" : "var(--ink)",
                    borderColor: selectedSector === tab.key ? "var(--signal)" : "var(--line)",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Selector de Origen: Foto Real vs Creada por Agentes */}
            <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
              <button
                onClick={() => {
                  setImageOrigin("real");
                  setShowOriginal(false);
                }}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
                  imageOrigin === "real" ? "shadow-sm font-bold" : ""
                }`}
                style={{
                  background: imageOrigin === "real" ? "var(--panel-2)" : "var(--panel)",
                  borderColor: imageOrigin === "real" ? "var(--signal)" : "var(--line)",
                  color: imageOrigin === "real" ? "var(--signal)" : "var(--ink-dim)",
                }}
              >
                📸 Fotos Reales de tu Catálogo / Local
              </button>

              <button
                onClick={() => {
                  setImageOrigin("generated");
                  setShowOriginal(false);
                }}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
                  imageOrigin === "generated" ? "shadow-sm font-bold" : ""
                }`}
                style={{
                  background: imageOrigin === "generated" ? "var(--panel-2)" : "var(--panel)",
                  borderColor: imageOrigin === "generated" ? "var(--signal)" : "var(--line)",
                  color: imageOrigin === "generated" ? "var(--signal)" : "var(--ink-dim)",
                }}
              >
                🎨 Imágenes Creadas por Nuestros Agentes
              </button>
            </div>

            {/* Selector de Formato: Con Texto Comercial vs Sin Texto Comercial */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              <span className="text-xs font-bold uppercase tracking-wider mr-1" style={{ color: "var(--ink-dim)" }}>
                Formato visual:
              </span>
              <button
                onClick={() => setShowroomTextMode("con_texto")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                  showroomTextMode === "con_texto" ? "shadow-xs ring-1 ring-orange-500/30" : "opacity-75 hover:opacity-100"
                }`}
                style={{
                  background: showroomTextMode === "con_texto" ? "var(--signal)" : "var(--panel)",
                  color: showroomTextMode === "con_texto" ? "#FFFFFF" : "var(--ink)",
                  borderColor: showroomTextMode === "con_texto" ? "var(--signal)" : "var(--line)",
                }}
              >
                <span>🏷️</span> Con Texto Comercial (Cartel de Venta)
              </button>

              <button
                onClick={() => setShowroomTextMode("sin_texto")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                  showroomTextMode === "sin_texto" ? "shadow-xs ring-1 ring-orange-500/30" : "opacity-75 hover:opacity-100"
                }`}
                style={{
                  background: showroomTextMode === "sin_texto" ? "var(--signal)" : "var(--panel)",
                  color: showroomTextMode === "sin_texto" ? "#FFFFFF" : "var(--ink)",
                  borderColor: showroomTextMode === "sin_texto" ? "var(--signal)" : "var(--line)",
                }}
              >
                <span>🖼️</span> Sin Texto Comercial (Fotografía Limpia)
              </button>
            </div>
          </div>

          {/* Comparador Interactivo del Rubro Seleccionado */}
          <div
            className="max-w-4xl mx-auto rounded-3xl border p-6 sm:p-10 shadow-xl"
            style={{ background: "var(--panel)", borderColor: "var(--line)" }}
            data-reveal
          >
            <div
              className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-6 border-b"
              style={{ borderColor: "var(--line)" }}
            >
              <div>
                <span className="text-xs font-mono font-bold text-orange-500 uppercase tracking-wider">
                  {currentSector.icon} {currentSector.name} · {currentSector.badge}
                </span>
                <h3 className="text-xl font-bold mt-1" style={{ color: "var(--ink)" }}>
                  {showroomTextMode === "con_texto"
                    ? (imageOrigin === "real"
                        ? `Foto Real del Negocio con Tipografía Directa de Nuestros Agentes`
                        : `Cartel Comercial Creado por Nuestros Agentes con Titular y Precio`)
                    : (imageOrigin === "real"
                        ? `Foto Real Limpia y Apetitosa sin Textos Superpuestos`
                        : `Fotografía Limpia de Producto Creada por Nuestros Agentes`)}
                </h3>
              </div>

              {/* Botón Switch: Original vs Arte (visible solo si es foto real y modo con texto) */}
              {imageOrigin === "real" && showroomTextMode === "con_texto" && (
                <div
                  className="flex items-center gap-3 px-4 py-2 rounded-xl border shrink-0"
                  style={{ background: "var(--panel-2)", borderColor: "var(--line)" }}
                >
                  <span className="text-xs font-medium" style={{ color: "var(--ink-dim)" }}>
                    Foto cruda de celular
                  </span>
                  <button
                    onClick={() => setShowOriginal((prev) => !prev)}
                    className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-200 ease-in-out ${
                      !showOriginal ? "bg-orange-500" : "bg-slate-400"
                    }`}
                    aria-label="Alternar vista original"
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                        !showOriginal ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span className="text-xs font-bold text-orange-500">Con Arte Directo</span>
                </div>
              )}
            </div>

            {/* Contenedor del Cartel: TEXTO DIRECTO SOBRE LA IMAGEN O FOTO LIMPIA */}
            <div className="relative aspect-square max-w-[500px] mx-auto rounded-2xl overflow-hidden shadow-2xl border border-stone-800 bg-stone-950 flex flex-col justify-between p-7 select-none">
              {/* Imagen de fondo */}
              <div
                className="absolute inset-0 bg-cover bg-center transition-all duration-300"
                style={{
                  backgroundImage: showroomTextMode === "con_texto"
                    ? `linear-gradient(to right, rgba(10,15,25,0.92) 0%, rgba(10,15,25,0.65) 48%, rgba(0,0,0,0.1) 85%), url('${
                        imageOrigin === "real" ? currentSector.imgReal : currentSector.imgGen
                      }')`
                    : `url('${imageOrigin === "real" ? currentSector.imgReal : currentSector.imgGen}')`,
                  filter: showOriginal ? "none" : "contrast(1.05) saturate(1.1)",
                }}
              />

              {/* Modo foto cruda de celular */}
              {showOriginal && imageOrigin === "real" && showroomTextMode === "con_texto" ? (
                <div className="relative z-10 m-auto bg-black/75 backdrop-blur-md px-6 py-4 rounded-xl border border-white/20 text-center">
                  <span className="text-3xl mb-2 block">📱</span>
                  <p className="text-base font-bold text-white">Foto original tomada con tu celular</p>
                  <p className="text-xs text-slate-300 mt-1">Sin tipografía, sin precios destacados ni llamado a la acción.</p>
                </div>
              ) : showroomTextMode === "sin_texto" ? (
                /* MODO SIN TEXTO: FOTO LIMPIA CON MARCA DE AGUA EN ESQUINA */
                <div className="relative z-10 w-full h-full flex flex-col justify-between pointer-events-none">
                  {/* Marca de agua de muestra en esquina superior derecha */}
                  <div className="flex justify-end">
                    <span className="px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md border border-white/20 text-white font-mono text-[9px] uppercase tracking-wider shadow-md flex items-center gap-1.5 opacity-90">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                      MUESTRA DE PRUEBA · SANTISOFT
                    </span>
                  </div>

                  {/* Badge inferior explicativo de foto limpia */}
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1.5 rounded-lg bg-black/75 backdrop-blur-md border border-white/20 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg">
                      <span>🖼️</span> Fotografía Limpia (Sin Textos Gráficos)
                    </span>
                    <span className="px-2.5 py-1 rounded-md bg-emerald-600/90 text-white text-[10px] font-black uppercase tracking-wider shadow">
                      ✓ Branding &amp; Estética Pura
                    </span>
                  </div>
                </div>
              ) : (
                /* MODO CON TEXTO: TEXTO DIRECTO SOBRE EL LADO IZQUIERDO DE LA IMAGEN */
                <div className="relative z-10 w-full h-full flex flex-col justify-between">
                  {/* Marca de agua de muestra en esquina superior derecha */}
                  <div className="absolute top-0 right-0 pointer-events-none select-none">
                    <span className="px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md border border-white/20 text-white font-mono text-[9px] uppercase tracking-wider shadow-md flex items-center gap-1.5 opacity-90">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                      MUESTRA DE PRUEBA · SANTISOFT
                    </span>
                  </div>

                  <div className="w-[54%] space-y-2">
                    <span className="inline-block px-2.5 py-1 rounded bg-orange-600 text-white font-extrabold text-[10px] tracking-wider uppercase shadow-md">
                      {imageOrigin === "real" ? currentSector.tagReal : currentSector.tagGen}
                    </span>
                    <p className="text-xs font-serif italic text-amber-300 drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
                      {imageOrigin === "real" ? currentSector.subReal : currentSector.subGen}
                    </p>
                    <h4 className="text-2xl sm:text-3xl font-black text-white leading-tight uppercase drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
                      {imageOrigin === "real" ? currentSector.titleReal : currentSector.titleGen}
                    </h4>
                    <p className="text-xs text-slate-200 line-clamp-2 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                      {imageOrigin === "real" ? currentSector.descReal : currentSector.descGen}
                    </p>
                  </div>

                  <div className="w-[54%] flex items-end justify-between pt-4">
                    <div>
                      <span className="text-[10px] text-slate-300 uppercase block font-bold drop-shadow">Precio o Promo</span>
                      <span className="text-xl sm:text-2xl font-black text-amber-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                        {imageOrigin === "real" ? currentSector.priceReal : currentSector.priceGen}
                      </span>
                    </div>
                    <span className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-black shadow-xl shadow-orange-500/40">
                      {imageOrigin === "real" ? currentSector.ctaReal : currentSector.ctaGen}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Explicación de nuestros agentes */}
            <div
              className="mt-6 p-4 rounded-xl border flex items-center gap-3 text-xs sm:text-sm"
              style={{
                background: "var(--signal-soft)",
                borderColor: "var(--signal-line)",
                color: "var(--ink)",
              }}
            >
              <span className="text-xl">✨</span>
              <span>
                <strong>Generamos ambos estilos para tu marca:</strong> Nuestros agentes diseñan tanto{" "}
                <strong>carteles comerciales</strong> con tipografía, precios y ofertas directas para incentivar pedidos, como{" "}
                <strong>fotografías limpias de autor</strong> sin textos encima para proyectar la máxima estética y posicionamiento de tu negocio.
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. GALERÍA DE PROMPTS Y ESTILOS VISUALES DISPONIBLES POR RUBRO ── */}
      <section className="py-24 border-b" style={{ borderColor: "var(--line)" }}>
        <div className="wrap">
          <div className="text-center max-w-3xl mx-auto mb-16" data-reveal>
            <span className="eyebrow text-orange-500 font-bold text-xs uppercase tracking-wider">
              Identidad de marca a tu medida
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2" style={{ color: "var(--ink)" }}>
              Nuestra Galería de Estilos Visuales &amp; Prompts para Todo Rubro.
            </h2>
            <p className="mt-4 text-base" style={{ color: "var(--ink-dim)" }}>
              Cada rubro comercial tiene un lenguaje visual propio. Nuestros agentes cuentan con una amplia biblioteca de
              estilos fotográficos calibrados para que todas tus publicaciones proyecten la seriedad y el atractivo de una gran marca.
            </p>

            {/* Filtros de la Galería */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setActivePromptCat("all")}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border"
                style={{
                  background: activePromptCat === "all" ? "var(--signal)" : "var(--panel)",
                  color: activePromptCat === "all" ? "#FFFFFF" : "var(--ink)",
                  borderColor: activePromptCat === "all" ? "var(--signal)" : "var(--line)",
                }}
              >
                Todos los Rubros
              </button>
              <button
                onClick={() => setActivePromptCat("gastronomia")}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border"
                style={{
                  background: activePromptCat === "gastronomia" ? "var(--signal)" : "var(--panel)",
                  color: activePromptCat === "gastronomia" ? "#FFFFFF" : "var(--ink)",
                  borderColor: activePromptCat === "gastronomia" ? "var(--signal)" : "var(--line)",
                }}
              >
                🍽️ Gastronomía &amp; Cocina
              </button>
              <button
                onClick={() => setActivePromptCat("retail")}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border"
                style={{
                  background: activePromptCat === "retail" ? "var(--signal)" : "var(--panel)",
                  color: activePromptCat === "retail" ? "#FFFFFF" : "var(--ink)",
                  borderColor: activePromptCat === "retail" ? "var(--signal)" : "var(--line)",
                }}
              >
                🛍️ Tiendas, Ropa &amp; Retail
              </button>
              <button
                onClick={() => setActivePromptCat("belleza")}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border"
                style={{
                  background: activePromptCat === "belleza" ? "var(--signal)" : "var(--panel)",
                  color: activePromptCat === "belleza" ? "#FFFFFF" : "var(--ink)",
                  borderColor: activePromptCat === "belleza" ? "var(--signal)" : "var(--line)",
                }}
              >
                ✨ Estética &amp; Belleza
              </button>
              <button
                onClick={() => setActivePromptCat("servicios")}
                className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border"
                style={{
                  background: activePromptCat === "servicios" ? "var(--signal)" : "var(--panel)",
                  color: activePromptCat === "servicios" ? "#FFFFFF" : "var(--ink)",
                  borderColor: activePromptCat === "servicios" ? "var(--signal)" : "var(--line)",
                }}
              >
                ⚡ Fitness, Salud &amp; Servicios
              </button>
            </div>
          </div>

          {/* Cuadrícula de Tarjetas de Estilos Visuales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-reveal>
            {filteredPrompts.map((style) => (
              <div
                key={style.id}
                className="group relative rounded-2xl overflow-hidden border shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
                style={{ background: "var(--panel)", borderColor: "var(--line)" }}
              >
                {/* Cabecera con imagen del estilo */}
                <div className="relative h-44 w-full overflow-hidden bg-slate-900">
                  <div
                    className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                    style={{ backgroundImage: `url('${style.bgUrl}')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-orange-600/90 text-white text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-sm">
                    {style.tag}
                  </span>
                </div>

                {/* Contenido de la tarjeta */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-bold mb-2 leading-snug" style={{ color: "var(--ink)" }}>
                      {style.name}
                    </h3>
                    <p className="text-xs leading-relaxed mb-4 line-clamp-3" style={{ color: "var(--ink-dim)" }}>
                      {style.description}
                    </p>

                    <div className="space-y-2 pt-3 border-t text-xs" style={{ borderColor: "var(--line)" }}>
                      <div>
                        <span className="font-semibold block text-[10px] uppercase" style={{ color: "var(--ink-faint)" }}>
                          Iluminación:
                        </span>
                        <span className="text-[11px]" style={{ color: "var(--ink)" }}>{style.lightingMood}</span>
                      </div>
                      <div>
                        <span className="font-semibold block text-[10px] uppercase" style={{ color: "var(--ink-faint)" }}>
                          Recomendado para:
                        </span>
                        <span className="font-medium text-[11px]" style={{ color: "var(--ink)" }}>
                          {style.recommendedFor}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t flex items-center justify-between text-xs" style={{ borderColor: "var(--line)" }}>
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      <span>✓</span> Listo en 1 clic
                    </span>
                    <a href="#muestra-gratis" className="text-orange-500 font-bold hover:underline">
                      Probar en tu marca ➔
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12" data-reveal>
            <p className="text-sm" style={{ color: "var(--ink-dim)" }}>
              ¿Tienes un estilo o colores corporativos específicos? Nuestros agentes pueden calibrar y fijar la
              <strong> paleta visual exacta</strong> de tu marca.
            </p>
          </div>

          {/* Banner de puente hacia la Biblioteca de Prompts de Video */}
          <div
            className="mt-12 p-6 sm:p-8 rounded-3xl border flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm"
            style={{ background: "var(--panel)", borderColor: "var(--line)" }}
            data-reveal
          >
            <div className="flex items-center gap-4 text-left">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center text-3xl shrink-0 shadow-lg shadow-orange-500/20">
                🎬
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-orange-500 block">
                  Nuevo Módulo de Video 9:16
                </span>
                <h3 className="text-lg sm:text-xl font-bold mt-0.5" style={{ color: "var(--ink)" }}>
                  ¿Prefieres ver las fotos de tus productos en movimiento?
                </h3>
                <p className="text-xs sm:text-sm mt-1 max-w-2xl" style={{ color: "var(--ink-dim)" }}>
                  Conoce nuestra <strong>Biblioteca de Prompts de Video</strong>: más de 20 comandos cinematográficos para
                  transformar fotos estáticas en videos publicitarios con órbita 360°, humo, agua y texturas en cámara lenta.
                </p>
              </div>
            </div>

            <a
              href="#prompts-video"
              className="px-6 py-3 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 transition-all shadow-md shrink-0 whitespace-nowrap"
            >
              Ver Prompts de Video 🎥
            </a>
          </div>
        </div>
      </section>

      {/* ── 6. REELS Y VIDEOS DINÁMICOS POR RUBRO ── */}
      <section className="py-24 border-b" style={{ borderColor: "var(--line)" }}>
        <div className="wrap">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center" data-reveal>
            <div>
              <span className="eyebrow text-orange-500 font-bold text-xs uppercase tracking-wider">
                Formato vertical de alto alcance
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold mt-2 leading-tight" style={{ color: "var(--ink)" }}>
                Reels, TikToks y Shorts que atrapan clientes en los primeros 3 segundos.
              </h2>
              <p className="mt-4 text-base leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                El video vertical es el formato con mayor crecimiento y alcance para cualquier negocio local. Nuestros agentes
                redactan guiones con fórmulas probadas de retención, animan el contenido y dejan cada video listo para publicar.
              </p>

              {/* Selector de nicho para ver el gancho */}
              <div className="flex flex-wrap gap-2 mt-6">
                {(
                  [
                    { key: "gastronomia", label: "🍔 Gastronomía" },
                    { key: "retail", label: "👗 Ropa & Tiendas" },
                    { key: "belleza", label: "💈 Estética & Barbería" },
                    { key: "fitness", label: "⚡ Fitness & Salud" },
                  ] as const
                ).map((n) => (
                  <button
                    key={n.key}
                    onClick={() => setActiveReelNiche(n.key)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all"
                    style={{
                      background: activeReelNiche === n.key ? "var(--signal)" : "var(--panel)",
                      color: activeReelNiche === n.key ? "#FFFFFF" : "var(--ink)",
                      borderColor: activeReelNiche === n.key ? "var(--signal)" : "var(--line)",
                    }}
                  >
                    {n.label}
                  </button>
                ))}
              </div>

              <div className="space-y-4 mt-8">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-500 flex items-center justify-center font-bold text-sm shrink-0">
                    1
                  </div>
                  <div>
                    <h4 className="text-base font-bold" style={{ color: "var(--ink)" }}>
                      El Gancho (Primeros 3 seg)
                    </h4>
                    <p className="text-xs sm:text-sm" style={{ color: "var(--ink-dim)" }}>
                      Una frase contundente que frena el scroll y despierta la curiosidad, el deseo o la necesidad inmediata.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-500 flex items-center justify-center font-bold text-sm shrink-0">
                    2
                  </div>
                  <div>
                    <h4 className="text-base font-bold" style={{ color: "var(--ink)" }}>
                      Desarrollo Dinámico
                    </h4>
                    <p className="text-xs sm:text-sm" style={{ color: "var(--ink-dim)" }}>
                      Muestra tu producto, prenda o servicio en acción, con subtítulos llamativos y ritmo visual moderno.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-500 flex items-center justify-center font-bold text-sm shrink-0">
                    3
                  </div>
                  <div>
                    <h4 className="text-base font-bold" style={{ color: "var(--ink)" }}>
                      Llamado a la Acción Directo
                    </h4>
                    <p className="text-xs sm:text-sm" style={{ color: "var(--ink-dim)" }}>
                      Indica con claridad cómo pedir por WhatsApp, visitar tu local o agendar hora hoy mismo.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mockup Reel Interactivo según nicho */}
            <div className="relative mx-auto max-w-[320px] aspect-[9/16] rounded-3xl bg-slate-900 border-4 border-slate-700 shadow-2xl overflow-hidden flex flex-col justify-between p-6">
              <div
                className="absolute inset-0 bg-cover bg-center transition-all duration-300"
                style={{
                  backgroundImage: `url('${reelHooks[activeReelNiche].bg}')`,
                  filter: "brightness(0.82)",
                }}
              />
              <div className="relative z-10 flex items-center justify-between text-white text-xs font-bold">
                <span className="bg-red-600 px-2.5 py-1 rounded-full uppercase text-[10px]">
                  {reelHooks[activeReelNiche].tag}
                </span>
                <span>0:24</span>
              </div>

              <div className="relative z-10 bg-black/60 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-2 text-white">
                <span className="text-[11px] font-bold text-amber-300 block">🔥 GANCHO PROBADO:</span>
                <p className="text-xs font-semibold leading-snug">
                  {reelHooks[activeReelNiche].hook}
                </p>
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
                  <span>Guión de nuestros agentes</span>
                  <span className="text-orange-400 font-bold">Listo para IG &amp; TikTok</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6.B BIBLIOTECA DE PROMPTS Y COMANDOS DE VIDEO ── */}
      <section id="prompts-video" className="py-24 border-b" style={{ borderColor: "var(--line)" }}>
        <div className="wrap">
          <div className="text-center max-w-3xl mx-auto mb-16" data-reveal>
            <span className="eyebrow text-orange-500 font-bold text-xs uppercase tracking-wider">
              Catálogo Exclusivo de Video 9:16
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2 leading-tight" style={{ color: "var(--ink)" }}>
              Nuestra Biblioteca de Prompts de Video: Dale Vida a Tus Productos.
            </h2>
            <p className="mt-4 text-base leading-relaxed" style={{ color: "var(--ink-dim)" }}>
              Para destacar en Instagram Reels, TikTok y YouTube Shorts no basta con fotos fijas. Nuestros agentes cuentan con
              un catálogo de más de 20 comandos cinematográficos para transformar fotos de tu local o catálogo en clips
              publicitarios con giro 3D, humo volumétrico, salpicaduras y luces de estudio.
            </p>
          </div>

          {/* Grilla interactiva de comandos: Acordeón en móvil y dos columnas en desktop */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start" data-reveal>
            {/* Lista de comandos (lado izquierdo en desktop, acordeón completo en móvil) */}
            <div className="lg:col-span-5 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block px-1">
                Toca un comando para ver cómo actúa en video:
              </span>
              {VIDEO_PROMPT_HIGHLIGHTS.map((item) => {
                const isSelected = item.command === selectedVideoCommand;
                return (
                  <div key={item.command} className="space-y-3">
                    <button
                      onClick={() => {
                        if (isSelected) {
                          // En móvil permite alternar o mantener seleccionado
                          setSelectedVideoCommand(item.command);
                        } else {
                          setSelectedVideoCommand(item.command);
                          setVideoPreviewMode("video");
                        }
                      }}
                      className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 group ${
                        isSelected
                          ? "ring-2 ring-orange-500/80 shadow-lg shadow-orange-500/10"
                          : "hover:border-orange-500/40"
                      }`}
                      style={{
                        background: isSelected ? "var(--panel-2)" : "var(--panel)",
                        borderColor: isSelected ? "var(--signal)" : "var(--line)",
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`text-2xl shrink-0 p-2.5 rounded-xl transition-all ${
                            isSelected
                              ? "bg-gradient-to-tr from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/30 scale-105"
                              : "bg-orange-500/10 text-orange-500"
                          }`}
                        >
                          {item.icon}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <code
                              className={`text-xs font-bold px-2 py-0.5 rounded-md truncate transition-colors ${
                                isSelected
                                  ? "bg-orange-500 text-white font-mono"
                                  : "bg-slate-500/10 text-orange-600 dark:text-orange-400 font-mono"
                              }`}
                            >
                              {item.command}
                            </code>
                            <span
                              className={`text-[10px] font-semibold hidden sm:inline ${
                                isSelected ? "text-orange-400 font-bold" : "text-slate-400"
                              }`}
                            >
                              {item.tag}
                            </span>
                          </div>
                          <h4
                            className={`text-sm font-bold mt-1 truncate transition-colors ${
                              isSelected ? "text-orange-500 dark:text-orange-400 font-extrabold" : ""
                            }`}
                            style={{ color: isSelected ? undefined : "var(--ink)" }}
                          >
                            {item.name}
                          </h4>
                        </div>
                      </div>
                      <span
                        className={`text-sm font-bold transition-transform duration-200 ${
                          isSelected ? "text-orange-500 rotate-90 lg:rotate-0 lg:translate-x-1" : "text-slate-400"
                        }`}
                      >
                        ➔
                      </span>
                    </button>

                    {/* Acordeón desplegable en móvil (se muestra justo debajo del comando seleccionado) */}
                    {isSelected && (
                      <div
                        className="lg:hidden p-5 rounded-3xl border shadow-xl space-y-5 animate-in fade-in slide-in-from-top-2 duration-200"
                        style={{
                          background: "var(--panel)",
                          borderColor: "var(--signal)",
                        }}
                      >
                        <div>
                          <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: "var(--line)" }}>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-orange-500">
                              {item.category} · Formato Vertical 9:16
                            </span>
                            <button
                              onClick={() => handleCopyVideoCommand(item.command)}
                              className="px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all flex items-center gap-1"
                              style={{
                                background: "var(--panel-2)",
                                borderColor: copiedCommandNotice === item.command ? "var(--signal)" : "var(--line)",
                                color: copiedCommandNotice === item.command ? "var(--signal)" : "var(--ink)",
                              }}
                            >
                              <span>{copiedCommandNotice === item.command ? "✓" : "📋"}</span>
                              <span>{copiedCommandNotice === item.command ? "Copiado" : "Copiar"}</span>
                            </button>
                          </div>
                          <p className="text-xs leading-relaxed mt-3" style={{ color: "var(--ink-dim)" }}>
                            {item.description}
                          </p>
                        </div>

                        {/* Reproductor de video en móvil */}
                        <div className="relative aspect-[9/16] rounded-2xl overflow-hidden border border-slate-700/40 shadow-2xl bg-black flex flex-col justify-between p-3 max-w-[240px] mx-auto w-full">
                          {videoPreviewMode === "video" && item.videoUrl ? (
                            <video
                              key={item.videoUrl}
                              src={item.videoUrl}
                              poster={item.baseImageUrl || item.bgUrl}
                              autoPlay
                              loop
                              muted
                              playsInline
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          ) : (
                            <img
                              key={item.baseImageUrl || item.bgUrl}
                              src={item.baseImageUrl || item.bgUrl}
                              alt={item.name}
                              className="absolute inset-0 w-full h-full object-cover"
                            />
                          )}

                          <div className="relative z-10 flex items-center justify-between text-white text-[9px] font-bold">
                            <div className="flex items-center gap-1 bg-black/80 backdrop-blur-md p-1 rounded-full border border-white/15">
                              <button
                                type="button"
                                onClick={() => setVideoPreviewMode("video")}
                                className={`px-2 py-0.5 rounded-full uppercase tracking-wider transition-all flex items-center gap-1 text-[9px] font-bold ${
                                  videoPreviewMode === "video"
                                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white"
                                    : "text-slate-300"
                                }`}
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
                                <span>Video 9:16</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setVideoPreviewMode("image")}
                                className={`px-2 py-0.5 rounded-full uppercase tracking-wider transition-all text-[9px] font-bold ${
                                  videoPreviewMode === "image" ? "bg-slate-700 text-white" : "text-slate-300"
                                }`}
                              >
                                <span>Foto</span>
                              </button>
                            </div>
                            <span className="bg-black/80 backdrop-blur-md px-1.5 py-0.5 rounded-full border border-white/15 text-[9px] text-slate-200">
                              HD · 24fps
                            </span>
                          </div>

                          <div className="relative z-10 bg-black/85 backdrop-blur-md p-2.5 rounded-xl border border-white/15 space-y-0.5 text-white">
                            <div className="flex items-center justify-between text-[9px]">
                              <span className="text-orange-400 font-bold">
                                {videoPreviewMode === "video" ? "▶ VIDEO GENERADO" : "📸 FOTO BASE"}
                              </span>
                              <span className="text-slate-400 font-mono">Veo 9:16</span>
                            </div>
                            <code className="text-[11px] font-mono text-white block font-bold truncate">
                              {item.command}
                            </code>
                          </div>
                        </div>

                        {/* Fichas técnicas en móvil */}
                        <div className="space-y-2 text-xs">
                          <div className="p-2.5 rounded-xl bg-slate-500/5 border border-slate-500/10">
                            <span className="font-bold text-orange-500 block text-[10px] uppercase">
                              🎥 Movimiento de Cámara:
                            </span>
                            <span style={{ color: "var(--ink)" }}>{item.cameraMovement}</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-500/5 border border-slate-500/10">
                            <span className="font-bold text-amber-500 block text-[10px] uppercase">
                              ✨ Física &amp; Iluminación:
                            </span>
                            <span style={{ color: "var(--ink)" }}>{item.physicsEffect}</span>
                          </div>
                          <div className="p-2.5 rounded-xl bg-slate-500/5 border border-slate-500/10">
                            <span className="font-bold text-emerald-500 block text-[10px] uppercase">
                              🎯 Recomendado para:
                            </span>
                            <span style={{ color: "var(--ink)" }}>{item.recommendedFor}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Botón directo a la biblioteca pública */}
              <div className="pt-2">
                <Link
                  href="/biblioteca"
                  className="w-full py-3.5 px-4 rounded-xl border border-dashed border-orange-500/40 bg-orange-500/5 hover:bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all text-center"
                >
                  <span>🎥</span>
                  <span>Ver los 20 Comandos en la Biblioteca Pública</span>
                  <span>➔</span>
                </Link>
              </div>
            </div>

            {/* Ficha técnica del comando seleccionado (solo visible en pantallas grandes desktop) */}
            <div className="hidden lg:block lg:col-span-7">
              <div
                className="p-6 sm:p-8 rounded-3xl border shadow-xl relative overflow-hidden"
                style={{
                  background: "var(--panel)",
                  borderColor: "var(--line)",
                }}
              >
                {/* Header ficha */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b" style={{ borderColor: "var(--line)" }}>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl p-3 rounded-2xl bg-orange-500/10 text-orange-500">
                      {activeVideoHighlight.icon}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-orange-500">
                          {activeVideoHighlight.category}
                        </span>
                        <span className="text-xs text-slate-400">·</span>
                        <span className="text-[11px] font-medium text-slate-400">
                          Formato Vertical 9:16
                        </span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-bold mt-0.5" style={{ color: "var(--ink)" }}>
                        {activeVideoHighlight.name}
                      </h3>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCopyVideoCommand(activeVideoHighlight.command)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 shadow-sm"
                    style={{
                      background: "var(--panel)",
                      borderColor: copiedCommandNotice === activeVideoHighlight.command ? "var(--signal)" : "var(--line)",
                      color: copiedCommandNotice === activeVideoHighlight.command ? "var(--signal)" : "var(--ink)",
                    }}
                    title="Copiar comando"
                  >
                    <span>{copiedCommandNotice === activeVideoHighlight.command ? "✓" : "📋"}</span>
                    <span>
                      {copiedCommandNotice === activeVideoHighlight.command ? "¡Comando copiado!" : "Copiar comando"}
                    </span>
                  </button>
                </div>

                {/* Explicación y foto de referencia */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6 items-center">
                  <div className="space-y-4">
                    <p className="text-sm leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                      {activeVideoHighlight.description}
                    </p>

                    <div className="space-y-3 pt-2">
                      <div className="p-3.5 rounded-xl bg-slate-500/5 border border-slate-500/10 space-y-1">
                        <span className="text-[11px] font-bold text-orange-500 flex items-center gap-1 uppercase tracking-wider">
                          <span>🎥</span> Movimiento de Cámara:
                        </span>
                        <p className="text-xs font-medium" style={{ color: "var(--ink)" }}>
                          {activeVideoHighlight.cameraMovement}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-500/5 border border-slate-500/10 space-y-1">
                        <span className="text-[11px] font-bold text-amber-500 flex items-center gap-1 uppercase tracking-wider">
                          <span>✨</span> Física &amp; Iluminación:
                        </span>
                        <p className="text-xs font-medium" style={{ color: "var(--ink)" }}>
                          {activeVideoHighlight.physicsEffect}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-slate-500/5 border border-slate-500/10 space-y-1">
                        <span className="text-[11px] font-bold text-emerald-500 flex items-center gap-1 uppercase tracking-wider">
                          <span>🎯</span> Ideal para:
                        </span>
                        <p className="text-xs font-medium" style={{ color: "var(--ink)" }}>
                          {activeVideoHighlight.recommendedFor}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Mockup visual de la toma con Video Real en Loop */}
                  <div className="relative aspect-[9/16] rounded-2xl overflow-hidden border border-slate-700/40 shadow-2xl bg-black flex flex-col justify-between p-4 max-w-[260px] mx-auto w-full">
                    {/* Render de Video Real o Imagen Base según modo */}
                    {videoPreviewMode === "video" && activeVideoHighlight.videoUrl ? (
                      <video
                        key={activeVideoHighlight.videoUrl}
                        src={activeVideoHighlight.videoUrl}
                        poster={activeVideoHighlight.baseImageUrl || activeVideoHighlight.bgUrl}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        key={activeVideoHighlight.baseImageUrl || activeVideoHighlight.bgUrl}
                        src={activeVideoHighlight.baseImageUrl || activeVideoHighlight.bgUrl}
                        alt={activeVideoHighlight.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}

                    {/* Selector de modo Video vs Foto */}
                    <div className="relative z-10 flex items-center justify-between text-white text-[10px] font-bold">
                      <div className="flex items-center gap-1 bg-black/75 backdrop-blur-md p-1 rounded-full border border-white/15 shadow-sm">
                        <button
                          type="button"
                          onClick={() => setVideoPreviewMode("video")}
                          className={`px-2.5 py-1 rounded-full uppercase tracking-wider transition-all flex items-center gap-1 text-[10px] font-bold ${
                            videoPreviewMode === "video"
                              ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm"
                              : "text-slate-300 hover:text-white"
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse"></span>
                          <span>Video 9:16</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setVideoPreviewMode("image")}
                          className={`px-2.5 py-1 rounded-full uppercase tracking-wider transition-all flex items-center gap-1 text-[10px] font-bold ${
                            videoPreviewMode === "image"
                              ? "bg-slate-700 text-white shadow-sm"
                              : "text-slate-300 hover:text-white"
                          }`}
                        >
                          <span>📸</span>
                          <span>Foto Base</span>
                        </button>
                      </div>

                      <span className="bg-black/75 backdrop-blur-md px-2 py-1 rounded-full border border-white/15 text-[10px] text-slate-200">
                        HD · 24fps
                      </span>
                    </div>

                    {/* Ficha inferior en el mockup */}
                    <div className="relative z-10 bg-black/80 backdrop-blur-md p-3 rounded-xl border border-white/15 space-y-1 text-white shadow-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-orange-400 flex items-center gap-1">
                          <span>{videoPreviewMode === "video" ? "▶ VIDEO GENERADO" : "📸 FOTO ORIGINAL"}</span>
                        </span>
                        <span className="text-[9px] text-slate-300 font-mono">
                          {videoPreviewMode === "video" ? "Veo 9:16" : "Base"}
                        </span>
                      </div>
                      <code className="text-xs font-mono text-white block font-bold truncate">
                        {activeVideoHighlight.command}
                      </code>
                      <p className="text-[10px] text-slate-300 line-clamp-2">
                        {activeVideoHighlight.cameraMovement}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Pasos de transformación Antes / Agentes / Video */}
                <div className="mt-8 pt-6 border-t" style={{ borderColor: "var(--line)" }}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-xl bg-slate-500/5 border border-slate-500/10">
                      <span className="text-base font-bold block mb-1">📸 1. Tu Foto</span>
                      <span className="text-[11px]" style={{ color: "var(--ink-dim)" }}>
                        Una foto simple tomada con tu celular o de tu catálogo actual.
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                      <span className="text-base font-bold text-orange-600 dark:text-orange-400 block mb-1">
                        ⚡ 2. Nuestros Agentes
                      </span>
                      <span className="text-[11px]" style={{ color: "var(--ink-dim)" }}>
                        Aplican el comando maestro de video con física y luces de estudio.
                      </span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-500/5 border border-slate-500/10">
                      <span className="text-base font-bold block mb-1">🎬 3. Video 9:16</span>
                      <span className="text-[11px]" style={{ color: "var(--ink-dim)" }}>
                        Clip publicitario dinámico listo para publicar en Reels y TikTok.
                      </span>
                    </div>
                  </div>

                  {/* Acciones finales */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t" style={{ borderColor: "var(--line)" }}>
                    <div className="text-xs text-left max-w-md" style={{ color: "var(--ink-dim)" }}>
                      <span>💡 </span>
                      <span>
                        Los videos cinematográficos se generan bajo demanda y están incluidos en nuestros planes con módulo de video.
                      </span>
                    </div>
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <a
                        href="/#planes"
                        className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl border font-bold text-xs transition-all hover:bg-slate-500/5 text-center"
                        style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                      >
                        Ver Planes con Video ➔
                      </a>
                      <Link
                        href="/biblioteca"
                        className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs shadow-md transition-all text-center whitespace-nowrap flex items-center justify-center gap-1.5"
                      >
                        <span>🎥</span>
                        <span>Explorar Biblioteca Pública Completa</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. COMANDO POR WHATSAPP ── */}
      <section className="py-24 border-b" style={{ borderColor: "var(--line)" }}>
        <div className="wrap">
          <div className="text-center max-w-3xl mx-auto mb-16" data-reveal>
            <span className="eyebrow text-emerald-500 font-bold text-xs uppercase tracking-wider">
              Control total desde tu bolsillo
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2" style={{ color: "var(--ink)" }}>
              Sin computadoras ni paneles difíciles: manejas todo desde WhatsApp.
            </h2>
            <p className="mt-4 text-base" style={{ color: "var(--ink-dim)" }}>
              No tienes que aprender a usar ningún programa complicado. Todo te llega a la app que ya tienes en el
              bolsillo todos los días.
            </p>

            {/* Pestañas de Escenarios */}
            <div
              className="inline-flex p-1.5 rounded-xl border mt-8 gap-2 shadow-sm"
              style={{ background: "var(--panel)", borderColor: "var(--line)" }}
            >
              <button
                onClick={() => setActiveScenario("aprobar")}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  activeScenario === "aprobar"
                    ? "bg-emerald-600 text-white shadow-md"
                    : "hover:text-emerald-500"
                }`}
                style={{ color: activeScenario === "aprobar" ? "#FFFFFF" : "var(--ink-dim)" }}
              >
                1. Aprobar Posts Semanales
              </button>
              <button
                onClick={() => setActiveScenario("urgente")}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  activeScenario === "urgente"
                    ? "bg-emerald-600 text-white shadow-md"
                    : "hover:text-emerald-500"
                }`}
                style={{ color: activeScenario === "urgente" ? "#FFFFFF" : "var(--ink-dim)" }}
              >
                2. Crear Promo Urgente al Vuelo
              </button>
              <button
                onClick={() => setActiveScenario("metricas")}
                className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  activeScenario === "metricas"
                    ? "bg-emerald-600 text-white shadow-md"
                    : "hover:text-emerald-500"
                }`}
                style={{ color: activeScenario === "metricas" ? "#FFFFFF" : "var(--ink-dim)" }}
              >
                3. Resumen y Rendimiento
              </button>
            </div>
          </div>

          {/* Simulación de Chat de WhatsApp */}
          <div className="max-w-xl mx-auto bg-slate-950 rounded-3xl border border-slate-800 p-6 shadow-2xl" data-reveal>
            {/* Header del chat */}
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800 mb-6">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-lg">
                💬
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Santisoft Agentes de Contenido</h4>
                <p className="text-[11px] text-emerald-400">● En línea para tu negocio</p>
              </div>
            </div>

            {/* Conversación según escenario */}
            <div className="space-y-4 text-xs sm:text-sm">
              {activeScenario === "aprobar" && (
                <>
                  <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl rounded-tl-none max-w-[85%] text-slate-200">
                    <p className="font-semibold text-white mb-1">📅 Tus próximos posts listos:</p>
                    <p className="text-slate-300">
                      • <strong>Miércoles 13:00</strong> — Oferta Nueva Temporada (-30% OFF)
                      <br />• <strong>Viernes 19:30</strong> — Reel &quot;3 ideas para combinar este finde&quot;
                    </p>
                    <p className="text-emerald-400 mt-2 font-bold">
                      Responde &quot;Aprobar&quot; para dejarlos programados de inmediato.
                    </p>
                  </div>
                  <div className="bg-emerald-700 text-white p-3 rounded-2xl rounded-tr-none ml-auto max-w-[70%] font-semibold text-right">
                    Aprobar todo 👍
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl rounded-tl-none max-w-[85%] text-slate-200">
                    <p className="text-emerald-400 font-bold">✓ ¡Listo! Publicaciones aprobadas y programadas.</p>
                    <p className="text-slate-300 mt-1">Saldrán solas en Instagram, Facebook y TikTok.</p>
                  </div>
                </>
              )}

              {activeScenario === "urgente" && (
                <>
                  <div className="bg-emerald-700 text-white p-3 rounded-2xl rounded-tr-none ml-auto max-w-[80%] text-right">
                    Tengo sobrestock / horas libres para esta tarde. Saca una promo express de 25% descuento para las primeras 5 personas que escriban.
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl rounded-tl-none max-w-[85%] text-slate-200">
                    <p className="font-semibold text-white mb-1">✨ ¡Borrador generado por nuestros agentes!</p>
                    <p className="text-slate-300 italic">
                      &quot;⚡ ¡Flash Sale de Hoy! Llévate 25% de descuento directo en tu compra o reserva agendando por
                      WhatsApp antes de las 19:00 hrs. Solo 5 cupos disponibles.&quot;
                    </p>
                    <p className="text-orange-400 mt-2 font-bold">¿Lo publicamos ahora en historias y feed?</p>
                  </div>
                  <div className="bg-emerald-700 text-white p-3 rounded-2xl rounded-tr-none ml-auto max-w-[70%] font-semibold text-right">
                    Publicar ya 🚀
                  </div>
                </>
              )}

              {activeScenario === "metricas" && (
                <>
                  <div className="bg-emerald-700 text-white p-3 rounded-2xl rounded-tr-none ml-auto max-w-[70%] text-right">
                    ¿Cómo nos fue esta semana?
                  </div>
                  <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl rounded-tl-none max-w-[85%] text-slate-200">
                    <p className="font-semibold text-white mb-1">📊 Resumen de los últimos 7 días:</p>
                    <p className="text-slate-300">
                      • <strong>+4.250 personas</strong> en tu comuna vieron tus publicaciones.
                      <br />• <strong>42 personas</strong> tocaron el botón directo a tu WhatsApp.
                      <br />• El post más exitoso fue el Reel promocional de la semana.
                    </p>
                    <p className="text-emerald-400 mt-2 font-bold">Nuestros agentes ya preparan la próxima semana.</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── 8. MULTICANAL 360° ── */}
      <section className="py-24 border-b" style={{ borderColor: "var(--line)" }}>
        <div className="wrap">
          <div className="text-center max-w-3xl mx-auto mb-16" data-reveal>
            <span className="eyebrow text-orange-500 font-bold text-xs uppercase tracking-wider">
              Distribución sincronizada
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2" style={{ color: "var(--ink)" }}>
              Tu marca activa donde tus clientes están buscando hoy.
            </h2>
            <p className="mt-4 text-base" style={{ color: "var(--ink-dim)" }}>
              Con un solo clic, tu contenido se adapta y se publica en todas las plataformas principales sin esfuerzo.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-center" data-reveal>
            {[
              { icon: "📸", name: "Instagram", desc: "Feed, Stories y Reels" },
              { icon: "👥", name: "Facebook", desc: "Página y grupos" },
              { icon: "🎵", name: "TikTok", desc: "Videos en tendencia" },
              { icon: "📍", name: "Google Maps", desc: "Ficha de negocio local" },
              { icon: "▶️", name: "YouTube", desc: "Shorts verticales" },
              { icon: "✍️", name: "Blog & SEO", desc: "Artículos para Google" },
            ].map((chan) => (
              <div
                key={chan.name}
                className="p-5 rounded-2xl border shadow-sm"
                style={{ background: "var(--panel)", borderColor: "var(--line)" }}
              >
                <span className="text-3xl block mb-2">{chan.icon}</span>
                <h4 className="font-bold text-sm" style={{ color: "var(--ink)" }}>
                  {chan.name}
                </h4>
                <p className="text-xs mt-1" style={{ color: "var(--ink-dim)" }}>
                  {chan.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. TABLA COMPARATIVA DIRECTA ── */}
      <section className="py-24 border-b" style={{ borderColor: "var(--line)" }}>
        <div className="wrap">
          <div className="text-center max-w-3xl mx-auto mb-16" data-reveal>
            <span className="eyebrow text-orange-500 font-bold text-xs uppercase tracking-wider">
              Comparativa directa
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2" style={{ color: "var(--ink)" }}>
              ¿Por qué somos la opción más inteligente para tu negocio?
            </h2>
            <p className="mt-4 text-base" style={{ color: "var(--ink-dim)" }}>
              Mira la diferencia real entre contratar una agencia clásica, agotarte haciéndolo tú mismo o activar a
              nuestros agentes.
            </p>
          </div>

          <div
            className="overflow-x-auto rounded-2xl border p-4 shadow-sm"
            style={{ background: "var(--panel)", borderColor: "var(--line)" }}
            data-reveal
          >
            <table className="w-full text-left border-collapse min-w-[640px] text-sm">
              <thead>
                <tr className="border-b uppercase text-xs" style={{ borderColor: "var(--line)", color: "var(--ink-dim)" }}>
                  <th className="py-4 px-6 font-bold">Criterio</th>
                  <th className="py-4 px-6 font-bold text-red-500">Agencia Tradicional</th>
                  <th className="py-4 px-6 font-bold text-amber-500">Hacerlo Tú Mismo</th>
                  <th className="py-4 px-6 font-bold text-emerald-500 bg-orange-500/10 rounded-t-xl">
                    Con Nuestros Agentes ⭐
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--line)", color: "var(--ink-dim)" }}>
                <tr>
                  <td className="py-4 px-6 font-bold" style={{ color: "var(--ink)" }}>
                    Costo mensual
                  </td>
                  <td className="py-4 px-6 text-red-500">$450.000 a $800.000 CLP</td>
                  <td className="py-4 px-6 text-amber-500">Tu tiempo libre (invaluable)</td>
                  <td className="py-4 px-6 font-bold text-emerald-500 bg-orange-500/10">
                    Desde $59.990 CLP / mes
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold" style={{ color: "var(--ink)" }}>
                    Tiempo de entrega
                  </td>
                  <td className="py-4 px-6">5 a 10 días hábiles</td>
                  <td className="py-4 px-6">Cuando tengas 2 horas libres</td>
                  <td className="py-4 px-6 font-bold text-emerald-500 bg-orange-500/10">Minutos (24/7)</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold" style={{ color: "var(--ink)" }}>
                    Tus fotos reales
                  </td>
                  <td className="py-4 px-6">Piden sesiones caras de fotos</td>
                  <td className="py-4 px-6">Fotos sueltas sin diseño ni precio</td>
                  <td className="py-4 px-6 font-bold text-emerald-500 bg-orange-500/10">
                    Vestidas con cartelería profesional directa
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold" style={{ color: "var(--ink)" }}>
                    Aprobación y control
                  </td>
                  <td className="py-4 px-6">Mails interminables y reuniones</td>
                  <td className="py-4 px-6">Sin planificación fija</td>
                  <td className="py-4 px-6 font-bold text-emerald-500 bg-orange-500/10">
                    En 1 toque desde WhatsApp
                  </td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-bold" style={{ color: "var(--ink)" }}>
                    Publicación
                  </td>
                  <td className="py-4 px-6">Solo Instagram y Facebook</td>
                  <td className="py-4 px-6">Una sola red por falta de tiempo</td>
                  <td className="py-4 px-6 font-bold text-emerald-500 bg-orange-500/10">
                    Instagram, TikTok, Google, FB y Blog
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── SECCIÓN FAQ ROMPE-OBJECIONES ── */}
      <section className="py-24 border-b" style={{ borderColor: "var(--line)" }}>
        <div className="wrap max-w-4xl">
          <div className="text-center mb-16" data-reveal>
            <span className="eyebrow text-orange-500 font-bold text-xs uppercase tracking-wider">
              Claridad Total
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold mt-2" style={{ color: "var(--ink)" }}>
              Preguntas Frecuentes de Dueños de PyMEs
            </h2>
            <p className="mt-3 text-base" style={{ color: "var(--ink-dim)" }}>
              Todo lo que necesitas saber antes de poner tus redes en piloto automático.
            </p>
          </div>

          <div className="space-y-4" data-reveal>
            {/* FAQ 1 */}
            <div
              className="p-6 sm:p-7 rounded-2xl border transition-all"
              style={{ background: "var(--panel)", borderColor: "var(--line)" }}
            >
              <h3 className="text-lg font-bold flex items-start gap-3" style={{ color: "var(--ink)" }}>
                <span className="text-orange-500 text-xl font-bold mt-0.5">Q.</span>
                <span>¿Suena como robot o se va a notar falso?</span>
              </h3>
              <p className="mt-3 text-sm sm:text-base leading-relaxed pl-8" style={{ color: "var(--ink-dim)" }}>
                Para nada. El mayor error de las herramientas genéricas es usar frases clichés como &quot;en el vertiginoso mundo de hoy&quot; o sonar robóticos. Nuestros agentes aplican clonación de voz y protocolos avanzados de humanización calibrados para el mercado chileno: extraen tu vocabulario real, escriben con tono cercano &quot;tú a tú&quot; y transmiten la personalidad genuina de tu negocio.
              </p>
            </div>

            {/* FAQ 2 */}
            <div
              className="p-6 sm:p-7 rounded-2xl border transition-all"
              style={{ background: "var(--panel)", borderColor: "var(--line)" }}
            >
              <h3 className="text-lg font-bold flex items-start gap-3" style={{ color: "var(--ink)" }}>
                <span className="text-orange-500 text-xl font-bold mt-0.5">Q.</span>
                <span>¿Qué pasa si no soy tecnológico o no tengo tiempo?</span>
              </h3>
              <p className="mt-3 text-sm sm:text-base leading-relaxed pl-8" style={{ color: "var(--ink-dim)" }}>
                No necesitas saber nada de diseño ni programas complicados. En nuestro Plan Crecimiento te incluimos una videollamada de 25 minutos de Setup &quot;Llave en Mano&quot; GRATIS: nos conectamos contigo, configuramos tu marca, extraemos tu tono desde tu web o Instagram y dejamos tu primera quincena completamente lista para que solo tengas que dar el visto bueno desde WhatsApp.
              </p>
            </div>

            {/* FAQ 3 */}
            <div
              className="p-6 sm:p-7 rounded-2xl border transition-all"
              style={{ background: "var(--panel)", borderColor: "var(--line)" }}
            >
              <h3 className="text-lg font-bold flex items-start gap-3" style={{ color: "var(--ink)" }}>
                <span className="text-orange-500 text-xl font-bold mt-0.5">Q.</span>
                <span>¿Sirve para mi rubro específico (clínicas, servicios, industria, comercio, corretaje)?</span>
              </h3>
              <p className="mt-3 text-sm sm:text-base leading-relaxed pl-8" style={{ color: "var(--ink-dim)" }}>
                Sí, 100%. Nuestros agentes no usan plantillas genéricas. Se adaptan a los dolores de compra, dudas frecuentes y objeciones de venta reales de cada rubro: desde restaurantes y moda, hasta clínicas dentales, servicios técnicos, consultorías, gimnasios o corretaje de propiedades.
              </p>
            </div>

            {/* FAQ 4 */}
            <div
              className="p-6 sm:p-7 rounded-2xl border transition-all"
              style={{ background: "var(--panel)", borderColor: "var(--line)" }}
            >
              <h3 className="text-lg font-bold flex items-start gap-3" style={{ color: "var(--ink)" }}>
                <span className="text-orange-500 text-xl font-bold mt-0.5">Q.</span>
                <span>¿Hay contratos de permanencia o amarres obligatorios?</span>
              </h3>
              <p className="mt-3 text-sm sm:text-base leading-relaxed pl-8" style={{ color: "var(--ink-dim)" }}>
                Cero amarres. En Santisoft creemos en relaciones comerciales basadas en resultados. Tu suscripción es 100% mes a mes y puedes pausar o cancelar cuando quieras con un solo clic, sin multas ni contratos forzados.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 10. DOBLE LLAMADO A LA ACCIÓN (FORMULARIO EXPRESS + WHATSAPP) ── */}
      <section id="muestra-gratis" className="py-24">
        <div className="wrap">
          <div
            className="max-w-4xl mx-auto rounded-3xl border p-8 sm:p-14 shadow-2xl"
            style={{ background: "var(--panel)", borderColor: "var(--line)" }}
            data-reveal
          >
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="eyebrow text-orange-500 font-bold text-xs uppercase tracking-wider">
                Pruébalo sin costo
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold mt-2" style={{ color: "var(--ink)" }}>
                Mira cómo se vería tu negocio hoy mismo, sin pagar nada.
              </h2>
              <p className="mt-3 text-base" style={{ color: "var(--ink-dim)" }}>
                Déjanos el nombre de tu negocio y te preparamos una <strong>muestra gratuita y personalizada</strong> con
                publicaciones y estrategia real en menos de lo que imaginas.
              </p>
            </div>

            {/* ── QUÉ INCLUYE TU MUESTRA GRATUITA (BLOQUE VISUAL) ── */}
            <div
              className="mb-10 p-6 sm:p-7 rounded-2xl border"
              style={{ background: "var(--panel-2)", borderColor: "var(--line)" }}
            >
              <div className="text-center sm:text-left mb-5">
                <span className="text-xs font-mono font-bold text-orange-500 uppercase tracking-widest block">
                  TRANSPARENCIA TOTAL
                </span>
                <h3 className="text-base sm:text-lg font-bold mt-1" style={{ color: "var(--ink)" }}>
                  ¿Qué recibirás exactamente en tu muestra personalizada?
                </h3>
                <p className="text-xs mt-1" style={{ color: "var(--ink-dim)" }}>
                  Sin trucos ni cobros ocultos: te preparamos material comercial real listo para publicar en tus redes.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Poster comercial con marca y precio */}
                <div
                  className="p-5 rounded-xl border flex flex-col justify-between shadow-xs"
                  style={{ background: "var(--panel)", borderColor: "var(--line)" }}
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center text-xl mb-3">
                      🏷️
                    </div>
                    <h4 className="text-sm font-bold mb-1.5" style={{ color: "var(--ink)" }}>
                      Poster con tu Marca y Precio
                    </h4>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                      Cartelería comercial con tu producto o servicio real: tipografía publicitaria directa, badge de oferta,
                      precios claros y llamado a la acción hacia WhatsApp.
                    </p>
                    <p className="text-[10px] mt-2 font-medium" style={{ color: "var(--ink-faint)" }}>
                      🔒 Con marca de agua de muestra (se entrega limpia al activar plan).
                    </p>
                  </div>
                  <div
                    className="mt-4 pt-3 border-t text-[11px] font-semibold text-emerald-500 flex items-center gap-1"
                    style={{ borderColor: "var(--line)" }}
                  >
                    <span>✓</span> Listo para vender hoy
                  </div>
                </div>

                {/* 2. Poster de autor con estilo visual */}
                <div
                  className="p-5 rounded-xl border flex flex-col justify-between shadow-xs"
                  style={{ background: "var(--panel)", borderColor: "var(--line)" }}
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center text-xl mb-3">
                      🎨
                    </div>
                    <h4 className="text-sm font-bold mb-1.5" style={{ color: "var(--ink)" }}>
                      Poster con Estilo Visual de Nicho
                    </h4>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                      Imagen creada por nuestros agentes con el estilo fotográfico ideal para tu rubro (alta estética y
                      atmósfera de marca, sin precios ni logos forzados).
                    </p>
                    <p className="text-[10px] mt-2 font-medium" style={{ color: "var(--ink-faint)" }}>
                      🔒 Con marca de agua de muestra (se entrega limpia al activar plan).
                    </p>
                  </div>
                  <div
                    className="mt-4 pt-3 border-t text-[11px] font-semibold text-emerald-500 flex items-center gap-1"
                    style={{ borderColor: "var(--line)" }}
                  >
                    <span>✓</span> Estética de gran marca
                  </div>
                </div>

                {/* 3. Calendario y estrategia de prueba */}
                <div
                  className="p-5 rounded-xl border flex flex-col justify-between shadow-xs"
                  style={{ background: "var(--panel)", borderColor: "var(--line)" }}
                >
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center text-xl mb-3">
                      📅
                    </div>
                    <h4 className="text-sm font-bold mb-1.5" style={{ color: "var(--ink)" }}>
                      Calendario de Prueba por 7 Días
                    </h4>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--ink-dim)" }}>
                      Planificación de tus próximas publicaciones con días, horarios sugeridos para tu zona y copys
                      persuasivos listos para copiar y pegar.
                    </p>
                  </div>
                  <div
                    className="mt-4 pt-3 border-t text-[11px] font-semibold text-emerald-500 flex items-center gap-1"
                    style={{ borderColor: "var(--line)" }}
                  >
                    <span>✓</span> Sin costo ni compromiso
                  </div>
                </div>
              </div>
            </div>

            {formStatus === "success" ? (
              <div className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center max-w-lg mx-auto">
                <span className="text-4xl block mb-2">🎉</span>
                <h3 className="text-xl font-bold mb-2" style={{ color: "var(--ink)" }}>
                  ¡Solicitud recibida con éxito!
                </h3>
                <p className="text-sm mb-6" style={{ color: "var(--ink-dim)" }}>
                  Nuestros agentes ya están preparando la muestra comercial para <strong>{businessName}</strong>. Te
                  escribiremos al WhatsApp <strong>{contactPhone}</strong> con tu propuesta lista.
                </p>
                <a
                  href={`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(
                    `¡Hola! Acabo de pedir una muestra para ${businessName} (${businessRubro}). Quiero coordinar por aquí.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all shadow-md"
                >
                  <span>💬</span> Abrir WhatsApp de Inmediato
                </a>
              </div>
            ) : (
              <form onSubmit={handleSampleSubmit} className="max-w-xl mx-auto space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: "var(--ink)" }}>
                    Nombre de tu Negocio / Local *
                  </label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Ej. Boutique Roma / Barbería Don Luis / Gimnasio Titán"
                    className="w-full px-4 py-3.5 rounded-xl border text-sm focus:outline-none focus:border-orange-500"
                    style={{
                      background: "var(--panel-2)",
                      borderColor: "var(--line-strong)",
                      color: "var(--ink)",
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: "var(--ink)" }}>
                      Rubro Comercial *
                    </label>
                    <select
                      value={businessRubro}
                      onChange={(e) => setBusinessRubro(e.target.value)}
                      className="w-full px-4 py-3.5 rounded-xl border text-sm focus:outline-none focus:border-orange-500"
                      style={{
                        background: "var(--panel-2)",
                        borderColor: "var(--line-strong)",
                        color: "var(--ink)",
                      }}
                    >
                      <option>Tienda de Ropa, Calzado o Moda</option>
                      <option>Minimarket, Botillería o Tienda de Barrio</option>
                      <option>Peluquería, Barbería o Centro de Estética</option>
                      <option>Gimnasio, Box de CrossFit o Entrenador</option>
                      <option>Clínica Dental, Salud o Masajes</option>
                      <option>Hamburguesería / Fast Food</option>
                      <option>Restaurante, Pizzería o Sushi</option>
                      <option>Cafetería, Pastelería o Brunch</option>
                      <option>Taller Mecánico, Repuestos o Automotriz</option>
                      <option>Ferretería, Hogar o Construcción</option>
                      <option>Servicios Profesionales o Asesorías</option>
                      <option>Otro Negocio Comercial / Local</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: "var(--ink)" }}>
                      Teléfono WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+56 9 1234 5678"
                      className="w-full px-4 py-3.5 rounded-xl border text-sm focus:outline-none focus:border-orange-500"
                      style={{
                        background: "var(--panel-2)",
                        borderColor: "var(--line-strong)",
                        color: "var(--ink)",
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: "var(--ink)" }}>
                    Correo Electrónico (Opcional)
                  </label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="tucorreo@negocio.com"
                    className="w-full px-4 py-3.5 rounded-xl border text-sm focus:outline-none focus:border-orange-500"
                    style={{
                      background: "var(--panel-2)",
                      borderColor: "var(--line-strong)",
                      color: "var(--ink)",
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase mb-1.5" style={{ color: "var(--ink)" }}>
                    ¿Cómo prefieres las imágenes de tu muestra gratuita?
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { id: "mixto" as const, label: "Con y Sin Texto", icon: "🔄", desc: "Muestra combinada recomendada" },
                      { id: "con_texto" as const, label: "Con Texto Comercial", icon: "🏷️", desc: "Carteles con precios y ofertas" },
                      { id: "sin_texto" as const, label: "Sin Texto Comercial", icon: "🖼️", desc: "Fotos limpias de producto" },
                    ].map((fmt) => {
                      const isSelected = sampleTextPreference === fmt.id;
                      return (
                        <button
                          key={fmt.id}
                          type="button"
                          onClick={() => setSampleTextPreference(fmt.id)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? "border-orange-500 bg-orange-500/10 shadow-xs ring-1 ring-orange-500/30"
                              : "border-slate-200 hover:border-slate-300"
                          }`}
                          style={{
                            background: isSelected ? "var(--panel-2)" : "var(--panel)",
                            borderColor: isSelected ? "var(--signal)" : "var(--line)",
                          }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-base">{fmt.icon}</span>
                            <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isSelected ? "bg-orange-500 text-white" : "border text-transparent"
                            }`}>
                              ✓
                            </span>
                          </div>
                          <div className="text-xs font-bold" style={{ color: "var(--ink)" }}>{fmt.label}</div>
                          <div className="text-[10px] mt-0.5 leading-snug" style={{ color: "var(--ink-dim)" }}>{fmt.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {formStatus === "error" && (
                  <p className="text-red-500 text-xs">
                    Hubo un problema enviando tus datos. Puedes escribirnos directo al WhatsApp de abajo.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={formStatus === "loading"}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-base shadow-xl shadow-orange-500/25 transition-all text-center flex items-center justify-center gap-2 mt-2"
                >
                  {formStatus === "loading" ? "Procesando..." : "✨ Generar Muestra Gratuita de Mi Negocio"}
                </button>

                {/* Separador O */}
                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px" style={{ background: "var(--line)" }} />
                  <span className="text-xs uppercase font-bold" style={{ color: "var(--ink-faint)" }}>
                    O también puedes
                  </span>
                  <div className="flex-1 h-px" style={{ background: "var(--line)" }} />
                </div>

                {/* Botón directo de WhatsApp Comercial */}
                <a
                  href={`https://wa.me/${WA_NUMBER}?text=${WA_MSG}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition-all text-center flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  <span>💬</span> Hablar Directamente con un Asesor por WhatsApp
                </a>
              </form>
            )}

            <div className="mt-8 text-center text-xs" style={{ color: "var(--ink-dim)" }}>
              🔒 Tus datos son confidenciales y solo los usaremos para enviarte tu propuesta de muestra. Sin spam.
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER INSTITUCIONAL ── */}
      <BrandFooter />
    </div>
  );
}
