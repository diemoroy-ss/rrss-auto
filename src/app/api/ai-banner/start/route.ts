import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    console.log("[START ROUTE] Recibiendo peticion POST");
    const body = await req.json();
    const ticketId = body.ticketId;
    console.log("[START ROUTE] Body parseado, ticketId:", ticketId);

    // Disparar la peticion a n8n SIN esperar su respuesta (fire-and-forget)
    console.log("[START ROUTE] Disparando fetch a n8n banner-ia en background...");
    console.log(`[START ROUTE] Enviando a n8n banner-ia para ticket: ${ticketId}`);
    
    // Cambiado a URL de producción
    const n8nUrl = "https://n8n.santisoft.cl/webhook/banner-ia";

    fetch(n8nUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ticketId,
        baseImageUrl: body.baseImageUrl,
        userId: body.userId,
        
        // Enviamos los textos como un array para el futuro, 
        // pero mantenemos compatibilidad con el flujo actual de n8n
        textLayers: body.textLayers || [
          {
            text: body.overlayText,
            color: body.overlayColor,
            font: body.overlayFont,
            size: body.overlaySize,
            x: body.textX,
            y: body.textY
          }
        ],
        
        // Mantenemos estos para no romper el flujo n8n actual si no se actualiza
        overlayText: body.overlayText,
        overlayColor: body.overlayColor,
        overlayFont: body.overlayFont,
        overlaySize: body.overlaySize,
        textX: body.textX,
        textY: body.textY,
        
        useLogo: body.useLogo,
        logoUrl: body.logoUrl,
        logoX: body.logoX,
        logoY: body.logoY,
      }),
    }).then(res => {
      console.log(`[START ROUTE] n8n background respondio con status: ${res.status}`);
    }).catch((err) => {
      console.error("[START ROUTE] n8n background error:", err);
    });

    console.log("[START ROUTE] Retornando OK al navegador de inmediato");
    return NextResponse.json({ status: "ok" });

  } catch (err: any) {
    console.error("[START ROUTE] Error crítico:", err);
    return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 });
  }
}
