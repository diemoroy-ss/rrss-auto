import { NextResponse } from "next/server";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { adminDb } from "../../../../lib/firebase-admin";

export async function POST(req: Request) {
  try {
    // 1. Obtener los parámetros de la URL (si es una notificación clásica IPN) o del body (Webhooks)
    const url = new URL(req.url);
    const dataId = url.searchParams.get("data.id") || url.searchParams.get("id");
    
    // Intentar leer el body por si viene en formato Webhook moderno
    let body: any = {};
    try {
        body = await req.json();
    } catch(e) {}

    const paymentId = body?.data?.id || dataId;

    if (!paymentId) {
        // MP hace pings de confirmación, devolvemos 200 siempre.
        return NextResponse.json({ message: "No payment ID provided." }, { status: 200 });
    }

    // 2. Configurar SDK con el token correcto
    const isTest = process.env.NEXT_PUBLIC_MP_ENV !== "prod";
    const accessToken = isTest 
        ? process.env.MP_ACCESS_TOKEN_TEST 
        : process.env.MP_ACCESS_TOKEN_PROD;

    if (!accessToken) {
        console.error("Webhook: MP_ACCESS_TOKEN faltante.");
        return new NextResponse("Server Configuration Error", { status: 500 });
    }

    const client = new MercadoPagoConfig({ accessToken, options: { timeout: 5000 } });
    const payment = new Payment(client);

    // 3. Consultar a Mercado Pago el estado real del pago para evitar fraudes
    const paymentData = await payment.get({ id: paymentId });

    if (!paymentData) {
        return new NextResponse("Payment not found", { status: 404 });
    }

    // 4. Procesar el pago
    if (paymentData.status === "approved") {
        const userId = paymentData.external_reference;
        const items = paymentData.additional_info?.items;
        
        if (userId && items && items.length > 0) {
            const planId = items[0].id; // "pro" o "elite"

            if (adminDb) {
                await adminDb.collection("users").doc(userId).update({
                    plan: planId,
                    lastPaymentDate: new Date().toISOString(),
                    mpPaymentId: paymentData.id
                });
                console.log(`Webhook: Cuenta ${userId} actualizada a plan ${planId}`);
            } else {
                console.error("Webhook: Firebase Admin no está inicializado.");
            }
        }
    }

    // Siempre responder HTTP 200 a Mercado Pago para que dejen de reintentar
    return NextResponse.json({ success: true }, { status: 200 });
    
  } catch (error) {
    console.error("Webhook Mercado Pago Error:", error);
    // MP espera un 200 incluso si hay errores internos parsados mal, o reintentará infinitamente.
    return NextResponse.json({ error: "Internal Error handled" }, { status: 200 });
  }
}
