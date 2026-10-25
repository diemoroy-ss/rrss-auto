import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment, PreApproval } from "mercadopago";
import { adminDb } from "../../../../lib/firebase-admin";
import { normalizePlanId, PlanId } from "../../../../lib/plans";

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
                    description: paymentData.description || "Pago SocialPilot"
                });

                // 2. Determinar el plan adquirido de manera precisa
                const rawPlan = paymentData.metadata?.plan_id || 
                                (paymentData.additional_info?.items?.[0] as any)?.id ||
                                paymentData.description;

                let detectedPlan: PlanId = 'esencial';
                if (rawPlan) {
                  const clean = String(rawPlan).toLowerCase();
                  if (clean.includes('piloto') || clean.includes('automatico') || clean.includes('business') || clean.includes('agency')) {
                    detectedPlan = 'piloto_automatico';
                  } else if (clean.includes('crecimiento') || clean.includes('growth') || clean.includes('pro')) {
                    detectedPlan = 'crecimiento';
                  } else if (clean.includes('esencial') || clean.includes('starter')) {
                    detectedPlan = 'esencial';
                  } else {
                    detectedPlan = normalizePlanId(clean);
                  }
                } else if (amount) {
                  if (amount >= 200000) detectedPlan = 'piloto_automatico';
                  else if (amount >= 80000) detectedPlan = 'crecimiento';
                  else detectedPlan = 'esencial';
                }

                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + 32); // 1 mes + 2 días de gracia

                // 3. Actualizar datos del usuario
                await adminDb.collection("users").doc(userId).update({
                    plan: detectedPlan,
                    subscriptionStatus: "active",
                    lastPaymentDate: new Date().toISOString(),
                    planExpiry: expiryDate.toISOString()
                });

                console.log(`Webhook: Pago aprobado para usuario ${userId} por ${amount}. Plan asignado: ${detectedPlan}`);
            }
        }
    }

    // CASO 2: Es un evento de Suscripción (PreApproval)
    if (type === "preapproval") {
        const preApproval = new PreApproval(client);
        const paData = await preApproval.get({ id: paymentId });

        if (paData) {
            const userId = paData.external_reference;
            const planName = (paData.reason || '').toLowerCase();

            if (userId && adminDb) {
                if (paData.status === "authorized") {
                    let detectedPlan: PlanId = 'esencial';
                    if (planName.includes('piloto') || planName.includes('automatico') || planName.includes('business') || planName.includes('agency')) {
                        detectedPlan = 'piloto_automatico';
                    } else if (planName.includes('crecimiento') || planName.includes('growth') || planName.includes('pro')) {
                        detectedPlan = 'crecimiento';
                    } else if (planName.includes('esencial') || planName.includes('starter')) {
                        detectedPlan = 'esencial';
                    } else {
                        detectedPlan = normalizePlanId(planName);
                    }

                    const expiryDate = new Date();
                    expiryDate.setDate(expiryDate.getDate() + 32);

                    await adminDb.collection("users").doc(userId).update({
                        plan: detectedPlan,
                        subscriptionId: paData.id,
                        subscriptionStatus: paData.status,
                        lastPaymentDate: new Date().toISOString(),
                        planExpiry: expiryDate.toISOString()
                    });
                    
                    console.log(`Webhook: Suscripción ${paData.id} autorizada para usuario ${userId} (${detectedPlan})`);
                } else if (paData.status === "cancelled" || paData.status === "paused") {
                    await adminDb.collection("users").doc(userId).update({
                        subscriptionStatus: paData.status,
                    });
                    console.log(`Webhook: Suscripción ${paData.id} marcada como ${paData.status} para usuario ${userId}`);
                }
            }
        }
    }

    return NextResponse.json({ success: true }, { status: 200 });
    
  } catch (error) {
    console.error("Webhook Mercado Pago Error:", error);
    return NextResponse.json({ error: "Internal Error handled" }, { status: 200 });
  }
}
