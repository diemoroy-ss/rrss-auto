import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "../../../../../lib/firebase-admin";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

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
      if (adminDb) {
        const userDoc = await adminDb.collection("users").doc(decoded.uid).get();
        const role = userDoc.data()?.role;
        if (role !== "admin" && role !== "vendedor") {
          return NextResponse.json({ error: "No autorizado" }, { status: 403 });
        }
      } else {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 });
      }
    }

    const body = await req.json();
    const { phone, text, mediaUrl, mediaType, apiKey: customApiKey, instanceName: customInstance, logOnly } = body;

    if (!phone || !text) {
      return NextResponse.json({ error: "phone y text son requeridos" }, { status: 400 });
    }

    let cleanPhone = phone.replace(/[\s\-\(\)\+]/g, "").replace(/^0+/, "");
    if (cleanPhone.length === 9 && cleanPhone.startsWith("9")) {
      cleanPhone = "56" + cleanPhone;
    }
    const n8nWebhookUrl = process.env.N8N_EVOAPI_WEBHOOK_URL || N8N_EVOAPI_WEBHOOK_URL;

    // Si ya se entregó directamente por el navegador (CORS), solo registramos y salimos
    if (logOnly) {
      if (n8nWebhookUrl) {
        fetch(n8nWebhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json; charset=utf-8" },
          body: JSON.stringify({
            phone: cleanPhone,
            number: cleanPhone,
            text: text,
            deliveryStatus: "sent",
            deliveredMode: "direct_browser",
            timestamp: new Date().toISOString(),
          }),
          signal: AbortSignal.timeout(5000),
        }).catch(() => {});
      }
      return NextResponse.json({ ok: true, mode: "direct_browser_logged" });
    }

    const rawUrl = process.env.EVOLUTION_API_URL || DEFAULT_EVOLUTION_URL;
    const evolutionUrl = rawUrl.trim().replace(/^["']|["']$/g, "").replace(/\/$/, "");
    const rawInstance = customInstance || process.env.EVOLUTION_INSTANCE_NAME || DEFAULT_INSTANCE_NAME;
    let instanceName = rawInstance.trim().replace(/^["']|["']$/g, "");
    if (instanceName.toLowerCase() === "santisoft") {
      instanceName = "Santisoft";
    }
    const rawApiKey = customApiKey || process.env.EVOLUTION_API_KEY || DEFAULT_API_KEY;
    const apiKey = rawApiKey.trim().replace(/^["']|["']$/g, "");

    // Validar formato de media
    // Solo enviamos media si es una URL pública directa de Cloudinary o CDN compatible.
    // NUNCA enviamos Firebase Storage (da 403 en Axios de Evolution) ni base64 pesados (dan timeout en Vercel).
    let validMedia: string | null = null;
    let mimeType = "image/jpeg";
    if (mediaUrl && typeof mediaUrl === "string") {
      if (mediaUrl.includes("res.cloudinary.com") || (mediaUrl.startsWith("http") && !mediaUrl.includes("firebasestorage.googleapis.com") && !mediaUrl.includes("butterfly.santisoft.cl"))) {
        validMedia = mediaUrl;
      }
    }

    console.log(`[WhatsApp Send] Destino: ${cleanPhone} | Instancia: ${instanceName} | Media: ${validMedia ? "si (Cloudinary/CDN)" : "no (solo texto)"}`);

    let delivered = false;
    let deliveredMode = "";
    let lastMediaError = "";
    let lastTextError = "";

    // Intento 1: Si hay imagen válida y ligera de Cloudinary, intentar envío con caption
    if (validMedia) {
      try {
        console.log(`[WhatsApp Send] Intentando envío con imagen vía sendMedia...`);
        const mediaEndpoint = `${evolutionUrl}/message/sendMedia/${instanceName}`;
        const mediaRes = await fetch(mediaEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            apikey: apiKey,
          },
          body: JSON.stringify({
            number: cleanPhone,
            mediatype: "image",
            mimetype: mimeType,
            caption: text,
            media: validMedia,
          }),
          signal: AbortSignal.timeout(30000), // Timeout holgado de 30s para Baileys
        });

        if (mediaRes.ok) {
          const resJson = await mediaRes.json().catch(() => ({}));
          console.log(`[WhatsApp Send] ✅ Media enviado exitosamente:`, resJson);
          delivered = true;
          deliveredMode = "media_direct";
        } else {
          const errText = await mediaRes.text().catch(() => "");
          lastMediaError = `sendMedia status ${mediaRes.status}: ${errText}`;
          console.warn(`[WhatsApp Send] ⚠️ ${lastMediaError}. Continuando con texto directo...`);
        }
      } catch (mediaErr: any) {
        lastMediaError = `sendMedia excepción: ${mediaErr.message}`;
        console.warn(`[WhatsApp Send] ⚠️ ${lastMediaError}. Continuando con texto directo...`);
      }
    }

    // Intento 2: Envío de texto directo (el mensaje comercial con el enlace interactivo)
    if (!delivered) {
      try {
        console.log(`[WhatsApp Send] Enviando mensaje como texto directo vía sendText...`);
        const textEndpoint = `${evolutionUrl}/message/sendText/${instanceName}`;
        const textRes = await fetch(textEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            apikey: apiKey,
          },
          body: JSON.stringify({
            number: cleanPhone,
            text: text,
          }),
          signal: AbortSignal.timeout(30000), // Timeout holgado de 30s para Baileys
        });

        if (textRes.ok) {
          const textJson = await textRes.json().catch(() => ({}));
          console.log(`[WhatsApp Send] ✅ Texto enviado exitosamente:`, textJson);
          delivered = true;
          deliveredMode = validMedia ? "text_fallback" : "text_direct";
        } else {
          const errBody = await textRes.text().catch(() => "");
          lastTextError = `sendText status ${textRes.status}: ${errBody}`;
          console.warn(`[WhatsApp Send] ${lastTextError}`);
        }
      } catch (textErr: any) {
        lastTextError = `sendText excepción: ${textErr.message}`;
        console.error("[WhatsApp Send Text Error]:", textErr);
      }
    }

    if (!delivered) {
      return NextResponse.json(
        {
          error: `No se pudo entregar el mensaje por WhatsApp. ${lastTextError || lastMediaError || "Error de conexión"}`.trim(),
          details: { lastTextError, lastMediaError, instanceName, evolutionUrl },
        },
        { status: 502 }
      );
    }

    // Notificación asíncrona a n8n para métricas
    if (delivered && n8nWebhookUrl) {
      fetch(n8nWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          phone: cleanPhone,
          number: cleanPhone,
          text: text,
          deliveryStatus: "sent",
          deliveredMode,
          timestamp: new Date().toISOString(),
        }),
        signal: AbortSignal.timeout(3000),
      }).catch((n8nErr) => {
        console.warn("[WhatsApp Send] Log asíncrono en n8n omitido:", n8nErr.message);
      });
    }

    return NextResponse.json({ ok: true, mode: deliveredMode, phone: cleanPhone });

  } catch (err: any) {
    console.error("[WhatsApp Send Exception]:", err);
    return NextResponse.json({ error: err.message || "Error interno del servidor" }, { status: 500 });
  }
}
