import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "../../../../../../lib/firebase-admin";
import { Plan14DayItem } from "../../../../../../types/demo-plan";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

const N8N_IMAGE_WEBHOOK_URL = "https://n8n.santisoft.cl/webhook/img-rrss-auto";

async function renderSingleDayImage(
  item: Plan14DayItem,
  businessName: string,
  rubro: string
): Promise<string> {
  const isCommercial = item.post.hasText;
  const headline = item.post.headline || item.post.productName;
  const price = item.post.price || "";
  const directive = item.post.compositionDirective || `Hero commercial photo of ${item.post.productName}`;

  let englishPrompt = "";
  if (isCommercial) {
    englishPrompt = `Square 1:1 Instagram commercial advertising poster for "${businessName}" in Chile (${rubro}). ${directive}. Large bold typography overlay reading "${headline.toUpperCase()}", clear price badge "${price}", CTA button "PIDE POR WHATSAPP". Professional food and restobar graphic design, warm commercial studio lighting, 8k resolution.`;
  } else {
    englishPrompt = `Square 1:1 Instagram commercial food photography for "${businessName}" (${rubro}). ${directive}. 85mm lens f/1.4, clean editorial photo, mouth-watering textures, appetizing presentation on rustic table, warm ambient lighting, no text, no watermark, professional gastronomy advertising photography.`;
  }

  // 1. Intento con webhook n8n
  try {
    const res = await fetch(N8N_IMAGE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: englishPrompt,
        promptEnglish: englishPrompt,
        businessType: rubro,
        rubro,
        dishOrProduct: item.post.productName,
        type: "rrss",
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (res.ok) {
      const rawData = await res.json().catch(() => ({}));
      const data = Array.isArray(rawData) ? rawData[0] : rawData;
      const candidateUrl =
        data?.img_url ||
        data?.imageUrl ||
        data?.url ||
        data?.output ||
        data?.image ||
        (typeof rawData === "string" && rawData.startsWith("http") ? rawData : null);

      if (candidateUrl && typeof candidateUrl === "string" && candidateUrl.startsWith("http")) {
        return candidateUrl;
      }
    }
  } catch (err: any) {
    console.warn(`[render-day] Warning con n8n para día ${item.day}:`, err?.message || err);
  }

  // 2. Fallback a Pollinations Flux
  const seed = Math.floor(Math.random() * 900000) + 100000;
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(englishPrompt)}?width=1080&height=1080&model=flux&nologo=true&enhance=true&seed=${seed}`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const demoId = resolvedParams?.id;

    if (!demoId) {
      return NextResponse.json({ error: "Falta ID de muestra." }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: "Base de datos no disponible." }, { status: 500 });
    }

    const body = await req.json();
    const dayNumber = Number(body?.dayNumber);

    if (!dayNumber || dayNumber < 1 || dayNumber > 14) {
      return NextResponse.json({ error: "Número de día inválido (debe ser del 1 al 14)." }, { status: 400 });
    }

    const docRef = adminDb.collection("admin_prospect_demos").doc(demoId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return NextResponse.json({ error: "Muestra no encontrada." }, { status: 404 });
    }

    const data = docSnap.data() || {};
    const plan14Days: Plan14DayItem[] = Array.isArray(data.plan14Days) ? data.plan14Days : [];

    const targetDayIndex = plan14Days.findIndex((d) => d.day === dayNumber);
    if (targetDayIndex === -1) {
      return NextResponse.json({ error: `El día ${dayNumber} no existe en la planificación.` }, { status: 404 });
    }

    const targetItem = plan14Days[targetDayIndex];

    // Si ya está renderizada, devolverla al instante
    if (targetItem.post.isRendered && targetItem.post.imageUrl) {
      return NextResponse.json({
        success: true,
        alreadyRendered: true,
        dayNumber,
        imageUrl: targetItem.post.imageUrl,
        plan14Days,
      });
    }

    // Renderizar imagen con nuestros agentes
    const businessName = data.prospectBusiness || "tu negocio";
    const rubro = data.rubro || "Gastronomía";

    const generatedImageUrl = await renderSingleDayImage(targetItem, businessName, rubro);

    // Actualizar el plan en memoria
    plan14Days[targetDayIndex] = {
      ...targetItem,
      post: {
        ...targetItem.post,
        imageUrl: generatedImageUrl,
        isRendered: true,
      },
    };

    const currentAnchorDays: number[] = Array.isArray(data.anchorRenderedDays) ? data.anchorRenderedDays : [];
    const updatedAnchorDays = Array.from(new Set([...currentAnchorDays, dayNumber]));

    // Guardar en Firestore
    await docRef.update({
      plan14Days,
      anchorRenderedDays: updatedAnchorDays,
      lastRenderedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      dayNumber,
      imageUrl: generatedImageUrl,
      plan14Days,
    });
  } catch (error: any) {
    console.error("[render-day API Exception]:", error);
    return NextResponse.json(
      { error: error?.message || "Error al renderizar el afiche del día seleccionado." },
      { status: 500 }
    );
  }
}
