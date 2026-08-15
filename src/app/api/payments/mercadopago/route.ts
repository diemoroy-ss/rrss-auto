import { NextResponse } from "next/server";
import { MercadoPagoConfig, PreApproval } from "mercadopago";

export async function POST(req: Request) {
  try {
    const { planId, userId, userEmail, isAnnual } = await req.json();

    if (!planId || !userId || !userEmail) {
      return NextResponse.json({ error: "Missing planId, userId or userEmail" }, { status: 400 });
    }

    // Determinar Entorno y Llaves
    const isTest = process.env.NEXT_PUBLIC_MP_ENV !== "prod";
    const accessToken = isTest 
        ? process.env.MP_ACCESS_TOKEN_TEST 
        : process.env.MP_ACCESS_TOKEN_PROD;

    if (!accessToken) {
        console.error("Falta el MP_ACCESS_TOKEN. Revisa las variables de entorno.");
        return NextResponse.json({ error: "Configuración de pasarela incompleta" }, { status: 500 });
    }

    // 2. Fetch Price and Title from Firestore
    const { adminDb } = await import("../../../../lib/firebase-admin");
    if (!adminDb) {
        return NextResponse.json({ error: "Database not available" }, { status: 500 });
    }

    const plansSnap = await adminDb.collection("system_config").doc("plans").get();
    if (!plansSnap.exists) {
        return NextResponse.json({ error: "Planes no configurados" }, { status: 500 });
    }

    const plansData = plansSnap.data();
    const planConfig = plansData ? plansData[planId] : null;

    if (!planConfig || planId === 'free') {
        return NextResponse.json({ error: "Plan inválido para suscripción pago" }, { status: 400 });
    }

    const title = `Suscripción ${planConfig.name} ${isAnnual ? '(Anual)' : '(Mensual)'} - Santisoft`;
    const price = isAnnual && planConfig.annualPrice ? planConfig.annualPrice : planConfig.price;

    // Configurar SDK
    const client = new MercadoPagoConfig({ accessToken, options: { timeout: 5000 } });

    // Construir URLs de Retorno
    const origin = req.headers.get("origin") || "https://rrss.santisoft.cl";
    
    // Configurar la Suscripción (PreApproval)
    const preApproval = new PreApproval(client);
    
    // No hay período de prueba, cobro inmediato mensual
    const body = {
        reason: title,
        auto_recurring: {
            frequency: isAnnual ? 12 : 1,
            frequency_type: "months",
            transaction_amount: price,
            currency_id: "CLP"
        },
        payer_email: userEmail,
        back_url: `${origin}/automatizacion-rrss/panel/planes/exito`,
        external_reference: `${userId}_${isAnnual ? 'annual' : 'monthly'}`, // UID y periodo para el webhook
        status: "authorized"
    };

    const response: any = await preApproval.create({ body });

    // La URL de pago para suscripciones se encuentra en init_point o sandbox_init_point
    const checkoutUrl = isTest ? response.sandbox_init_point : response.init_point;

    return NextResponse.json({ url: checkoutUrl });

  } catch (error: any) {
    console.error("Error al generar suscripción con Mercado Pago:", error);
    const errorMsg = error.message || (error.cause && error.cause.message) || JSON.stringify(error);
    return NextResponse.json({ error: `Fallo al generar orden de suscripción: ${errorMsg}` }, { status: 500 });
  }
}
