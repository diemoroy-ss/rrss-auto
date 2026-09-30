import { NextResponse } from "next/server";
import { adminDb } from "../../../../../lib/firebase-admin";

const EVOLUTION_URL = process.env.NEXT_PUBLIC_EVOLUTION_URL || "https://evoapi.grupofugas.cl";
const EVOLUTION_INSTANCE = process.env.NEXT_PUBLIC_EVOLUTION_INSTANCE || "Santisoft";
const EVOLUTION_API_KEY = process.env.NEXT_PUBLIC_EVOLUTION_API_KEY || "6833CC358FA4-42E4-8F45-E74D35CC85A7";
const N8N_EVOAPI_WEBHOOK_URL = "https://n8n.santisoft.cl/webhook/evoapi";
const PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://rrss.santisoft.cl";

/**
 * POST /api/tasks/muestras/followup
 * Invocado de forma segura y automatizada por Google Cloud Tasks a las 48 horas exactas
 * de haber enviado una muestra, siempre y cuando el cliente NO haya abierto el enlace.
 */
export async function POST(req: Request) {
  try {
    // 1. Validación de seguridad con clave interna (CRON_SECRET)
    const authHeader = req.headers.get("Authorization");
    const expectedAuth = `Bearer ${process.env.CRON_SECRET || "santisoft-n8n-cron-key-123"}`;

    if (authHeader !== expectedAuth) {
      console.error("[GCP FOLLOWUP MUESTRA] Intento no autorizado de ejecución");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { demoId } = body;

    if (!demoId) {
      return NextResponse.json({ error: "No se proporcionó demoId" }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: "DB no disponible" }, { status: 500 });
    }

    console.log(`[GCP FOLLOWUP MUESTRA] Verificando ejecución de seguimiento a 48h para demo ${demoId}`);

    const demoRef = adminDb.collection("admin_prospect_demos").doc(demoId);
    const snap = await demoRef.get();

    if (!snap.exists) {
      console.log(`[GCP FOLLOWUP MUESTRA] Muestra ${demoId} no encontrada. Abortando.`);
      return NextResponse.json({ ok: false, message: "Muestra no encontrada" });
    }

    const data = snap.data() || {};

    // 2. Condición 1: ¿El cliente ya abrió la propuesta?
    if ((data.viewCount || 0) > 0) {
      console.log(`[GCP FOLLOWUP MUESTRA] Omitido: El prospecto ya abrió la landing (${data.viewCount} visitas).`);
      await demoRef.update({ gcpFollowUpTaskName: null });
      return NextResponse.json({ ok: true, skipped: true, reason: "cliente_ya_abrio_la_muestra" });
    }

    // 3. Condición 2: ¿La muestra fue cerrada, rechazada o descartada?
    if (data.outcome === "cerrado" || data.outcome === "descartado") {
      console.log(`[GCP FOLLOWUP MUESTRA] Omitido: El lead está en estado '${data.outcome}'.`);
      await demoRef.update({ gcpFollowUpTaskName: null });
      return NextResponse.json({ ok: true, skipped: true, reason: "lead_cerrado_o_descartado" });
    }

    // 4. Condición 3: ¿El vendedor ya hizo un seguimiento manual?
    if (data.followUpCount && data.followUpCount > 0) {
      console.log(`[GCP FOLLOWUP MUESTRA] Omitido: Ya se realizó un seguimiento previo.`);
      await demoRef.update({ gcpFollowUpTaskName: null });
      return NextResponse.json({ ok: true, skipped: true, reason: "seguimiento_manual_previo" });
    }

    // 5. Validar número de teléfono
    const rawPhone = data.prospectPhone || "";
    const cleanPhone = rawPhone.replace(/[\s\-\(\)\+]/g, "").replace(/^0+/, "");

    if (!cleanPhone) {
      console.warn(`[GCP FOLLOWUP MUESTRA] Omitido: Teléfono no válido para demo ${demoId}`);
      await demoRef.update({ gcpFollowUpTaskName: null });
      return NextResponse.json({ ok: false, reason: "telefono_invalido" });
    }

    // 6. Construir mensaje de seguimiento 100% humanizado ("nuestros agentes", cero muletillas)
    const pName = data.prospectName?.trim() ? `¡Hola ${data.prospectName.trim()}!` : "¡Hola!";
    const pBusiness = data.prospectBusiness?.trim() ? ` para ${data.prospectBusiness.trim()}` : "";
    const demoLink = `${PUBLIC_APP_URL}/m/${demoId}`;

    const followUpMessage = `${pName} 👋 Te compartí hace unos días la propuesta visual que prepararon nuestros agentes${pBusiness}.

Te vuelvo a dejar el enlace directo para que puedas revisarla en 1 minuto cuando tengas un momento libre:
${demoLink}

Avísame si pudiste verla o si tienes alguna duda para que coordinemos los siguientes pasos.`;

    console.log(`[GCP FOLLOWUP MUESTRA] Disparando seguimiento automático a WhatsApp +${cleanPhone}`);

    // 7. Enviar vía Evolution API
    let delivered = false;
    try {
      const evoRes = await fetch(`${EVOLUTION_URL}/message/sendText/${EVOLUTION_INSTANCE}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          apikey: EVOLUTION_API_KEY,
        },
        body: JSON.stringify({
          number: cleanPhone,
          text: followUpMessage,
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (evoRes.ok) {
        delivered = true;
        console.log(`[GCP FOLLOWUP MUESTRA] ✅ Entregado vía Evolution API`);
      } else {
        const errText = await evoRes.text().catch(() => "");
        console.warn(`[GCP FOLLOWUP MUESTRA] Evolution API respondió ${evoRes.status}: ${errText}`);
      }
    } catch (e: any) {
      console.warn(`[GCP FOLLOWUP MUESTRA] Error en llamada a Evolution API:`, e.message);
    }

    // 8. Notificación complementaria directa a webhook n8n
    fetch(N8N_EVOAPI_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        phone: cleanPhone,
        number: cleanPhone,
        text: followUpMessage,
        demoId,
        demoUrl: demoLink,
        isAutoFollowUp: true,
        deliveredMode: "gcp_cloud_tasks_48h",
        timestamp: new Date().toISOString(),
      }),
      signal: AbortSignal.timeout(4000),
    }).catch(() => {});

    // 9. Actualizar estado en Firestore
    const nowIso = new Date().toISOString();
    const newFollowUpCount = (data.followUpCount || 0) + 1;

    await demoRef.update({
      lastFollowUpAt: nowIso,
      followUpCount: newFollowUpCount,
      autoFollowUpSent: true,
      gcpFollowUpTaskName: null,
    });

    return NextResponse.json({
      success: true,
      delivered,
      demoId,
      phone: cleanPhone,
      timestamp: nowIso,
    });
  } catch (err: any) {
    console.error("[GCP FOLLOWUP MUESTRA ERROR]:", err);
    return NextResponse.json({ error: err.message || "Error interno del servidor" }, { status: 500 });
  }
}
