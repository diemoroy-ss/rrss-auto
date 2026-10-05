import { NextResponse } from "next/server";
import { adminDb } from "../../../../../lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const demoId = params?.id;
    if (!demoId) {
      return NextResponse.json({ error: "Falta id de muestra" }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: "Servicio de base de datos no disponible" }, { status: 500 });
    }

    const docSnap = await adminDb.collection("admin_prospect_demos").doc(demoId).get();
    if (!docSnap.exists) {
      return NextResponse.json({ error: "Muestra no encontrada" }, { status: 404 });
    }

    const data = docSnap.data() || {};

    let isoDate: string | null = null;
    if (data.createdAt?.toDate) {
      isoDate = data.createdAt.toDate().toISOString();
    } else if (data.createdAt instanceof Date) {
      isoDate = data.createdAt.toISOString();
    } else if (typeof data.createdAt === "string") {
      isoDate = data.createdAt;
    }

    let plans: Record<string, any> | null = null;
    try {
      const plansDoc = await adminDb.collection("system_config").doc("plans").get();
      if (plansDoc.exists) {
        plans = plansDoc.data() || null;
      }
    } catch (plansErr) {
      console.warn("[API Public Muestras] Warning loading plans config:", plansErr);
    }

    const publications = Array.isArray(data.publications) ? data.publications : [];

    // Estrategia: usar la almacenada o sintetizar una coherente si la muestra fue creada previamente
    let strategy = data.strategy || null;
    if (!strategy && publications.length > 0) {
      const defaultDays = ["Martes", "Jueves", "Viernes", "Sábado", "Domingo"];
      const defaultTimes = ["13:00 hrs", "19:30 hrs", "20:00 hrs", "21:00 hrs", "12:30 hrs"];
      const bizName = data.prospectBusiness || "Tu Negocio";
      const rubroName = data.rubro || "Comercio Local";

      strategy = {
        objective: `Posicionar a ${bizName} como referente en ${rubroName.toLowerCase()} y activar ventas directas en redes con publicaciones comerciales y de alto valor.`,
        targetAudience: `Público local interesado en ${rubroName.toLowerCase()} que busca calidad, excelente servicio y ofertas atractivas para disfrutar y compartir.`,
        toneAndVoice: "Cercano, conversacional ('tú a tú'), directo, persuasivo y sin rodeos corporativos.",
        pillars: [
          {
            name: "Ofertas & Combos Irresistibles",
            description: "Promociones y propuestas de alto valor para activar compras y pedidos inmediatos.",
            percentage: 45,
            icon: "🔥"
          },
          {
            name: "Experiencia & Calidad de Producto",
            description: "Muestra cercana de lo que hace único a tu negocio, generando confianza y antojo.",
            percentage: 35,
            icon: "✨"
          },
          {
            name: "Comunidad & Conexión con Clientes",
            description: "Preguntas, interacción y motivos para que tus clientes te elijan una y otra vez.",
            percentage: 20,
            icon: "🤝"
          }
        ],
        schedulePlan: publications.map((p: any, idx: number) => ({
          day: defaultDays[idx % defaultDays.length],
          time: defaultTimes[idx % defaultTimes.length],
          format: p.type || "post",
          objective: `Destacar ${p.dishOrProductName || p.title || bizName} y canalizar pedidos.`,
          hook: p.hook || p.title || `Publicación #${idx + 1}`,
          linkedPublicationId: p.id || `pub_${idx + 1}`
        })),
        nicheOpportunities: [
          `En el rubro de ${rubroName.toLowerCase()}, los formatos que muestran el producto de cerca y con precio claro reducen hasta un 40% las consultas vacías.`,
          "Los llamados a la acción directos hacia WhatsApp aumentan exponencialmente la tasa de cierre frente a links web tradicionales.",
          "Mantener constancia semanal con nuestros agentes posiciona a tu negocio por encima de competidores que publican de forma esporádica."
        ]
      };
    }

    return NextResponse.json(
      {
        success: true,
        demo: {
          id: docSnap.id,
          prospectName: data.prospectName || "",
          prospectBusiness: data.prospectBusiness || "Tu Negocio",
          prospectPhone: data.prospectPhone || "",
          rubro: data.rubro || "Comercial",
          offerText: data.offerText || "",
          dishOrProductName: data.dishOrProductName || "",
          badgeCustomText: data.badgeCustomText || "",
          generatedPostCaption: data.generatedPostCaption || data.postCaption || "",
          generatedImageUrl: data.generatedImageUrl || "",
          generatedVideoUrl: data.generatedVideoUrl || "",
          remotionComposition: data.remotionComposition || null,
          videoStyleTitle: data.videoStyleTitle || "",
          videoPromptEnglish: data.videoPromptEnglish || "",
          logoUrl: data.logoUrl || "",
          selectedStyleTitle: data.selectedStyleTitle || "Estándar Comercial",
          createdAt: isoDate,
          publications,
          strategy,
        },
        plans,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (err: any) {
    console.error("[API Public Muestras Error]:", err);
    return NextResponse.json({ error: err.message || "Error interno del servidor" }, { status: 500 });
  }
}
