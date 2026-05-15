import { NextResponse } from "next/server";
import { startContentWorkflow, resumeContentWorkflow, runFullContentWorkflow } from "../../../../lib/langgraph-agent";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, topic, platform, threadId, updatedCritique } = body;

    // Generamos un threadId si no viene provisto
    const currentThreadId = threadId || `thread_${Date.now()}`;

    if (action === "resume") {
      console.log(`[API LangGraph] Reanudando hilo: ${currentThreadId}`);
      const result = await resumeContentWorkflow(currentThreadId, updatedCritique);
      return NextResponse.json({ success: true, data: result }, { status: 200 });
    }

    if (action === "generate_full") {
      if (!topic) {
        return NextResponse.json({ error: "El campo 'topic' es obligatorio." }, { status: 400 });
      }
      console.log(`[API LangGraph] Generación completa directa para: ${topic}`);
      const result = await runFullContentWorkflow(topic, platform || "LinkedIn");
      return NextResponse.json({ success: true, data: result }, { status: 200 });
    }

    // Acción por defecto: Start (con pausa de revisión)
    if (!topic) {
      return NextResponse.json(
        { error: "El campo 'topic' es obligatorio para iniciar el flujo." },
        { status: 400 }
      );
    }

    console.log(`[API LangGraph] Iniciando hilo: ${currentThreadId}`);
    const result = await startContentWorkflow(topic, platform || "LinkedIn", currentThreadId);

    return NextResponse.json({
      success: true,
      message: "Flujo iniciado y pausado exitosamente para revisión humana.",
      data: result,
    }, { status: 200 });

  } catch (error: any) {
    console.error("CRITICAL: [LangGraph API Error]:", error);
    
    // Log the full error for server-side debugging
    if (error.stack) {
      console.error(error.stack);
    }

    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Error interno ejecutando el flujo de LangGraph.",
        detail: error.stack || error.toString(),
        code: error.status || error.code || 500
      },
      { status: 500 }
    );

  }

}
