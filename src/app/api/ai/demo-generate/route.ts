import { NextResponse } from 'next/server';
import { startAsyncVideoGeneration, getVideoWorkflowStatus } from "../../../../lib/langgraph-video";

// Vercel Serverless maximum duration
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { rubro, idea } = await req.json();

    if (!rubro || !idea) {
      return NextResponse.json(
        { error: 'Faltan parámetros rubro o idea' },
        { status: 400 }
      );
    }

    // Generamos un identificador único de hilo para este proceso de video
    const threadId = `video_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    console.log(`[API Demo Generate] Iniciando generación asíncrona de video sin n8n. ThreadID: ${threadId}`);
    
    // Disparamos la orquestación asíncrona de LangGraph en segundo plano
    const initResult = await startAsyncVideoGeneration(rubro, idea, threadId);

    // Retornamos inmediatamente el threadId al frontend para que consulte el avance por long-polling/SSE
    return NextResponse.json({
      threadId,
      status: initResult.status,
      message: initResult.message,
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

    console.log(`[API Demo Generate] Consultando estado del render para hilo: ${threadId}`);
    const statusData = await getVideoWorkflowStatus(threadId);

    if (statusData.status === 'not_found') {
      return NextResponse.json({ error: statusData.errorMessage }, { status: 404 });
    }

    return NextResponse.json(statusData);

  } catch (error: any) {
    console.error('API /demo-generate GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Error Interno del Servidor' },
      { status: 500 }
    );
  }
}
