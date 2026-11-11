import { NextResponse } from "next/server";
import { MercadoPagoConfig, PreApproval, Preference } from "mercadopago";
import { normalizePlanId, PLAN_CONFIGS } from "../../../../lib/plans";

export async function POST(req: Request) {
  try {
    const { planId, userId, userEmail, isAnnual, annualBillingType = "single" } = await req.json();

    if (!planId || !userId || !userEmail) {
      return NextResponse.json({ error: "Missing planId, userId or userEmail" }, { status: 400 });
    }

    const normalizedPlan = normalizePlanId(planId);
    if (normalizedPlan === "free") {
      return NextResponse.json({ error: "Plan inválido para suscripción pago" }, { status: 400 });
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

    // 2. Fetch Price and Title from Firestore (con fallback a PLAN_CONFIGS oficial)
    const { adminDb } = await import("../../../../lib/firebase-admin");
    let dbPlanConfig: any = null;
    if (adminDb) {
      const plansSnap = await adminDb.collection("system_config").doc("plans").get();
      if (plansSnap.exists) {
        const plansData = plansSnap.data();
        dbPlanConfig = plansData?.[normalizedPlan] || plansData?.[planId] || null;
      }
    }

    const fallbackStatic = PLAN_CONFIGS[normalizedPlan];
    const basePrice = dbPlanConfig?.price || fallbackStatic.priceClp;
    const baseAnnualPrice = dbPlanConfig?.annualPrice || Math.round(basePrice * 12 * 0.9);
    const planName = dbPlanConfig?.name || fallbackStatic.name;

    let price = basePrice;
    let frequency = 1;
    let titleSuffix = "(Mensual · IVA incluido)";

    if (isAnnual) {
      if (annualBillingType === "monthly_discount") {
        // Opción A: Cobro mensual con descuento por compromiso anual
        const fullAnnual = baseAnnualPrice > 0 ? baseAnnualPrice : Math.round((basePrice * 12) * 0.9);
        price = Math.round(fullAnnual / 12);
        frequency = 1; // cobro mensual
        titleSuffix = "(Anual - Cobro Mensual Descontado · IVA incluido)";
      } else {
        // Opción B: Cobro único anual completo
        price = baseAnnualPrice > 0 ? baseAnnualPrice : Math.round((basePrice * 12) * 0.9);
        frequency = 12; // cobro anual
        titleSuffix = "(Anual - Pago Único · IVA incluido)";
      }
    }

    const title = `Suscripción SocialPilot ${planName} ${titleSuffix} - Santisoft`;

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
                    id: normalizedPlan,
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
                failure: `${origin}/automatizacion-rrss/panel/planes/error`,
                pending: `${origin}/automatizacion-rrss/panel/planes`
            },
            auto_return: "approved",
            notification_url: `${origin}/api/webhooks/mercadopago`,
            external_reference: `${userId}|${normalizedPlan}|annual_single`,
            metadata: {
                user_id: userId,
                plan_id: normalizedPlan,
                billing_type: "annual_single"
            }
        };

        console.log("Enviando body a Mercado Pago Preference (Pago Único Anual):", JSON.stringify(body, null, 2));
        const response: any = await preference.create({ body });
        const checkoutUrl = response.init_point || response.sandbox_init_point;
        return NextResponse.json({ url: checkoutUrl });
    } else {
        const preApproval = new PreApproval(client);
        const billingTag = isAnnual ? 'annual_monthly' : 'monthly';
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
            notification_url: `${origin}/api/webhooks/mercadopago`,
            external_reference: `${userId}|${normalizedPlan}|${billingTag}`
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
