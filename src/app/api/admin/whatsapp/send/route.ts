import { NextResponse } from "next/server";
import { adminAuth } from "../../../../../lib/firebase-admin";

export const dynamic = "force-dynamic";

const N8N_EVOAPI_WEBHOOK_URL = process.env.N8N_EVOAPI_WEBHOOK_URL || "https://n8n.santisoft.cl/webhook/evoapi";
const DEFAULT_EVOLUTION_URL = "https://evoapi.grupofugas.cl";
const DEFAULT_INSTANCE_NAME = "Santisoft";
const DEFAULT_API_KEY = "6833CC358FA4-42E4-8F45-E74D35CC85A7";

const ADMIN_EMAILS = ["diemoroy@gmail.com", "spalezcom@gmail.com", "santisoftai@gmail.com", "admin@santisoft.cl"];

export async function POST(req: Request) {
  try {
    // 1. Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token proporcionado" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    if (!adminAuth) {
      return NextResponse.json({ error: "Firebase Admin no disponible" }, { status: 500 });
    }
    const decoded = await adminAuth.verifyIdToken(token);
    const email = (decoded.email || "").toLowerCase();
    if (!ADMIN_EMAILS.includes(email)) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const { phone, text, mediaUrl, mediaType, apiKey: customApiKey, instanceName: customInstance } = body;

    if (!phone || !text) {
      return NextResponse.json({ error: "phone y text son requeridos" }, { status: 400 });
    }

    const n8nWebhookUrl = process.env.N8N_EVOAPI_WEBHOOK_URL || N8N_EVOAPI_WEBHOOK_URL;
    const evolutionUrl = (process.env.EVOLUTION_API_URL || DEFAULT_EVOLUTION_URL).replace(/\/$/, "");
    const instanceName = customInstance || process.env.EVOLUTION_INSTANCE_NAME || DEFAULT_INSTANCE_NAME;
    const apiKey = customApiKey || process.env.EVOLUTION_API_KEY || DEFAULT_API_KEY;

    // Limpiar teléfono (solo números)
    const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, "").replace(/^0+/, "");

    const payload = {
      phone: cleanPhone,
      number: cleanPhone,
      text: text,
      message: text,
      caption: text,
      mediaUrl: (mediaUrl && typeof mediaUrl === "string" && mediaUrl.startsWith("http")) ? mediaUrl : null,
      media: (mediaUrl && typeof mediaUrl === "string" && mediaUrl.startsWith("http")) ? mediaUrl : null,
      mediaType: mediaType || "image",
      mediatype: mediaType || "image",
      instance: instanceName,
      instanceName: instanceName,
      apiKey: apiKey,
    };

    console.log(`[WhatsApp Send] Enviando a ${cleanPhone} vía n8n webhook: ${n8nWebhookUrl}`);

    // Prioridad 1: Webhook central n8n (https://n8n.santisoft.cl/webhook/evoapi)
    try {
      const n8nRes = await fetch(n8nWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      });

      if (n8nRes.ok) {
        const n8nData = await n8nRes.json().catch(() => ({ message: "Workflow was started" }));
        console.log(`[WhatsApp Send] ✅ Enviado con éxito vía n8n webhook:`, n8nData);
        return NextResponse.json({ ok: true, mode: "n8n_evoapi", result: n8nData });
      } else {
        const errText = await n8nRes.text();
        console.warn(`[WhatsApp Send] ⚠️ n8n webhook respondió ${n8nRes.status}: ${errText}. Probando fallback directo...`);
      }
    } catch (n8nErr: any) {
      console.warn(`[WhatsApp Send] ⚠️ Excepción en n8n webhook (${n8nErr.message}). Probando fallback directo...`);
    }

    // Prioridad 2: Fallback directo a Evolution API si n8n no estuviera respondiendo
    console.log(`[WhatsApp Send] Intentando fallback directo a Evolution API en ${evolutionUrl}`);

    if (payload.mediaUrl) {
      try {
        const mediaEndpoint = `${evolutionUrl}/message/sendMedia/${instanceName}`;
        const mediaRes = await fetch(mediaEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: apiKey,
          },
          body: JSON.stringify({
            number: cleanPhone,
            mediatype: mediaType || "image",
            media: payload.mediaUrl,
            caption: text,
          }),
          signal: AbortSignal.timeout(10000),
        });

        if (mediaRes.ok) {
          console.log(`[WhatsApp Send] ✅ Media enviado exitosamente por fallback Evolution API directo.`);
          return NextResponse.json({ ok: true, mode: "media_direct" });
        }
      } catch (mediaErr: any) {
        console.warn(`[WhatsApp Send] ⚠️ Fallback sendMedia falló:`, mediaErr.message);
      }
    }

    try {
      const textEndpoint = `${evolutionUrl}/message/sendText/${instanceName}`;
      const textRes = await fetch(textEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: apiKey,
        },
        body: JSON.stringify({
          number: cleanPhone,
          text: text,
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (textRes.ok) {
        console.log(`[WhatsApp Send] ✅ Texto enviado exitosamente por fallback Evolution API directo.`);
        return NextResponse.json({ ok: true, mode: "text_direct" });
      } else {
        const resText = await textRes.text();
        throw new Error(`Evolution API (${textRes.status}): ${resText}`);
      }
    } catch (directErr: any) {
      console.error("[WhatsApp Send Fallback Exception]:", directErr);
      return NextResponse.json(
        { error: `No se pudo entregar el mensaje por WhatsApp (${directErr.message}). Puedes usar la opción de abrir WhatsApp Web directamente.` },
        { status: 502 }
      );
    }

  } catch (err: any) {
    console.error("[WhatsApp Send Exception]:", err);
    return NextResponse.json({ error: err.message || "Error interno del servidor" }, { status: 500 });
  }
}
