import { NextResponse } from "next/server";
import { adminDb } from "../../../../../../lib/firebase-admin";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

/**
 * POST /api/public/muestras/[id]/view
 * Registra una vista del prospecto en la landing de muestra.
 * No requiere autenticación — es pública.
 * Incrementa viewCount, registra timestamps y metadata del dispositivo.
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const demoId = params?.id;
    if (!demoId) {
      return NextResponse.json({ error: "Falta id" }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ ok: false });
    }

    const headersList = headers();
    const userAgent = headersList.get("user-agent") || "unknown";
    const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);
    const device = isMobile ? "mobile" : "desktop";
    const now = new Date().toISOString();

    const { FieldValue } = await import("firebase-admin/firestore");
    const demoRef = adminDb.collection("admin_prospect_demos").doc(demoId);

    // Verificar que existe antes de actualizar
    const snap = await demoRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Muestra no encontrada" }, { status: 404 });
    }

    const data = snap.data() || {};

    // Merge de la vista: incrementar contador, guardar primera vista si no existe
    const updatePayload: Record<string, any> = {
      viewCount: FieldValue.increment(1),
      lastViewedAt: now,
      lastViewDevice: device,
    };

    // Registrar la primera vez que se abre
    if (!data.firstViewedAt) {
      updatePayload.firstViewedAt = now;
      updatePayload.firstViewDevice = device;
    }

    // CANCELACIÓN EN GOOGLE CLOUD TASKS:
    // Si existía una tarea programada a 48h, se elimina inmediatamente porque el cliente ya abrió la propuesta
    if (data.gcpFollowUpTaskName) {
      try {
        const { deletePostTask } = await import("../../../../../../lib/gcp-tasks");
        await deletePostTask(data.gcpFollowUpTaskName);
        console.log(`[VIEW MUESTRA] Tarea de seguimiento automático cancelada en Cloud Tasks: ${data.gcpFollowUpTaskName}`);
      } catch (taskErr) {
        console.warn("[VIEW MUESTRA] Error al cancelar tarea de Cloud Tasks:", taskErr);
      }
      updatePayload.gcpFollowUpTaskName = null;
    }

    await demoRef.update(updatePayload);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[API View Muestra Error]:", err);
    // Nunca fallar visiblemente ante el prospecto
    return NextResponse.json({ ok: false });
  }
}
