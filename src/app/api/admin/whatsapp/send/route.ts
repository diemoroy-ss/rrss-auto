import { NextResponse } from "next/server";
import { adminAuth } from "../../../../../lib/firebase-admin";

export const dynamic = "force-dynamic";

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

    const evolutionUrl = (process.env.EVOLUTION_API_URL || DEFAULT_EVOLUTION_URL).replace(/\/$/, "");
    const instanceName = customInstance || process.env.EVOLUTION_INSTANCE_NAME || DEFAULT_INSTANCE_NAME;
    const apiKey = customApiKey || process.env.EVOLUTION_API_KEY || DEFAULT_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Falta la API Key de Evolution API. Por favor configúrala en las variables de entorno o ingrésala." },
        { status: 500 }
      );
    }

    // Limpiar teléfono
    const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, "").replace(/^0+/, "");

    console.log(`[WhatsApp Send] Enviando a ${cleanPhone} vía ${evolutionUrl} (Instancia: ${instanceName})`);

    // Intento 1: Si hay imagen pública válida, enviar como Media con Caption
    if (mediaUrl && typeof mediaUrl === "string" && mediaUrl.startsWith("http")) {
      try {
        const mediaEndpoint = `${evolutionUrl}/message/sendMedia/${instanceName}`;
        console.log(`[WhatsApp Send] Intentando sendMedia en ${mediaEndpoint}`);
        
        const mediaRes = await fetch(mediaEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: apiKey,
          },
          body: JSON.stringify({
            number: cleanPhone,
            mediatype: mediaType || "image",
            media: mediaUrl,
            caption: text,
          }),
        });

        if (mediaRes.ok) {
          console.log(`[WhatsApp Send] ✅ Media enviado exitosamente.`);
          return NextResponse.json({ ok: true, mode: "media" });
        } else {
          const errText = await mediaRes.text();
          console.warn(`[WhatsApp Send] ⚠️ sendMedia falló con status ${mediaRes.status}: ${errText}. Continuando con texto solo...`);
        }
      } catch (mediaErr: any) {
        console.warn(`[WhatsApp Send] ⚠️ Excepción en sendMedia: ${mediaErr.message}. Continuando con texto solo...`);
      }
    }

    // Intento 2: Enviar como Mensaje de Texto directo
    const textEndpoint = `${evolutionUrl}/message/sendText/${instanceName}`;
    console.log(`[WhatsApp Send] Enviando sendText a ${textEndpoint}`);

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
    });

    const resText = await textRes.text();

    if (!textRes.ok) {
      console.error(`[WhatsApp Send] ❌ sendText falló (${textRes.status}):`, resText);
      let parsedMsg = resText;
      try {
        const parsed = JSON.parse(resText);
        parsedMsg = parsed.response?.message || parsed.message || parsed.error || resText;
      } catch (_) {}
      return NextResponse.json(
        { error: `Evolution API (${textRes.status}): ${parsedMsg}`, detail: resText },
        { status: textRes.status }
      );
    }

    console.log(`[WhatsApp Send] ✅ Mensaje de texto enviado exitosamente a ${cleanPhone}`);
    return NextResponse.json({ ok: true, mode: "text" });

  } catch (err: any) {
    console.error("[WhatsApp Send Exception]:", err);
    return NextResponse.json({ error: err.message || "Error interno del servidor" }, { status: 500 });
  }
}
