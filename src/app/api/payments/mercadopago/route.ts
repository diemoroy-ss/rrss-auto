import { NextResponse } from "next/server";
import { MercadoPagoConfig, PreApproval } from "mercadopago";

export async function POST(req: Request) {
  try {
    const { planId, userId, userEmail } = await req.json();

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

    // Configurar SDK
    const client = new MercadoPagoConfig({ accessToken, options: { timeout: 5000 } });

    // Configurar Precio y Título
    let title = "";
    let price = 0;

    if (planId === "pro") {
        title = "Suscripción PRO - Santisoft";
        price = 19990; // CLP (Corregido según planes/page.tsx)
    } else if (planId === "elite") {
        title = "Suscripción ELITE - Santisoft";
        price = 49990; // CLP (Corregido según planes/page.tsx)
    } else if (planId === "business") {
        title = "Suscripción BUSINESS - Santisoft";
        price = 99990; // CLP
    } else {
        return NextResponse.json({ error: "Plan inválido para suscripción" }, { status: 400 });
    }

    // Construir URLs de Retorno
    const origin = req.headers.get("origin") || "https://rrss.santisoft.cl";
    
    // Configurar la Suscripción (PreApproval)
    const preApproval = new PreApproval(client);
    
    // No hay período de prueba, cobro inmediato mensual
    const body = {
        reason: title,
        auto_recurring: {
            frequency: 1,
            frequency_type: "months",
            transaction_amount: price,
            currency_id: "CLP"
        },
        payer_email: userEmail,
        back_url: `${origin}/automatizacion-rrss/panel/planes/exito`,
        external_reference: userId, // UID para el webhook
        status: "authorized"
    };

    const response = await preApproval.create({ body });

    // La URL de pago para suscripciones se encuentra en init_point o sandbox_init_point
    const checkoutUrl = isTest ? response.sandbox_init_point : response.init_point;

    return NextResponse.json({ url: checkoutUrl });

  } catch (error: any) {
    console.error("Error al generar suscripción con Mercado Pago:", error);
    return NextResponse.json({ error: "Fallo al generar orden de suscripción" }, { status: 500 });
  }
}
