import { NextResponse } from 'next/server';
import { getFreeModel } from "../../../../lib/gemini-free";

// Duración máxima de serverless
export const maxDuration = 60;

// Almacén en memoria simple para simular el progreso de la demo en el backend
const demoThreads = new Map<string, {
  rubro: string;
  idea: string;
  createdAt: number;
  copy: string;
  imageUrl: string;
}>();

export async function POST(req: Request) {
  try {
    const { rubro, idea } = await req.json();

    if (!rubro || !idea) {
      return NextResponse.json(
        { error: 'Faltan parámetros rubro o idea' },
        { status: 400 }
      );
    }

    const threadId = `demo_video_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    console.log(`[API Demo Generate] Iniciando simulación de video para Demo. ThreadID: ${threadId}`);

    // Pre-generamos el copy optimizado usando Gemini para guardarlo y entregarlo al completarse
    let suggestedCopy = `¡Optimiza tu negocio en el rubro ${rubro}! 🚀\n\nNuestra solución te ayuda a: \n✅ Ahorrar tiempo\n✅ Mejorar resultados\n✅ Escalar con IA\n\n¡Contáctanos hoy mismo!`;
    
    try {
      const systemInstruction = `Eres un copywriter experto. Crea un post de redes sociales corto y atractivo en ESPAÑOL con emojis y hashtags basado en el rubro y la idea del usuario. No incluyas explicaciones.`;
      const model = getFreeModel(undefined, systemInstruction);
      const res = await model.generateContent(`Rubro: ${rubro}. Idea: ${idea}`);
      const text = res.response.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text) {
        suggestedCopy = text;
      }
    } catch (err) {
      console.warn("[demo-generate] Error generando copy con Gemini:", err);
    }

    // Guardamos la simulación
    demoThreads.set(threadId, {
      rubro,
      idea,
      createdAt: Date.now(),
      copy: suggestedCopy,
      imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1000&auto=format&fit=crop"
    });

    return NextResponse.json({
      threadId,
      status: 'preparing_firebase_assets',
      message: 'Flujo de demo simulado iniciado.'
    });

  } catch (error: any) {
    console.error('API /demo-generate POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Error Interno del Servidor' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const threadId = searchParams.get('threadId');

    if (!threadId) {
      return NextResponse.json(
        { error: 'Falta parámetro threadId' },
        { status: 400 }
      );
    }

    const thread = demoThreads.get(threadId);
    if (!thread) {
      return NextResponse.json(
        { error: 'No se encontró el hilo solicitado.' },
        { status: 404 }
      );
    }

    const elapsed = Date.now() - thread.createdAt;
    let status = 'preparing_firebase_assets';

    if (elapsed > 9000) {
      status = 'completed';
    } else if (elapsed > 6000) {
      status = 'stitching';
    } else if (elapsed > 3000) {
      status = 'rendering_remotion_chunks';
    }

    if (status === 'completed') {
      return NextResponse.json({
        status: 'completed',
        copy: thread.copy,
        scenes: [
          {
            id: 'scene_1',
            assetUrl: thread.imageUrl
          }
        ],
        // Un video de stock premium de oficina para simular el render
        finalVideoUrl: "https://assets.mixkit.co/videos/preview/mixkit-software-developer-working-on-his-computer-34288-large.mp4"
      });
    }

    return NextResponse.json({
      status,
      copy: "",
      scenes: [],
      finalVideoUrl: ""
    });

  } catch (error: any) {
    console.error('API /demo-generate GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Error Interno del Servidor' },
      { status: 500 }
    );
  }
}
