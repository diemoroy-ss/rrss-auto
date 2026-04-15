import { NextResponse } from "next/server";
import { getChatHistory, saveChatMessage } from "../../../lib/chatHistory";
import { generateChatbotResponse } from "../../../lib/gemini";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, name, text } = body;

    if (!phone || !text) {
      return NextResponse.json({ error: "Faltan datos (phone o text)" }, { status: 400 });
    }

    // Prefijo especial para distinguir rápidamente chats web en el admin
    const sessionPhone = `web_${phone}`;
    const pushName = name || 'Visitante Web';

    console.log(`[WebChat] Mensaje de ${pushName} (${sessionPhone}): ${text}`);

    // 1. Guardar mensaje del usuario web
    await saveChatMessage(sessionPhone, "user", text, pushName);

    // 2. Obtener historial para darle contexto a la IA
    const history = await getChatHistory(sessionPhone);

    // 3. Generar respuesta con Gemini
    const aiResponseText = await generateChatbotResponse(history, text, pushName);
    console.log(`[WebChat] Respuesta IA:`, aiResponseText);

    if (!aiResponseText) {
        throw new Error("Gemini no devolvió texto.");
    }

    // 4. Guardar respuesta de la IA en la bd
    await saveChatMessage(sessionPhone, "ai", aiResponseText, pushName);

    // 5. Retornar el texto al frontend widget
    return NextResponse.json({ reply: aiResponseText }, { status: 200 });

  } catch (error: any) {
    console.error("[WebChat] Error procesando mensaje:", error.message || error);
    
    // Detectar si fue un error de Rate Limit (429) de Google Gemini
    if (error.message && error.message.includes("429") || error.message && error.message.includes("retry")) {
        return NextResponse.json({ error: "El asistente está analizando tus mensajes anteriores. Por favor, espera 30 segundos e intenta de nuevo." }, { status: 429 });
    }

    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
  }
}
