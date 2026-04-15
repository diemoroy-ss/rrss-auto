import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    console.log("[START ROUTE] Recibiendo peticion POST");
    const body = await req.json();
    console.log("[START ROUTE] Body parseado, ticketId:", body.ticketId);

    // Disparar la peticion a n8n SIN esperar su respuesta (fire-and-forget)
    console.log("[START ROUTE] Disparando fetch a n8n banner-ia en background...");
    fetch("https://n8n.santisoft.cl/webhook/banner-ia", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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



