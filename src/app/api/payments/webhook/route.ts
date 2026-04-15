import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { adminDb } from "../../../../lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("data.id") || url.searchParams.get("id");
    const type = url.searchParams.get("type");

    // MP envía datos diferentes dependiendo del evento, usualmente buscamos el payment
    const paymentId = action || req.headers.get("x-signature") ? null : "pending-logic";

    // En muchas integraciones webhook de MP, el body viene como un objeto con: { type: "payment", data: { id: "123" } }
    // O vía webhook event.
    let body;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    console.log("Webhook MP recibido:", body);

    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
        return NextResponse.json({ error: "Config error" }, { status: 500 });
    }

    if (body.type === "payment" || body.topic === "payment") {
        const pId = body.data?.id || action;
        
        if (pId) {
            const client = new MercadoPagoConfig({ accessToken });
            const payment = new Payment(client);
            
            const paymentInfo = await payment.get({ id: pId });
            
            if (paymentInfo.status === "approved") {
                const userId = paymentInfo.external_reference;
                const planId = paymentInfo.metadata?.plan_id || paymentInfo.additional_info?.items?.[0]?.id;
                
                if (userId && planId) {
                    console.log(`Pago aprobado para usuario ${userId}, plan ${planId}`);
                    // Actualizar en Firebase Admin
                    // Usaremos un mock de admin momentáneo o importaremos app-admin
                    if (adminDb) {
                        const now = new Date();
                        const nextMonth = new Date(now.setMonth(now.getMonth() + 1));
                        
                        await adminDb.collection("users").doc(userId).update({
                            plan: planId,
                            planExpiry: nextMonth,
                            updatedAt: new Date()
                        });
                        console.log("Firestore actualizado vía admin.");
                    } else {
                        console.error("No adminDb configured. Could not update user.");
                    }
                }
            }
        }
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error("Error validando webhook MP:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
