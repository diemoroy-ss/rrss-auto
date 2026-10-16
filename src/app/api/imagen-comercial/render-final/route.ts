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

    // Fallback si Butterfly no respondió o falló
    if (!finalImageUrl) {
      finalImageUrl = butterflyUrl;
    }

    // 3. Guardado en la Biblioteca (collection `generated_images`) para persistencia y re-edición posterior
    let libraryDocId = null;
    if (saveToLibrary && uid !== "anon") {
      try {
        const libDoc = await adminDb.collection("generated_images").add({
          url: finalImageUrl,
          baseImageUrl,
          userId: uid,
          source: "imagen_comercial",
          type: isCarousel ? "Carrusel" : "Post",
          aspectRatio,
          prompt: prompt || "Diseño de Cartel Comercial",
          copy: textLayers.map((l: any) => l.text).filter(Boolean).join(" · "),
          commercialDesignId: renderId,
          commercialDesignData: commercialDesignData || {
            baseImageUrl,
            textLayers,
            useLogo,
            logoUrl,
            logoX,
            logoY,
            logoWidth,
            logoTransparent,
            aspectRatio,
            customFonts,
            isCarousel,
            slideIndex,
          },
          createdAt: new Date(),
        });
        libraryDocId = libDoc.id;
        console.log(`[render-final] 📚 Guardado en Biblioteca de Medios (#${libraryDocId})`);
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
