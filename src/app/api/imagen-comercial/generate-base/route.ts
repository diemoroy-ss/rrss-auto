import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminStorage } from "../../../../lib/firebase-admin";

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
        console.warn("[generate-base] Token no verificado:", authErr);
      }
    }

    const body = await req.json();
    const {
      prompt,
      aspectRatio = "4:5",
      rubro = "Comercial & Servicios",
      productName = "",
      baseImageUrl: preloadedImage,
    } = body;

    if (preloadedImage && typeof preloadedImage === "string" && preloadedImage.startsWith("http")) {
      return NextResponse.json({ success: true, baseImageUrl: preloadedImage, source: "preloaded" });
    }

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "La descripción visual o prompt es obligatorio." },
        { status: 400 }
      );
    }

    let width = 1080;
    let height = 1350;
    if (aspectRatio === "1:1") {
      width = 1080;
      height = 1080;
    } else if (aspectRatio === "9:16") {
      width = 1080;
      height = 1920;
    }

    // Aseguramos que el prompt indique estilo comercial limpio sin letras rotas
    const cleanPrompt = `${prompt.trim()}, clean background with negative space for typography, studio lighting, commercial photography or 3d octane render, high dynamic range, no text, no letters, no watermark`;

    let generatedUrl = "";

    // 1. Intento Primario: Webhook n8n
    const n8nWebhookUrl = process.env.N8N_IMAGE_WEBHOOK_URL || "https://n8n.santisoft.cl/webhook/img-rrss-auto";
    try {
      const n8nRes = await fetch(n8nWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: cleanPrompt,
          promptEnglish: cleanPrompt,
          rawIdea: prompt,
          businessType: rubro,
          rubro,
          dishOrProduct: productName || "Producto Comercial",
          type: aspectRatio === "9:16" ? "story" : "rrss",
          aspectRatio,
          width,
          height,
        }),
        signal: AbortSignal.timeout(45000),
      });

      if (n8nRes.ok) {
        const rawData = await n8nRes.json().catch(() => ({}));
        const data = Array.isArray(rawData) ? rawData[0] : rawData;
        const candidateUrl =
          data?.img_url ||
          data?.imageUrl ||
          data?.url ||
          data?.output ||
          data?.image ||
          data?.outputUrl ||
          (typeof rawData === "string" && rawData.startsWith("http") ? rawData : null);

        if (candidateUrl && typeof candidateUrl === "string" && candidateUrl.startsWith("http")) {
          generatedUrl = candidateUrl;
        }
      }
    } catch (n8nErr: any) {
      console.warn("[generate-base] n8n no respondió o timeout, pasando a Flux:", n8nErr.message || n8nErr);
    }

    // 2. Fallback a Flux (Pollinations)
    if (!generatedUrl) {
      const seed = Math.floor(Math.random() * 1000000);
      const fluxUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
        cleanPrompt
      )}?width=${width}&height=${height}&model=flux&nologo=true&enhance=true&seed=${seed}`;

      const imgRes = await fetch(fluxUrl, { signal: AbortSignal.timeout(60000) });
      if (!imgRes.ok) {
        throw new Error(`Error generando imagen con Flux: ${imgRes.status}`);
      }

      const imgBuf = Buffer.from(await imgRes.arrayBuffer());

      if (adminStorage) {
        const bucket = adminStorage.bucket();
        const dest = `users/${uid}/commercial_base/${Date.now()}.jpg`;
        const file = bucket.file(dest);
        await file.save(imgBuf, {
          metadata: { contentType: "image/jpeg", cacheControl: "public, max-age=31536000" },
        });
        await file.makePublic();
        generatedUrl = `https://storage.googleapis.com/${bucket.name}/${dest}`;
      } else {
        generatedUrl = fluxUrl;
      }
    }

    return NextResponse.json({
      success: true,
      baseImageUrl: generatedUrl,
      aspectRatio,
      prompt,
    });
  } catch (error: any) {
    console.error("[generate-base] Error crítico:", error);
    return NextResponse.json(
      { error: error.message || "Error al generar la imagen base comercial." },
      { status: 500 }
    );
  }
}
