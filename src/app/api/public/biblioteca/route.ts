import { NextResponse } from "next/server";
import { adminDb } from "../../../../lib/firebase-admin";
import { HARDCODED_STYLES, PromptTemplate } from "../../../../lib/prompt-templates";
import { FLOW_COMMANDS, FlowCommandDef } from "../../../../lib/flow-command-translator";
import { DEFAULT_TEXT_TEMPLATES, TextTemplate } from "../../../../lib/text-templates";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let firestoreStyles: Record<string, Partial<PromptTemplate>> = {};
    let realDemos: any[] = [];
    let customTextTemplates: TextTemplate[] = [];

    if (adminDb) {
      // 1. Estilos de Prompt Library de Firestore
      try {
        const snap = await adminDb.collection("prompt_library").get();
        snap.forEach((doc) => {
          const d = doc.data();
          if (!d.isDeleted && d.title?.trim()) {
            firestoreStyles[doc.id] = {
              id: doc.id,
              title: d.title,
              description: d.description,
              category: d.category,
              categories: d.categories || (d.category ? [d.category] : []),
              prompt: d.prompt,
              previewUrl: d.previewImageUrl || d.previewUrl || "",
              imageRequirement: d.imageRequirement || "optional",
              isCommercialPoster: Boolean(d.isCommercialPoster),
              imageGenBehavior: d.imageGenBehavior,
              styleKeywords: d.styleKeywords,
            };
          }
        });
      } catch (err) {
        console.warn("[API Public Biblioteca] Error leyendo prompt_library:", err);
      }

      // 2. Muestras de prospectos con imágenes generadas y texto comercial
      try {
        const demoSnap = await adminDb
          .collection("admin_prospect_demos")
          .orderBy("createdAt", "desc")
          .limit(20)
          .get();

        demoSnap.forEach((doc) => {
          const d = doc.data();
          if (d.imageUrl && !d.isDeleted) {
            realDemos.push({
              id: doc.id,
              businessName: d.businessName || d.prospectBusiness || "Negocio Destacado",
              productName: d.dishOrProductName || d.productName || "Plato / Producto Estrella",
              rubro: d.rubro || "Gastronomía & Comercio",
              offerText: d.offerText || "",
              imageUrl: d.imageUrl,
              styleTitle: d.styleTitle || "Afiche Publicitario con Texto",
              copyText: d.copyText || d.description || "",
              videoUrl: d.videoUrl || null,
            });
          }
        });
      } catch (err) {
        console.warn("[API Public Biblioteca] Error leyendo admin_prospect_demos:", err);
      }

      // 3. Plantillas de texto personalizadas en Firestore
      try {
        const textSnap = await adminDb.collection("text_templates").get();
        textSnap.forEach((doc) => {
          const d = doc.data() as TextTemplate;
          if (d.name) {
            customTextTemplates.push({ ...d, id: doc.id });
          }
        });
      } catch (err) {
        console.warn("[API Public Biblioteca] Error leyendo text_templates:", err);
      }
    }

    // Combinar los estilos hardcodeados con los de Firestore (prioridad Firestore para imágenes y datos actualizados)
    const combinedStyles: PromptTemplate[] = HARDCODED_STYLES.map((hardcoded) => {
      const fromDb = firestoreStyles[hardcoded.id];
      if (fromDb) {
        return {
          ...hardcoded,
          ...fromDb,
          // Usar la imagen de Firestore si existe y no está vacía
          previewUrl: fromDb.previewUrl || hardcoded.previewUrl,
        };
      }
      return hardcoded;
    });

    // Agregar estilos que existan en Firestore pero no en HARDCODED_STYLES
    Object.keys(firestoreStyles).forEach((id) => {
      if (!HARDCODED_STYLES.some((h) => h.id === id)) {
        combinedStyles.push(firestoreStyles[id] as PromptTemplate);
      }
    });

    // Combinar plantillas de texto
    const combinedTextTemplates: TextTemplate[] = [...DEFAULT_TEXT_TEMPLATES];
    customTextTemplates.forEach((custom) => {
      if (!combinedTextTemplates.some((t) => t.id === custom.id)) {
        combinedTextTemplates.push(custom);
      }
    });

    return NextResponse.json({
      success: true,
      totalStyles: combinedStyles.length,
      styles: combinedStyles,
      textTemplates: combinedTextTemplates,
      demosWithText: realDemos,
      videoCommands: FLOW_COMMANDS,
    });
  } catch (error: any) {
    console.error("[API Public Biblioteca] Fatal:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Error al cargar la biblioteca",
        styles: HARDCODED_STYLES,
        textTemplates: DEFAULT_TEXT_TEMPLATES,
        demosWithText: [],
        videoCommands: FLOW_COMMANDS,
      },
      { status: 500 }
    );
  }
}
