import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  console.log(`[STATUS ROUTE] Recibiendo peticion GET: ${req.url}`);
  const { searchParams } = new URL(req.url);
  const ticketId = searchParams.get("ticketId");

  if (!ticketId) {
    console.warn("[STATUS ROUTE] Faltó el ticketId en la query param");
    return NextResponse.json({ error: "ticketId requerido" }, { status: 400 });
  }

  try {
    console.log(`[STATUS ROUTE] Consultando n8n banner-ia-status para ticket: ${ticketId}`);
    // AHORA n8n espera un GET con el ticketId en la query param
    const n8nResp = await fetch(
      `https://n8n.santisoft.cl/webhook/banner-ia-status?ticketId=${ticketId}`,
      { method: "GET" }
    );

    console.log(`[STATUS ROUTE] n8n respondio con HTTP ${n8nResp.status}`);


    if (!n8nResp.ok) {
      const errText = await n8nResp.text().catch(() => "");
      console.error(`[STATUS ROUTE] n8n error payload: ${errText}`);
      
      // Si n8n responde 404, el webhook no existe o está apagado. Detenemos el polling.
      if (n8nResp.status === 404) {
        return NextResponse.json({ status: "error", error: "El webhook n8n banner-ia-status no está activo (Error 404)." }, { status: 404 });
      }

      return NextResponse.json({ status: "pending", _debug: `n8n_http_${n8nResp.status}` });
    }

    const rawData = await n8nResp.json();
    console.log(`[STATUS ROUTE] n8n response data: ${JSON.stringify(rawData)}`);

    // n8n often returns an array [ { ... } ], we want just the object
    const data = Array.isArray(rawData) ? rawData[0] : rawData;

    // Try to find ANY image URL key (finalUrl is the preferred one here)
    const imageUrl = data?.finalUrl || data?.final_url || data?.imageUrl || data?.image_url || data?.url;

    const normalizedData = {
      ...data,
      finalUrl: imageUrl // Map it to finalUrl for the frontend logic
    };

    return NextResponse.json(normalizedData);
  } catch (err: any) {
    console.error("[STATUS ROUTE] Fetch a n8n fallo:", err.message);
    return NextResponse.json({ status: "pending", _debug: err.message });
  }
}



