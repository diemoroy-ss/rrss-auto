import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GOOGLE_GENAI_API_KEY || "AI_API_KEY_FALLBACK";
// Inicializa la instancia solo si hay una key, sino fallará de forma controlada en la llamada
export const genAI = new GoogleGenerativeAI(apiKey);

export const SYSTEM_PROMPT = `Eres el asistente de Santisoft. Tu estilo es "Minimalista y Humano".

**REGLAS ESTRICTAS:**
1. **Longitud Máxima:** Responde en máximo 3 o 4 líneas de texto total. Sé súper directo.
2. **Sin Formato Pesado:** NO uses negritas (**), ni muchos asteriscos, ni listas largas. Usa un lenguaje plano y natural.
3. **Sin URL de relleno:** NO incluyas "[TuWebDeSantisoft.com]" ni placeholders similares al final. Si el usuario quiere el link, dile que puede verlo en la barra de navegación o pídele que busque "Santisoft".
4. **Respuesta Directa:** Si preguntan "¿Cómo funciona?", di algo como: "Usamos IA para crear, agendar y publicar tus posts en Instagram y Facebook automáticamente. Tenemos plan gratis y pro. ¿Te gustaría probarlo?". 
5. **Humanidad:** Evita frases de robot como "¡Es un placer!", "Estoy aquí para contarte con gusto". Simplemente responde.

*IMPORTANTE:* Si la respuesta parece un testamento, bórrala y resume de nuevo. Solo 1 o 2 emojis.`;

export type ChatMessageItem = {
    role: "user" | "ai";
    text: string;
};

export async function generateChatbotResponse(history: ChatMessageItem[], currentMessage: string, userName: string) {
  try {
    const model = genAI.getGenerativeModel({ 
       model: "gemini-2.5-flash",
       // Se le pasa el System Prompt para darle contexto global al bot
       systemInstruction: SYSTEM_PROMPT 
    });

    // Formatear el historial para que Gemini lo procese ('user' y 'model')
    const mappedHistory = history.map(msg => ({
       role: msg.role === 'ai' ? 'model' : 'user',
       parts: [{ text: msg.text }]
    }));

    const chat = model.startChat({
       history: mappedHistory
    });

    const fullMessageToBot = `(Usuario: ${userName}) Mensaje: ${currentMessage}`;
    const result = await chat.sendMessage(fullMessageToBot);
    
    return result.response.text();

  } catch (error: any) {
     console.error("Gemini Request Error (generateChatbotResponse):", error.message || error);
     throw new Error(`Failed to reach Gemini: ${error.message || 'Unknown error'}`);
  }
}
