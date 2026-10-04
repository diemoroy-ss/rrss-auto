import { adminDb } from "../src/lib/firebase-admin";
import { HARDCODED_STYLES } from "../src/lib/prompt-templates";

async function seedFoodPrompts() {
  if (!adminDb) {
    console.error("adminDb no está disponible.");
    process.exit(1);
  }

  const targetIds = [
    "style-food-combo-ad",
    "style-food-dish-launch",
    "style-food-hero-poster",
    "style-food-menu-visual",
    "style-food-ad-minimalist",
    "style-food-cafe-lifestyle",
    "style-food-delivery-ad",
    "style-food-special-offer",
    "style-food-brand-experience",
  ];

  const stylesToSeed = HARDCODED_STYLES.filter((s) => targetIds.includes(s.id));

  console.log(`Guardando ${stylesToSeed.length} comandos de agentes gastronómicos en Firestore (prompt_library)...`);

  for (const style of stylesToSeed) {
    const docRef = adminDb.collection("prompt_library").doc(style.id);
    await docRef.set(
      {
        id: style.id,
        title: style.title,
        description: style.description,
        category: style.category,
        categories: style.categories || [style.category],
        prompt: style.prompt,
        previewUrl: style.previewUrl,
        imageRequirement: style.imageRequirement,
        isCommercialPoster: style.isCommercialPoster ?? true,
        imageGenBehavior: style.imageGenBehavior ?? "product",
        styleKeywords: style.styleKeywords ?? "",
        isDeleted: false,
        updatedAt: new Date(),
      },
      { merge: true }
    );
    console.log(`✅ Guardado: ${style.id} - ${style.title}`);
  }

  console.log("¡Todos los comandos de agentes fueron guardados exitosamente en Firestore!");
}

seedFoodPrompts()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Error al guardar prompts:", err);
    process.exit(1);
  });
