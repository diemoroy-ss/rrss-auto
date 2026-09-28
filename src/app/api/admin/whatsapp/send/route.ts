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

    console.log(`[WhatsApp Send] Iniciando envío a ${cleanPhone} vía Evolution API (${instanceName})`);

    let delivered = false;
    let deliveredMode = "";

    // Intento 1: Si hay imagen, enviar como Media con Caption
    if (payload.mediaUrl) {
      try {
        console.log(`[WhatsApp Send] Intentando envío de imagen con texto vía Evolution API sendMedia...`);
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
            mimetype: "image/jpeg",
            caption: text,
            media: payload.mediaUrl,
          }),
          signal: AbortSignal.timeout(12000),
        });

        if (mediaRes.ok) {
          const resJson = await mediaRes.json().catch(() => ({}));
          console.log(`[WhatsApp Send] ✅ Media enviado exitosamente por Evolution API:`, resJson);
          delivered = true;
          deliveredMode = "media_direct";
        } else {
          const errText = await mediaRes.text();
          console.warn(`[WhatsApp Send] ⚠️ sendMedia respondió ${mediaRes.status}: ${errText}. Probando envío como texto...`);
        }
      } catch (mediaErr: any) {
        console.warn(`[WhatsApp Send] ⚠️ Excepción en sendMedia (${mediaErr.message}). Probando envío como texto...`);
      }
    }

    // Intento 2: Si no hubo media o falló sendMedia, enviar como Texto puro
    if (!delivered) {
      try {
        console.log(`[WhatsApp Send] Intentando envío de texto puro vía Evolution API sendText...`);
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
          signal: AbortSignal.timeout(10000),
        });

        if (textRes.ok) {
          const textJson = await textRes.json().catch(() => ({}));
          console.log(`[WhatsApp Send] ✅ Texto enviado exitosamente por Evolution API:`, textJson);
          delivered = true;
          deliveredMode = "text_direct";
        } else {
          const errBody = await textRes.text();
          throw new Error(`Evolution API (${textRes.status}): ${errBody}`);
        }
      } catch (textErr: any) {
        console.error("[WhatsApp Send Text Error]:", textErr);
        throw textErr;
      }
    }

    // Notificación en segundo plano al webhook de n8n para registro y trazabilidad
    if (delivered && n8nWebhookUrl) {
      fetch(n8nWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, deliveryStatus: "sent", deliveredMode }),
        signal: AbortSignal.timeout(5000),
      }).catch((n8nErr) => {
        console.warn("[WhatsApp Send] Registro asíncrono en n8n omitido:", n8nErr.message);
      });
    }

    return NextResponse.json({ ok: true, mode: deliveredMode, phone: cleanPhone });

  } catch (err: any) {
    console.error("[WhatsApp Send Exception]:", err);
    return NextResponse.json({ error: err.message || "Error interno del servidor" }, { status: 500 });
  }
}
