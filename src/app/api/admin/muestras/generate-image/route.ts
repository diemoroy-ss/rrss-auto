import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "../../../../../lib/firebase-admin";
import { generateFreeText } from "../../../../../lib/gemini-free";
import { HARDCODED_STYLES } from "../../../../../lib/prompt-templates";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ADMIN_EMAILS = ["diemoroy@gmail.com", "spalezcom@gmail.com", "santisoftai@gmail.com", "admin@santisoft.cl"];

async function verifyAdmin(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: "No token", status: 401 };
  }
  const token = authHeader.split("Bearer ")[1];
  if (!adminAuth) {
    return { error: "Firebase Admin no configurado", status: 500 };
  }
  const decoded = await adminAuth.verifyIdToken(token);
  const email = (decoded.email || "").toLowerCase();
  if (ADMIN_EMAILS.includes(email)) {
    return { uid: decoded.uid, email };
  }
  const userDoc = await adminDb!.collection("users").doc(decoded.uid).get();
  if (userDoc.data()?.role === "admin") {
    return { uid: decoded.uid, email };
  }
  return { error: "Unauthorized", status: 403 };
}

export async function POST(req: Request) {
  try {
    const authResult = await verifyAdmin(req);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const body = await req.json();
    const {
      dishOrProductName = "",
      rubro = "Gastronomía",
      businessName = "",
      offerText = "",
      styleId = null,
      styleTitle = null,
      styleKeywords = null,
      stylePrompt = null,
    } = body;

    const targetProduct = dishOrProductName.trim();
    const targetRubro = rubro.trim() || "Gastronomía";
    const targetBusiness = businessName.trim();

    // 1. Resolver estilo visual si se proporcionó un ID
    let effectiveKeywords = styleKeywords || "";
    let effectiveStyleTitle = styleTitle || "";
    if (styleId) {
      const foundTemplate = HARDCODED_STYLES.find((t) => t.id === styleId);
      if (foundTemplate) {
        effectiveKeywords = effectiveKeywords || foundTemplate.styleKeywords || "";
        effectiveStyleTitle = effectiveStyleTitle || foundTemplate.title || "";
      }
    }

    // 2. Construir el prompt fotográfico profesional en inglés con nuestros agentes (Claude-Banana technique)
    const systemInstruction = `You are an elite commercial photography art director and AI prompt engineer for high-end advertising.
Your mission is to generate a SINGLE, highly detailed, photorealistic prompt in ENGLISH (80 to 140 words) for a professional commercial photograph.

CRITICAL RULES:
1. SUBJECT HERO: The absolute visual hero must be the specified dish or product: "${targetProduct || targetRubro}".
   - If a specific dish (e.g. "Lomo Saltado", "Pizza Napolitana", "Sushi Roll") is specified, describe the authentic culinary preparation, textures, appetizing sizzle, glistening sauces, fresh garnishes, and mouth-watering presentation.
   - Never replace the product with unrelated items (no bags, no shoes, no random accessories unless requested).
2. SETTING & LIGHTING:
   - Industry/Niche: ${targetRubro}.
   - Place in a sophisticated, realistic commercial setting (e.g. high-end restaurant table with soft bokeh background, warm cinematic lighting, shallow depth of field).
3. STYLE & FINISH:
   ${effectiveKeywords ? `Incorporate visual cues from style "${effectiveStyleTitle}": ${effectiveKeywords}.` : 'Shot on 85mm f/1.4 lens, natural dramatic lighting, rich appetizing colors, crisp details, commercial food magazine quality.'}
4. NO TEXT: Do NOT generate or include any text, letters, slogans, or watermarks. Pure photography only.
5. FORMAT: Output ONLY the plain text English prompt in continuous narrative prose. No quotes, no markdown, no bullet points.`;

    const userPrompt = `Generate the commercial advertising photo prompt for:
- Product / Dish: ${targetProduct || "Featured Specialty"}
- Business Name: ${targetBusiness || "Local Brand"}
- Industry: ${targetRubro}
${offerText ? `- Campaign Focus: ${offerText}` : ""}`;

    let englishPrompt = "";
    try {
      englishPrompt = await generateFreeText(userPrompt, systemInstruction);
      englishPrompt = englishPrompt.trim().replace(/^["']|["']$/g, "");
    } catch (genErr: any) {
      console.warn("[Admin Muestras Gen Image] Error generando prompt con Gemini, usando prompt estructurado directo:", genErr);
      const dishDesc = targetProduct || `specialty of ${targetRubro}`;
      englishPrompt = `A stunning Michelin star restaurant commercial photography of authentic ${dishDesc}, gourmet presentation on a ceramic plate, perfectly cooked ingredients with mouth-watering glossy texture, fresh garnish, warm ambient restaurant lighting in background with soft bokeh, shot on 85mm lens f/1.4, 8k resolution, professional food advertising photography, no text.`;
    }

    console.log(`[Admin Muestras Gen Image] Prompt generado para "${targetProduct || targetRubro}":`, englishPrompt);

    // 3. Generar la imagen llamando a n8n (img-rrss-auto)
    let imageUrl = "";
    const n8nWebhookUrl = "https://n8n.santisoft.cl/webhook/img-rrss-auto";

    try {
      console.log(`[Admin Muestras Gen Image] Solicitando imagen a n8n (${n8nWebhookUrl})...`);
      const n8nRes = await fetch(n8nWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: englishPrompt,
          promptEnglish: englishPrompt,
          businessType: targetRubro,
          rubro: targetRubro,
          dishOrProduct: targetProduct,
          type: "rrss",
        }),
        signal: AbortSignal.timeout(35000),
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
          (typeof rawData === "string" && rawData.startsWith("http") ? rawData : null);

        if (candidateUrl && typeof candidateUrl === "string" && candidateUrl.startsWith("http")) {
          console.log(`[Admin Muestras Gen Image] ✅ Imagen generada por n8n:`, candidateUrl);
          imageUrl = candidateUrl;
        } else {
          console.warn("[Admin Muestras Gen Image] ⚠️ n8n respondió 200 pero sin URL válida:", rawData);
        }
      } else {
        console.warn(`[Admin Muestras Gen Image] ⚠️ n8n respondió con status ${n8nRes.status}`);
      }
    } catch (n8nErr: any) {
      console.warn(`[Admin Muestras Gen Image] ⚠️ Error o timeout con webhook n8n:`, n8nErr.message || n8nErr);
    }

    // 4. Fallback si n8n no responde: Pollinations Flux
    if (!imageUrl) {
      console.log("[Admin Muestras Gen Image] 🔄 Usando fallback a Pollinations (Flux) con el prompt narrativo...");
      const seed = Math.floor(Math.random() * 1000000);
      imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(englishPrompt)}?width=1080&height=1080&model=flux&nologo=true&enhance=true&seed=${seed}`;
    }

    return NextResponse.json({
      ok: true,
      imageUrl,
      prompt: englishPrompt,
      dishOrProductName: targetProduct,
      rubro: targetRubro,
    });
  } catch (err: any) {
    console.error("[Admin Muestras Gen Image Exception]:", err);
    return NextResponse.json({ error: err.message || "Error al generar imagen de muestra" }, { status: 500 });
  }
}
