import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb, adminStorage } from "../../../../lib/firebase-admin";

export const dynamic = "force-dynamic";
export const maxDuration = 90;

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "").trim();
    let uid = "anon";

    if (token && adminAuth) {
      try {
        const decoded = await adminAuth.verifyIdToken(token);
        uid = decoded.uid;
      } catch (authErr) {
        console.warn("[render-final] Token no verificado:", authErr);
      }
    }

    const body = await req.json();
    const {
      baseImageUrl,
      textLayers = [],
      useLogo = false,
      logoUrl = null,
      logoX = 86,
      logoY = 14,
      logoWidth = 100,
      logoTransparent = true,
      aspectRatio = "4:5",
      customFonts = [],
      saveToLibrary = true,
      prompt = "Cartel Comercial",
      commercialDesignData = null,
      isCarousel = false,
      carouselImages = [],
      slideIndex = 0,
    } = body;

    if (!baseImageUrl) {
      return NextResponse.json({ error: "baseImageUrl es obligatoria." }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: "Firestore no está disponible." }, { status: 500 });
    }

    // 1. Guardar en preview_renders con adminDb
    const renderDocRef = await adminDb.collection("preview_renders").add({
      baseImageUrl,
      userId: uid,
      layoutPosition: "commercial_custom",
      ingredients: null,
      useLogo: Boolean(useLogo && logoUrl),
      logoUrl: logoUrl || null,
      logoX: Number(logoX) || 86,
      logoY: Number(logoY) || 14,
      logoWidth: Number(logoWidth) || 100,
      logoBg: (body.logoBgMode === "white" || !logoTransparent) ? "white" : "transparent",
      logoBgMode: body.logoBgMode || (logoTransparent ? "transparent" : "white"),
      logoBlendMode: body.logoBlendMode || (logoTransparent ? "screen" : "normal"),
      logoTransparent: Boolean(logoTransparent),
      textLayers,
      customFonts,
      watermarkSantisoft: false,
      aspectRatio,
      useScrim: true,
      createdAt: new Date(),
    });

    const renderId = renderDocRef.id;

    // 2. Invocación de Butterfly Social
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://rrss.santisoft.cl";
    const previewUrl = `${baseUrl}/render/preview?id=${renderId}`;
    const butterflyUrl = `https://butterfly.santisoft.cl/link-previews/v1?url=${encodeURIComponent(previewUrl)}`;

    console.log(`[render-final] Solicitando captura a Butterfly Social (${renderId}):`, butterflyUrl);

    let finalImageUrl = "";
    try {
      const bfRes = await fetch(butterflyUrl, { signal: AbortSignal.timeout(25000) });
      if (bfRes.ok) {
        const bfBuf = Buffer.from(await bfRes.arrayBuffer());
        if (bfBuf.length > 5000 && adminStorage) {
          const bucket = adminStorage.bucket();
          const dest = `users/${uid}/commercial_final/${renderId}_${Date.now()}.jpg`;
          const file = bucket.file(dest);

          await file.save(bfBuf, {
            metadata: {
              contentType: "image/jpeg",
              cacheControl: "public, max-age=31536000",
            },
          });
          await file.makePublic();

          finalImageUrl = `https://storage.googleapis.com/${bucket.name}/${dest}`;
          console.log(`[render-final] ✅ Imagen final de Butterfly guardada en Storage: ${finalImageUrl}`);
        }
      }
    } catch (bfErr: any) {
      console.warn("[render-final] Butterfly Social timeout o error:", bfErr.message || bfErr);
    }

    // Fallback con clientDataUrl generado directamente por el lienzo del cliente si Butterfly no está disponible
    if (!finalImageUrl && body.clientDataUrl && adminStorage) {
      try {
        const matches = body.clientDataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mimeType = matches[1];
          const buffer = Buffer.from(matches[2], "base64");
          const bucket = adminStorage.bucket();
          const dest = `users/${uid}/commercial_final/${renderId}_${Date.now()}.jpg`;
          const file = bucket.file(dest);
          await file.save(buffer, {
            metadata: {
              contentType: mimeType,
              cacheControl: "public, max-age=31536000",
            },
          });
          await file.makePublic();
          finalImageUrl = `https://storage.googleapis.com/${bucket.name}/${dest}`;
          console.log(`[render-final] ✅ Imagen final desde render de cliente guardada en Storage: ${finalImageUrl}`);
        }
      } catch (clientSaveErr) {
        console.warn("[render-final] Error guardando clientDataUrl en Storage:", clientSaveErr);
      }
    }

    // Fallback final seguro
    if (!finalImageUrl) {
      finalImageUrl = baseImageUrl;
    }

    // 3. Guardado en la Biblioteca (collection `generated_images`) para persistencia y re-edición posterior
    let libraryDocId = body.libraryDocId || null;
    if (saveToLibrary && uid !== "anon") {
      try {
        const carouselImagesList: string[] = Array.isArray(body.carouselImages) && body.carouselImages.length > 0
          ? body.carouselImages
          : isCarousel && Array.isArray(commercialDesignData?.slides)
          ? commercialDesignData.slides.map((s: any) => s.finalRenderUrl || s.baseImageUrl).filter(Boolean)
          : [];

        // Si es carrusel y finalImageUrl se acaba de generar para este slide, incluirlo
        if (isCarousel && finalImageUrl) {
          const idx = Number(slideIndex) || 0;
          if (idx >= 0) {
            carouselImagesList[idx] = finalImageUrl;
          }
        }

        const coverImage = isCarousel
          ? (carouselImagesList[0] || finalImageUrl || baseImageUrl)
          : finalImageUrl;

        const allCopies = isCarousel && Array.isArray(commercialDesignData?.slides)
          ? commercialDesignData.slides
              .map((s: any) => (s.textLayers || []).map((l: any) => l.text).filter(Boolean).join(" · "))
              .filter(Boolean)
              .join("\n\n")
          : textLayers.map((l: any) => l.text).filter(Boolean).join(" · ");

        const docPayload: any = {
          url: coverImage,
          baseImageUrl: isCarousel ? (commercialDesignData?.slides?.[0]?.baseImageUrl || baseImageUrl) : baseImageUrl,
          userId: uid,
          source: "imagen_comercial",
          type: isCarousel ? "Carrusel" : aspectRatio === "9:16" ? "Historia" : "Post",
          aspectRatio,
          prompt: prompt || (isCarousel ? `Carrusel Comercial (${carouselImagesList.length || 2} diapositivas)` : "Diseño de Cartel Comercial"),
          copy: allCopies || textLayers.map((l: any) => l.text).filter(Boolean).join(" · "),
          commercialDesignId: renderId,
          carouselImages: carouselImagesList,
          commercialDesignData: commercialDesignData || {
            slides: [{ baseImageUrl, textLayers, useLogo, logoUrl, logoX, logoY, logoWidth, logoTransparent, aspectRatio }],
            customFonts,
            isCarousel,
            slideIndex,
          },
          updatedAt: new Date(),
        };

        // Si ya tenemos un ID de biblioteca provisto o si ya existe un documento para este diseño comercial
        if (libraryDocId) {
          await adminDb.collection("generated_images").doc(libraryDocId).set(docPayload, { merge: true });
        } else {
          // Si el diseño proviene de un commercialDesignId previo, actualizarlo
          const existingQuery = await adminDb.collection("generated_images")
            .where("userId", "==", uid)
            .where("commercialDesignId", "==", renderId)
            .limit(1)
            .get();

          if (!existingQuery.empty) {
            libraryDocId = existingQuery.docs[0].id;
            await adminDb.collection("generated_images").doc(libraryDocId).set(docPayload, { merge: true });
          } else {
            docPayload.createdAt = new Date();
            const newDoc = await adminDb.collection("generated_images").add(docPayload);
            libraryDocId = newDoc.id;
          }
        }
        console.log(`[render-final] 📚 Guardado/actualizado en Biblioteca de Medios (#${libraryDocId}) como lote de ${docPayload.type}`);
      } catch (libErr) {
        console.warn("[render-final] Error guardando en generated_images:", libErr);
      }
    }

    return NextResponse.json({
      success: true,
      renderId,
      finalImageUrl,
      butterflyUrl,
      libraryDocId,
    });
  } catch (error: any) {
    console.error("[render-final] Error crítico:", error);
    return NextResponse.json(
      { error: error.message || "Error al renderizar el cartel comercial." },
      { status: 500 }
    );
  }
}
