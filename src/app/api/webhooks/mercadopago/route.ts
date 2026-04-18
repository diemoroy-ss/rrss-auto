import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment, PreApproval } from "mercadopago";
import { adminDb } from "../../../../lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const dataId = url.searchParams.get("data.id") || url.searchParams.get("id");
    
    let body: any = {};
    try {
        body = await req.json();
    } catch(e) {}

    // El tipo de notificación puede venir en el body (webhook) o query param (IPN)
    const type = body?.type || url.searchParams.get("type");
    const paymentId = body?.data?.id || dataId;

    if (!paymentId) {
        return NextResponse.json({ message: "No payment/preapproval ID provided." }, { status: 200 });
    }

    const isTest = process.env.NEXT_PUBLIC_MP_ENV !== "prod";
    const accessToken = isTest 
        ? process.env.MP_ACCESS_TOKEN_TEST 
        : process.env.MP_ACCESS_TOKEN_PROD;

    if (!accessToken) {
        console.error("Webhook: MP_ACCESS_TOKEN faltante.");
        return new NextResponse("Server Configuration Error", { status: 500 });
    }

    const client = new MercadoPagoConfig({ accessToken, options: { timeout: 5000 } });

    // CASO 1: Es un Cobro Efectivo (Pago Único o Cuota de Suscripción)
    if (type === "payment" || !type) {
        const payment = new Payment(client);
        const paymentData = await payment.get({ id: paymentId });

        if (paymentData && paymentData.status === "approved") {
            const userId = paymentData.external_reference;
            const amount = paymentData.transaction_amount;
            const status = paymentData.status;
            
            // Si viene de una suscripción, a veces el external_reference está en la suscripción madre
            // pero Mercado Pago suele propagarlo.
            
            if (userId && adminDb) {
                // 1. Guardar en historial de pagos
                await adminDb.collection("payments").add({
                    userId,
                    paymentId: paymentData.id,
                    amount,
                    currency: paymentData.currency_id,
                    status,
                    date: new Date().toISOString(),
                    type: "payment",
                    description: paymentData.description || "Pago Santisoft"
                });

                // 2. Actualizar plan del usuario (si no es free)
                // Nota: El planId suele venir en items[0].id si es Preference, 
                // o en la descripción si lo parseamos. 
                // Para simplificar, si es un pago aprobado, mantenemos el plan que el usuario eligió.
                console.log(`Webhook: Pago aprobado para usuario ${userId} por ${amount}`);
            }
        }
    }

    // CASO 2: Es un evento de Suscripción (PreApproval)
    if (type === "preapproval") {
        const preApproval = new PreApproval(client);
        const paData = await preApproval.get({ id: paymentId });

        if (paData && paData.status === "authorized") {
            const userId = paData.external_reference;
            const planName = paData.reason; // Ej: "Suscripción PRO - Santisoft"
            
            if (userId && adminDb) {
                let planId = "free";
                if (planName?.includes("PRO")) planId = "pro";
                else if (planName?.includes("ELITE")) planId = "elite";
                else if (planName?.includes("BUSINESS")) planId = "business";

                await adminDb.collection("users").doc(userId).update({
                    plan: planId,
                    subscriptionId: paData.id,
                    subscriptionStatus: paData.status,
                    lastPaymentDate: new Date().toISOString()
                });
                
                console.log(`Webhook: Suscripción ${paData.id} autorizada para usuario ${userId} (${planId})`);
            }
        }
    }

    return NextResponse.json({ success: true }, { status: 200 });
    
  } catch (error) {
    console.error("Webhook Mercado Pago Error:", error);
    return NextResponse.json({ error: "Internal Error handled" }, { status: 200 });
  }
}
