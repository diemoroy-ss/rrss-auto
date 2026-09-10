import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "../../../../lib/firebase-admin";
import { generateImageWithAgent } from "../../../../lib/agents/agent-image";

export const maxDuration = 90; // Permite hasta 90 segundos para generación y renderizado

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return NextResponse.json({ error: "No autorizado. Inicia sesión para continuar." }, { status: 401 });
    }

    const decoded = await adminAuth!.verifyIdToken(token);
    const uid = decoded.uid;

    const body = await req.json();
    const { postId, baseImageUrl: overrideBaseImage, visualStyle: overrideStyle, promptTemplateId: overrideTemplateId } = body;

    if (!postId) {
      return NextResponse.json({ error: "postId es requerido." }, { status: 400 });
    }

    const postRef = adminDb.collection("social_posts").doc(postId);
    const postSnap = await postRef.get();

    if (!postSnap.exists) {
      return NextResponse.json({ error: "Publicación no encontrada." }, { status: 404 });
    }

    const post = postSnap.data() as any;

    if (post.userId !== uid && decoded.email !== "santisoftai@gmail.com") {
      return NextResponse.json({ error: "No tienes permiso para modificar este post." }, { status: 403 });
    }

    // 1. Obtener perfil del usuario y contexto de marca
    const userDoc = await adminDb.collection("users").doc(post.userId).get();
    const userData = userDoc.data() || {};
    const profiles = userData.profiles || [];
    const targetProfile = profiles.find((p: any) => p.id === (post.profileId || "default")) || profiles[0] || {};

    const effectiveStyleId = overrideTemplateId || post.promptTemplateId;
    const effectiveStyleName = overrideStyle || post.visualStyle;

    // 2. Jerarquía de 3 niveles para la Imagen Base
    let resolvedBaseImage: string | undefined = undefined;
    let imageSource: "uploaded_base" | "catalog_product" | "business_description" = "business_description";
    let sourceDescription = "Generada a partir de la descripción del negocio";

    // NIVEL 1: Imagen base subida para este post
    const candidateUploaded = overrideBaseImage || post.baseImageUrl;
    if (candidateUploaded && typeof candidateUploaded === "string" && candidateUploaded.startsWith("http")) {
      resolvedBaseImage = candidateUploaded;
      imageSource = "uploaded_base";
      sourceDescription = "Generada usando la imagen base que subiste";
    }

    // NIVEL 2: Imagen de producto o servicio en el catálogo
    if (!resolvedBaseImage) {
      try {
        const catSnap = await adminDb
          .collection("users")
          .doc(post.userId)
          .collection("catalogo")
          .where("profileId", "==", post.profileId || "default")
          .where("active", "==", true)
          .get();

        if (!catSnap.empty) {
          const items = catSnap.docs
            .map((d) => ({ id: d.id, ...d.data() } as any))
            .filter((item) => item.imageUrl && typeof item.imageUrl === "string" && item.imageUrl.startsWith("http"));

          if (items.length > 0) {
            // Intentar coincidencia inteligente de keywords con el post
            const postTextLower = `${post.idea || ""} ${post.text || ""} ${post.copy || ""}`.toLowerCase();
            const matchedItem = items.find((it) => {
              const nameLower = (it.name || "").toLowerCase();
              return nameLower.length > 2 && postTextLower.includes(nameLower);
            });

            const selectedItem = matchedItem || items[0];
            resolvedBaseImage = selectedItem.imageUrl;
            imageSource = "catalog_product";
            sourceDescription = `Generada usando la foto de "${selectedItem.name}" de tu catálogo`;
          }
        }
      } catch (catErr) {
        console.warn("[generate-styled-image] Error consultando catálogo para fallback:", catErr);
      }
    }

    // NIVEL 3: Si no hay imagen base ni catálogo, resolvedBaseImage queda undefined y se genera con la descripción del negocio.
    if (!resolvedBaseImage) {
      imageSource = "business_description";
      sourceDescription = `Generada a partir de la descripción de tu negocio (${targetProfile.rubro || "General"})`;
    }

    console.log(`[generate-styled-image] Post ${postId} - Nivel seleccionado: ${imageSource} (${sourceDescription})`);

    // 3. Generar la imagen con nuestros agentes
    const isStory = post.type === "Historia" || post.type === "Story";
    const imagePromptIdea = post.imageDirection 
      ? `${post.imageDirection}. Contexto del post: ${post.idea || post.text || "Fotografía promocional"}`
      : (post.idea || post.text || "Fotografía promocional profesional");

    const generatedImageUrl = await generateImageWithAgent({
      idea: imagePromptIdea,
      rubro: targetProfile.rubro || "General",
      businessName: targetProfile.name || targetProfile.businessName || "",
      businessDescription: targetProfile.businessDescription || "",
      promotions: targetProfile.promotions || "",
      customOffer: post.customOffer || "",
      bannerStyle: "clean", // Mantener la composición de imagen limpia y estilizada
      aspectRatio: isStory ? "9:16" : "1:1",
      logoPrompt: targetProfile.logoPrompt || "",
      logoUrl: targetProfile.logoUrl || "",
      userId: post.userId,
      includeLogo: post.includeLogo ?? targetProfile.alwaysIncludeLogo ?? true,
      promptTemplateId: effectiveStyleId || undefined,
      visualStyle: effectiveStyleName || undefined,
      baseImageUrl: resolvedBaseImage,
      brandVisualIdentity: targetProfile.visualIdentity || undefined,
    });

    if (!generatedImageUrl) {
      throw new Error("Nuestros agentes no pudieron generar la imagen en este momento.");
    }

    // 4. Actualizar post en Firestore
    await postRef.update({
      imageUrl: generatedImageUrl,
      imageUrls: [generatedImageUrl],
      baseImageUrl: resolvedBaseImage || post.baseImageUrl || null,
      visualStyle: effectiveStyleName || post.visualStyle || null,
      promptTemplateId: effectiveStyleId || post.promptTemplateId || null,
      imageSource,
      autoGeneratedImage: true,
      isGeneratingImage: false,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      imageUrl: generatedImageUrl,
      imageSource,
      sourceDescription,
      baseImageUrl: resolvedBaseImage || null,
    });
  } catch (err: any) {
    console.error("[GENERATE STYLED IMAGE ERROR]:", err);
    return NextResponse.json({ error: err.message || "Error al generar imagen con estilo." }, { status: 500 });
  }
}
