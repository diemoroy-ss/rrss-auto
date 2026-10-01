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

    // 2. Jerarquía Inteligente para Producto e Imagen Base
    let resolvedBaseImage: string | undefined = undefined;
    let resolvedProductName: string | undefined = post.productName || undefined;
    let resolvedProductDesc: string | undefined = post.productDescription || undefined;
    let resolvedProductPrice: string | undefined = post.productOfferPrice || post.productPrice || undefined;
    let resolvedKeepOriginalPhoto: boolean = Boolean(post.keepOriginalPhoto);
    let resolvedFontStyle: any = post.fontStyle || "script_handwritten";
    let imageSource: "uploaded_base" | "catalog_product" | "catalog_product_generated" | "business_description" = "business_description";
    let sourceDescription = "Generada a partir de la descripción del negocio";

    // NIVEL 1: Imagen base subida para este post o producto con foto real
    const candidateUploaded = overrideBaseImage || post.baseImageUrl;
    if (candidateUploaded && typeof candidateUploaded === "string" && candidateUploaded.startsWith("http")) {
      resolvedBaseImage = candidateUploaded;
      imageSource = resolvedProductName ? "catalog_product" : "uploaded_base";
      sourceDescription = resolvedProductName 
        ? `Foto real de "${resolvedProductName}" de tu catálogo`
        : "Imagen base subida";
    } else if (resolvedProductName) {
      // Producto del catálogo asignado pero SIN foto: nuestros agentes generan la foto desde cero
      imageSource = "catalog_product_generated";
      sourceDescription = `Fotografía comercial generada desde cero para "${resolvedProductName}" con estilo visual`;
    }

    // NIVEL 2: Si aún no se resolvió, buscar coincidencia en el catálogo del usuario
    if (!resolvedBaseImage && !resolvedProductName) {
      try {
        const catSnap = await adminDb
          .collection("users")
          .doc(post.userId)
          .collection("catalogo")
          .where("profileId", "==", post.profileId || "default")
          .where("active", "==", true)
          .get();

        if (!catSnap.empty) {
          const allItems = catSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
          const postTextLower = `${post.idea || ""} ${post.text || ""} ${post.copy || ""}`.toLowerCase();
          
          const matchedItem = allItems.find((it) => {
            const nameLower = (it.name || "").toLowerCase();
            return nameLower.length > 2 && postTextLower.includes(nameLower);
          });

          const selectedItem = matchedItem || allItems.find((it) => it.imageUrl && it.imageUrl.startsWith("http")) || allItems[0];
          if (selectedItem) {
            resolvedProductName = selectedItem.name;
            resolvedProductDesc = selectedItem.description;
            resolvedProductPrice = selectedItem.offerPrice || selectedItem.price || resolvedProductPrice;
            if (selectedItem.keepOriginalPhoto !== undefined) {
              resolvedKeepOriginalPhoto = Boolean(selectedItem.keepOriginalPhoto);
            }
            if (selectedItem.fontStyle) {
              resolvedFontStyle = selectedItem.fontStyle;
            }

            if (selectedItem.imageUrl && typeof selectedItem.imageUrl === "string" && selectedItem.imageUrl.startsWith("http")) {
              resolvedBaseImage = selectedItem.imageUrl;
              imageSource = "catalog_product";
              sourceDescription = `Foto de "${selectedItem.name}" de tu catálogo`;
            } else {
              imageSource = "catalog_product_generated";
              sourceDescription = `Fotografía comercial generada desde cero para "${selectedItem.name}" con estilo visual`;
            }
          }
        }
      } catch (catErr) {
        console.warn("[generate-styled-image] Error consultando catálogo para fallback:", catErr);
      }
    }

    // NIVEL 3: Si no hay producto de catálogo ni imagen base, se genera a partir de la descripción general del negocio
    if (!resolvedBaseImage && !resolvedProductName) {
      imageSource = "business_description";
      sourceDescription = `Generada a partir de la descripción de tu negocio (${targetProfile.rubro || "General"})`;
    }

    console.log(`[generate-styled-image] Post ${postId} - Nivel seleccionado: ${imageSource} (${sourceDescription}) - Foto Real Intocable: ${resolvedKeepOriginalPhoto}`);

    // 3. Generar la imagen con nuestros agentes o componer sobre la foto real intocable
    const isStory = post.type === "Historia" || post.type === "Story";
    let generatedImageUrl: string | null = null;

    if (resolvedKeepOriginalPhoto && resolvedBaseImage) {
      console.log(`[generate-styled-image] 📸 Modo Foto Real Intocable activo para "${resolvedProductName}". Componiendo tipografía publicitaria sobre la foto original...`);
      const { composeRealProductBanner } = await import("../../../../lib/real-product-compositor");
      generatedImageUrl = await composeRealProductBanner({
        baseImageUrl: resolvedBaseImage,
        productName: resolvedProductName || "Producto",
        productDescription: resolvedProductDesc,
        price: resolvedProductPrice,
        idea: post.idea || post.text,
        rubro: targetProfile.rubro || "Gastronomía",
        businessName: targetProfile.name || targetProfile.businessName || "Mi Negocio",
        fontStyle: resolvedFontStyle,
        aspectRatio: isStory ? "9:16" : "1:1",
        logoUrl: targetProfile.logoUrl || "",
        userId: post.userId,
        includeLogo: post.includeLogo ?? targetProfile.alwaysIncludeLogo ?? true,
      });
      sourceDescription = `Foto real de "${resolvedProductName}" con tipografía comercial (sin retoque de comida)`;
    } else {
      const productFocus = resolvedProductName 
        ? `Producto/servicio protagonista: "${resolvedProductName}"${resolvedProductDesc ? ` (${resolvedProductDesc})` : ''}. ` 
        : '';
      const imagePromptIdea = post.imageDirection 
        ? `${productFocus}${post.imageDirection}. Contexto del post: ${post.idea || post.text || "Fotografía promocional"}`
        : `${productFocus}${post.idea || post.text || "Fotografía promocional profesional"}`;

      generatedImageUrl = await generateImageWithAgent({
        idea: imagePromptIdea,
        rubro: targetProfile.rubro || "General",
        businessName: targetProfile.name || targetProfile.businessName || "",
        businessDescription: targetProfile.businessDescription || "",
        promotions: targetProfile.promotions || "",
        customOffer: post.customOffer || "",
        productName: resolvedProductName,
        productDescription: resolvedProductDesc,
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
    }

    if (!generatedImageUrl) {
      throw new Error("Nuestros agentes no pudieron generar la imagen en este momento.");
    }

    // 4. Actualizar post en Firestore
    await postRef.update({
      imageUrl: generatedImageUrl,
      imageUrls: [generatedImageUrl],
      baseImageUrl: resolvedBaseImage || post.baseImageUrl || null,
      productName: resolvedProductName || post.productName || null,
      productDescription: resolvedProductDesc || post.productDescription || null,
      hasProductImage: Boolean(resolvedBaseImage),
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
