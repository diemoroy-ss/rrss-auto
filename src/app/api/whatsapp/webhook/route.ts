import { NextResponse } from "next/server";
import { getChatHistory, saveChatMessage } from "../../../../lib/chatHistory";
import { generateChatbotResponse } from "../../../../lib/gemini";

// Mapeo básico de las variables de entorno de Evolution API
const EVOLUTION_API_URL = process.env.EVOLUTION_API_URL || "";
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || "";
const EVOLUTION_INSTANCE_NAME = process.env.EVOLUTION_INSTANCE_NAME || "";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Evolution API manda diferentes eventos, nos interesa 'messages.upsert'
    if (body.event !== "messages.upsert") {
      return NextResponse.json({ status: "ignored event" }, { status: 200 });
    }

    const data = body.data;
    
    // Si no hay datos o el mensaje fue enviado por nosotros mismos, lo ignoramos para evitar bucles
    if (!data || data.key?.fromMe) {
      return NextResponse.json({ status: "ignored - from me or empty" }, { status: 200 });
    }

    const remoteJid = data.key.remoteJid; // El número de teléfono con @s.whatsapp.net
    
    // Ignoramos mensajes de grupos
    if (remoteJid?.includes("@g.us")) {
        return NextResponse.json({ status: "ignored - group message" }, { status: 200 });
    }

    const pushName = data.pushName || "Usuario";
    
    // Extraer el texto del mensaje (puede venir en conversation o en extendedTextMessage)
    let incomingText = "";
    if (data.message?.conversation) {
        incomingText = data.message.conversation;
    } else if (data.message?.extendedTextMessage?.text) {
        incomingText = data.message.extendedTextMessage.text;
    }

    if (!incomingText) {
       return NextResponse.json({ status: "ignored - no text" }, { status: 200 });
    }

    console.log(`[WHATSAPP BOT] Mensaje de ${pushName} (${remoteJid}): ${incomingText}`);

    // 1. Guardar el mensaje del usuario en el historial
    await saveChatMessage(remoteJid, "user", incomingText, pushName);

    // 2. Obtener el contexto previo
    const history = await getChatHistory(remoteJid, 15);

    // 3. Generar la respuesta usando Gemini
    const aiResponseText = await generateChatbotResponse(history, incomingText, pushName);
    
    // 4. Guardar la respuesta de la IA en el historial
    await saveChatMessage(remoteJid, "ai", aiResponseText);

    // 5. Enviar la respuesta de vuelta a WhatsApp vía Evolution API
    if (EVOLUTION_API_URL && EVOLUTION_API_KEY && EVOLUTION_INSTANCE_NAME) {
        const sendUrl = `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE_NAME}`;
        
        // Dividir la respuesta por párrafos (doble salto de línea) o saltos simples si el párrafo es largo
        const chunks = aiResponseText
            .split(/\n\n+/)
            .map(c => c.trim())
            .filter(c => c.length > 0);

        for (const chunk of chunks) {
            const evoRes = await fetch(sendUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "apikey": EVOLUTION_API_KEY
                },
                body: JSON.stringify({
                    number: remoteJid,
                    text: chunk
                })
            });

            if (!evoRes.ok) {
                console.error("Error enviando fragmento por Evolution API:", await evoRes.text());
            }

            // Opcional: Pequeño retraso entre mensajes para que se vea más humano
            if (chunks.length > 1) {
                await new Promise(resolve => setTimeout(resolve, 800));
            }
        }
    } else {
        console.warn("Evolution API no está configurado en las variables de entorno (.env). La respuesta se generó pero no se envió.");
    }

    return NextResponse.json({ status: "success" }, { status: 200 });

  } catch (error: any) {
    console.error("Error procesando Webhook de WhatsApp:", error);
    // Retornamos 200 para que Evolution no reintente el webhook infinitamente si hay un error nuestro
    return NextResponse.json({ status: "error", message: "Algo salió mal" }, { status: 200 });
  }
}
