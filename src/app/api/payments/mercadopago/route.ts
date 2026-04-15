import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";

export async function POST(req: Request) {
  try {
    const { planId, userId } = await req.json();

    if (!planId || !userId) {
      return NextResponse.json({ error: "Missing planId or userId" }, { status: 400 });
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
        price = 11990; // CLP
    } else if (planId === "elite") {
        title = "Suscripción ELITE - Santisoft";
        price = 24990; // CLP
    } else {
        return NextResponse.json({ error: "Plan inválido" }, { status: 400 });
    }

    // Construir URLs de Retorno. Se asume q la app corre en prod bajo un dominio o localhost.
    // Usaremos el origen del request para la URL dinámica
    const origin = req.headers.get("origin") || "http://localhost:3001";
    
    // Configurar la Preferencia
    const preference = new Preference(client);
    
    // Notification URL requires an internet-accessible domain. 
    // In dev, Mercado Pago won't be able to reach localhost for webhooks.
    // We will append a fake notification_url if on localhost to prevent errors, 
    // but the user needs a tunneling service like ngrok to test webhooks fully, OR test in prod.
    const baseUrl = origin.includes("localhost") ? "https://api.santisoft.cl" : origin;

    const body = {
        items: [
            {
                id: planId,
                title: title,
                quantity: 1,
                unit_price: price,
                currency_id: "CLP",
                description: `Upgrade de cuenta a ${planId.toUpperCase()} - Usuario: ${userId}`
            }
        ],
        back_urls: {
            success: `${origin}/automatizacion-rrss/panel/planes/exito`,
            failure: `${origin}/automatizacion-rrss/panel/planes/error`,
            pending: `${origin}/automatizacion-rrss/panel/planes/error`
        },
        auto_return: "approved" as const,
        external_reference: userId, // Esencial: Guardamos el UID para que el webhook sepa a quién subir el plan
        notification_url: `${baseUrl}/api/webhooks/mercadopago` 
    };

    const response = await preference.create({ body });

    // Si estamos en entorno de prueba, usar sandbox_init_point, caso contrario init_point
    const checkoutUrl = isTest ? response.sandbox_init_point : response.init_point;

    return NextResponse.json({ url: checkoutUrl });

  } catch (error: any) {
    console.error("Error al generar pago con Mercado Pago:", error);
    return NextResponse.json({ error: "Fallo al generar orden de pago" }, { status: 500 });
  }
}
