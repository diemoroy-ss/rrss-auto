import { NextResponse } from "next/server";
import { startContentWorkflow, resumeContentWorkflow, runFullContentWorkflow } from "../../../../lib/langgraph-agent";
import { sanitizeInput, maskError } from "../../../../lib/security";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, topic, platform, threadId, updatedCritique } = body;

    // Generamos un threadId si no viene provisto
    const currentThreadId = typeof threadId === 'string' ? threadId.trim() : `thread_${Date.now()}`;

    // Sanitización de entradas del usuario para mitigar Prompt Injections
    const sanitizedTopic = topic ? sanitizeInput(String(topic), 1000) : "";
    const sanitizedCritique = updatedCritique ? sanitizeInput(String(updatedCritique), 2000) : undefined;
    const sanitizedPlatform = platform ? sanitizeInput(String(platform), 50) : "LinkedIn";

    if (action === "resume") {
      console.log(`[API LangGraph] Reanudando hilo: ${currentThreadId}`);
      const result = await resumeContentWorkflow(currentThreadId, sanitizedCritique);
      return NextResponse.json({ success: true, data: result }, { status: 200 });
    }

    if (action === "generate_full") {
      if (!sanitizedTopic) {
        return NextResponse.json({ error: "El campo 'topic' es obligatorio." }, { status: 400 });
      }
      console.log(`[API LangGraph] Generación completa directa para: ${sanitizedTopic}`);
      const result = await runFullContentWorkflow(sanitizedTopic, sanitizedPlatform);
      return NextResponse.json({ success: true, data: result }, { status: 200 });
    }

    // Acción por defecto: Start (con pausa de revisión)
    if (!sanitizedTopic) {
      return NextResponse.json(
        { error: "El campo 'topic' es obligatorio para iniciar el flujo." },
        { status: 400 }
      );
    }

    console.log(`[API LangGraph] Iniciando hilo: ${currentThreadId}`);
    const result = await startContentWorkflow(sanitizedTopic, sanitizedPlatform, currentThreadId);

    return NextResponse.json({
      success: true,
      message: "Flujo iniciado y pausado exitosamente para revisión humana.",
      data: result,
    }, { status: 200 });

  } catch (error: unknown) {
    const masked = maskError(error, "Error interno ejecutando el flujo de LangGraph.");
    return NextResponse.json(
      { 
        success: false, 
        error: masked.error,
        code: masked.code
      },
      { status: masked.code === 400 || masked.code === 401 || masked.code === 403 || masked.code === 404 ? masked.code : 500 }
    );
  }
}
