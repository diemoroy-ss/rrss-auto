import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Vercel Serverless maximum duration (requires Pro plan or custom host, but necessary for n8n synchronous wait)
export const maxDuration = 120;

const apiKey = process.env.GOOGLE_GENAI_API_KEY || '';
const N8N_WEBHOOK_URL = 'https://n8n.santisoft.cl/webhook/demo-ia';

export async function POST(req: Request) {
  try {
    const { rubro, idea } = await req.json();

    if (!rubro || !idea) {
      return NextResponse.json(
        { error: 'Missing rubro or idea' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Server AI not configured' },
        { status: 500 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.7,
      }
    });

    // 1. Generate structural prompts using Gemini
    const systemPrompt = `Eres un experto en Marketing Digital y Dirección de Arte B2B.
El usuario quiere crear un post de redes sociales para su negocio.
Rubro: ${rubro}
Idea: ${idea}

Necesitas generar exactamente un JSON con 3 campos:
- "image_prompt": Un prompt profesional, hiperrealista y detallado en INGLÉS para un modelo de IA de imágenes. No incluyas texto o letras en la imagen. Prioriza iluminación dramática, colores vibrantes de alto contraste y composición 4:5.
- "video_prompt": Un prompt descriptivo en INGLÉS para generación de video AI de 5 segundos, formato vertical. Debe describir movimiento cinematográfico (ej: "Slow cinematic pan...").
- "copy": El texto (caption) para Instagram/Facebook en ESPAÑOL, con emojis y llamado a la acción persuasivo (max 400 caracteres).

Retorna SOLO un JSON válido, sin delimitadores de código markdown como \`\`\`json.`;

    const result = await model.generateContent(systemPrompt);
    const textResponse = result.response.text().trim();
    
    // Clean potential markdown blocks
    const cleanedJsonStr = textResponse.replace(/^```json/i, '').replace(/^```/, '').replace(/```$/, '').trim();
    
    let generatedPrompts;
    try {
        generatedPrompts = JSON.parse(cleanedJsonStr);
    } catch (e) {
        console.error("Gemini didn't return valid JSON:", cleanedJsonStr);
        return NextResponse.json(
            { error: 'Error generating creative structure. Please try again.' },
            { status: 500 }
        );
    }

    // 2. Transmit to n8n to execute rendering
    // Enforcing timeouts since n8n process can take a solid 15-45 seconds for images/video
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 115000); // 115s max waiting time for media generation
    
    try {
        const n8nReq = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                rubro,
                idea,
                image_prompt: generatedPrompts.image_prompt,
                video_prompt: generatedPrompts.video_prompt,
                copy: generatedPrompts.copy,
                timestamp: new Date().toISOString()
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!n8nReq.ok) {
            console.error(`n8n responded with ${n8nReq.status}`);
            return NextResponse.json(
                { error: 'Renderer service unavailable. Please try again later.' },
                { status: 502 }
            );
        }

        const n8nData = await n8nReq.json();
        
        // Return both our generated copy + the media URLs returned by n8n
        return NextResponse.json({
            copy: generatedPrompts.copy,
            image_prompt: generatedPrompts.image_prompt,
            video_prompt: generatedPrompts.video_prompt,
            result: n8nData // We expect n8n to send back { imageUrl: '...', videoUrl: '...' } inside this payload
        });
        
    } catch (e: any) {
        clearTimeout(timeoutId);
        if (e.name === 'AbortError') {
             return NextResponse.json(
                { error: 'Media generation took too long. Please try again.' },
                { status: 504 }
            );
        }
        console.error("Error communicating with n8n:", e);
        return NextResponse.json(
            { error: 'Service communication error' },
            { status: 500 }
        );
    }
    
  } catch (error) {
    console.error('API /demo-generate error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
