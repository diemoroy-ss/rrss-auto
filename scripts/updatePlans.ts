
import { adminDb } from "../src/lib/firebase-admin";

async function run() {
  const plans = {
    "free": {
      id: "free",
      name: "Free",
      tagline: "Prueba sin riesgo",
      price: 0,
      annualPrice: 0,
      postsLimit: 3,
      videosLimit: 3,
      aiImagesLimit: 3,
      aiVideosLimit: 3,
      seoBlogsLimit: 0,
      multiAccount: false,
      maxAccounts: 1,
      isPopular: false,
      ctaText: "Empezar Gratis",
      features: [
        "Todas las redes sociales",
        "Video básico (imágenes IA)",
        "Generación de textos IA",
        "1 perfil de marca"
      ]
    },
    "starter": {
      id: "starter",
      name: "Starter",
      tagline: "Pequeño negocio",
      price: 34990,
      annualPrice: 349900,
      postsLimit: 12,
      videosLimit: 12,
      aiImagesLimit: 12,
      aiVideosLimit: 12,
      seoBlogsLimit: 0,
      multiAccount: false,
      maxAccounts: 1,
      isPopular: false,
      ctaText: "Elegir Starter",
      features: [
        "Todas las redes sociales",
        "Video básico (imágenes IA)",
        "Calendario de programación",
        "Radar de Nicho",
        "Estrategia IA mensual",
        "1 perfil de marca"
      ]
    },
    "pro": {
      id: "pro",
      name: "Pro",
      tagline: "El más elegido",
      price: 69990,
      annualPrice: 699900,
      postsLimit: 20,
      videosLimit: 20,
      aiImagesLimit: 40,
      aiVideosLimit: 20,
      seoBlogsLimit: 4,
      multiAccount: false,
      maxAccounts: 1,
      isPopular: true,
      ctaText: "Elegir Pro",
      features: [
        "🎬 Video Premium · guión IA + voz",
        "Blog SEO/GEO (Google + ChatGPT)",
        "Meta Ads integrado",
        "Radar de Nicho",
        "1 perfil de marca"
      ]
    },
    "business": {
      id: "business",
      name: "Business",
      tagline: "Agencias & Empresas",
      price: 129990,
      annualPrice: 1299900,
      postsLimit: 9999,
      videosLimit: 9999,
      aiImagesLimit: 9999,
      aiVideosLimit: 9999,
      seoBlogsLimit: 9999,
      multiAccount: true,
      maxAccounts: 2,
      isPopular: false,
      ctaText: "Elegir Business",
      features: [
        "Conecta todas las redes por cuenta",
        "🎬 Video Premium por cuenta",
        "Blog SEO/GEO por cuenta",
        "Meta Ads por cuenta",
        "⭐ Multi-cuenta independiente",
        "Soporte dedicado prioritario"
      ]
    }
  };

  await adminDb.collection("system_config").doc("plans").set(plans);
  console.log("Plans updated successfully!");
}

run().catch(console.error);
