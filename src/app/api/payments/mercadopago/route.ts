import { NextResponse } from "next/server";
import { MercadoPagoConfig, PreApproval, Preference } from "mercadopago";

export async function POST(req: Request) {
  try {
    const { planId, userId, userEmail, isAnnual, annualBillingType = "single" } = await req.json();

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

    let price = planConfig.price;
    let frequency = 1;
    let titleSuffix = "(Mensual)";

    if (isAnnual) {
      if (annualBillingType === "monthly_discount") {
        // Opción A: Cobro mensual con descuento por compromiso anual
        const fullAnnual = planConfig.annualPrice > 0 ? planConfig.annualPrice : Math.round((planConfig.price * 12) * 0.84);
        price = Math.round(fullAnnual / 12);
        frequency = 1; // cobro mensual
        titleSuffix = "(Anual - Cobro Mensual Descontado)";
      } else {
        // Opción B: Cobro único anual completo
        price = planConfig.annualPrice > 0 ? planConfig.annualPrice : Math.round((planConfig.price * 12) * 0.84);
        frequency = 12; // cobro anual
        titleSuffix = "(Anual - Pago Único)";
      }
    }

    const title = `Suscripción SocialPilot ${planConfig.name} ${titleSuffix} - Santisoft`;

    // Configurar SDK
    const client = new MercadoPagoConfig({ accessToken, options: { timeout: 5000 } });

    // Construir URLs de Retorno (Mercado Pago requiere HTTPS en back_url para PreApprovals)
    const rawOrigin = req.headers.get("origin") || req.headers.get("referer") || "https://rrss.santisoft.cl";
    let origin = rawOrigin;
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      origin = process.env.NEXT_PUBLIC_APP_URL || "https://rrss.santisoft.cl";
    }
    
    if (isAnnual && annualBillingType === 'single') {
        const preference = new Preference(client);
        const body: any = {
            items: [
                {
                    id: planId,
                    title: title.substring(0, 256),
                    quantity: 1,
                    unit_price: Number(price),
                    currency_id: "CLP"
                }
            ],
            payer: {
                email: userEmail.trim()
            },
            back_urls: {
                success: `${origin}/automatizacion-rrss/panel/planes/exito`,
                failure: `${origin}/automatizacion-rrss/panel/planes`,
                pending: `${origin}/automatizacion-rrss/panel/planes`
            },
            auto_return: "approved",
            external_reference: `${userId}_annual_single`
        };

        console.log("Enviando body a Mercado Pago Preference (Pago Único Anual):", JSON.stringify(body, null, 2));
        const response: any = await preference.create({ body });
        const checkoutUrl = response.init_point || response.sandbox_init_point;
        return NextResponse.json({ url: checkoutUrl });
    } else {
        const preApproval = new PreApproval(client);
        const body: any = {
            reason: title.substring(0, 60), // Límite de 60 caracteres en Mercado Pago para PreApproval
            auto_recurring: {
                frequency: Number(frequency),
                frequency_type: "months",
                transaction_amount: Number(price),
                currency_id: "CLP"
            },
            payer_email: userEmail.trim(),
            back_url: `${origin}/automatizacion-rrss/panel/planes/exito`,
            external_reference: `${userId}_${isAnnual ? 'annual_monthly' : 'monthly'}`
        };

        console.log("Enviando body a Mercado Pago PreApproval:", JSON.stringify(body, null, 2));
        const response: any = await preApproval.create({ body });
        const checkoutUrl = response.init_point || response.sandbox_init_point;
        return NextResponse.json({ url: checkoutUrl });
    }

  } catch (error: any) {
    console.error("Error al generar suscripción con Mercado Pago:", error);
    const errorMsg = error.message || (error.cause && error.cause.message) || JSON.stringify(error);
    return NextResponse.json({ error: `Fallo al generar orden de suscripción: ${errorMsg}` }, { status: 500 });
  }
}
