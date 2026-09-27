import { NextResponse } from "next/server";
import { adminAuth } from "../../../../../lib/firebase-admin";

export const dynamic = "force-dynamic";

const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || "";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "";
const EVOLUTION_INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || "";

const ADMIN_EMAILS = ["diemoroy@gmail.com", "spalezcom@gmail.com", "santisoftai@gmail.com"];

export async function POST(req: Request) {
  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token" }, { status: 401 });
    }
    const token = authHeader.split("Bearer ")[1];
    const decoded = await adminAuth.verifyIdToken(token);
    const email = (decoded.email || "").toLowerCase();
    if (!ADMIN_EMAILS.includes(email)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check Evolution API config
    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE_NAME) {
      return NextResponse.json(
        { error: "Evolution API no configurado en variables de entorno." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { phone, text, mediaUrl, mediaType } = body;

    if (!phone || !text) {
      return NextResponse.json({ error: "phone y text son requeridos" }, { status: 400 });
    }

    // Clean phone: remove spaces, dashes, parentheses, leading zeros, and + sign
    const cleanPhone = phone.replace(/[\s\-\(\)\+]/g, "").replace(/^0+/, "");

    // If there's a media URL (image), send as mediaMessage first, then text
    if (mediaUrl && (mediaType === "image" || !mediaType)) {
      const mediaRes = await fetch(
        `${EVOLUTION_API_URL}/message/sendMedia/${EVOLUTION_INSTANCE_NAME}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: EVOLUTION_API_KEY,
          },
          body: JSON.stringify({
            number: cleanPhone,
            mediatype: "image",
            media: mediaUrl,
            caption: text,
          }),
        }
      );

      if (!mediaRes.ok) {
        const errText = await mediaRes.text();
        console.error("Evolution API sendMedia error:", errText);
        // Fallback: send text only
      } else {
        return NextResponse.json({ ok: true, mode: "media" });
      }
    }

    // Send text message
    const textRes = await fetch(
      `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE_NAME}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: EVOLUTION_API_KEY,
        },
        body: JSON.stringify({
          number: cleanPhone,
          text,
        }),
      }
    );

    if (!textRes.ok) {
      const errText = await textRes.text();
      console.error("Evolution API sendText error:", errText);
      return NextResponse.json({ error: "Error al enviar mensaje por Evolution API", detail: errText }, { status: 500 });
    }

    return NextResponse.json({ ok: true, mode: "text" });
  } catch (err: any) {
    console.error("Error en /api/admin/whatsapp/send:", err);
    return NextResponse.json({ error: err.message || "Internal Error" }, { status: 500 });
  }
}
