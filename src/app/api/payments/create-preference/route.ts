import { NextResponse } from "next/server";
import { MercadoPagoConfig, Preference } from "mercadopago";

export async function POST(req: Request) {
  try {
    const { planId, userId, userEmail } = await req.json();

    if (!planId || !userId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
        console.error("Missing MP_ACCESS_TOKEN in env");
        return NextResponse.json({ error: "Configuration error" }, { status: 500 });
    }

    // Configure Mercado Pago
    const client = new MercadoPagoConfig({ accessToken, options: { timeout: 5000 } });
    const preference = new Preference(client);

    // Map plan IDs to prices and titles
    let title = "";
    let unitPrice = 0;

    if (planId === "pro") {
      title = "Suscripción Santisoft Pro";
      unitPrice = 19990;
    } else if (planId === "elite") {
      title = "Suscripción Santisoft Elite";
      unitPrice = 49990;
    } else {
      return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
    }

    // El base url en producción debería ser automatizacion.santisoft.cl
    // En local es el origen de la request o hardcodeado para pruebas.
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";

    const body = {
      items: [
        {
          id: planId,
          title: title,
          quantity: 1,
          unit_price: unitPrice,
          currency_id: "CLP",
        },
      ],
      payer: {
        email: userEmail || "usuario@ejemplo.com",
      },
      back_urls: {
        success: `${baseUrl}/automatizacion-rrss/panel?payment=success`,
        failure: `${baseUrl}/automatizacion-rrss/panel/planes?payment=failure`,
        pending: `${baseUrl}/automatizacion-rrss/panel/planes?payment=pending`,
      },
      auto_return: "approved" as "approved" | "all" | undefined,
      external_reference: userId, // Pasamos el uid del usuario como referencia
      metadata: {
        user_id: userId,
        plan_id: planId
      }
    };

    const result = await preference.create({ body });

    // init_point es la URL a la que debemos redirigir al usuario para pagar
    return NextResponse.json({ initPoint: result.init_point });
    
  } catch (error) {
    console.error("Error creating preference:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
