import { NextRequest, NextResponse } from "next/server";
import { generateFreeText } from "../../../../lib/gemini-free";

export const maxDuration = 45;

export interface WinningCompetitorAd {
  id: string;
  competitorName: string;
  activeDaysBadge: string;
  format: string;
  hook: string;
  adCopyPreview: string;
  whyItWorks: string;
  metaLibraryUrl: string;
  imageUrl?: string;
  adapted: {
    sloganText: string;
    mainText: string;
    priceText: string;
    ctaText: string;
    scenePrompt: string;
    postCopy: string;
    slides?: Array<{
      slideNumber: number;
      sloganText: string;
      mainText: string;
      ctaText: string;
      imageExpectation: string;
    }>;
  };
}

/**
 * Extrae contexto real en vivo desde resultados de búsqueda públicos y/o sitio web del competidor
 */
async function scrapeLiveCompetitorContext(query: string, country = "CL"): Promise<string> {
  const snippets: string[] = [];
  const cleanQuery = query.trim();

  // 1. Si parece una URL o dominio, o un @handle de Instagram, intentar extraer vía Jina Reader / Fetch directo
  try {
    let targetUrl = "";
    if (cleanQuery.startsWith("http://") || cleanQuery.startsWith("https://")) {
      targetUrl = cleanQuery;
    } else if (cleanQuery.includes(".") && !cleanQuery.includes(" ")) {
      targetUrl = `https://${cleanQuery}`;
    } else if (cleanQuery.startsWith("@")) {
      const handle = cleanQuery.replace(/^@/, "");
      targetUrl = `https://www.instagram.com/${handle}/`;
    }

    if (targetUrl) {
      const jinaRes = await fetch(`https://r.jina.ai/${targetUrl}`, {
        headers: {
          Accept: "text/plain",
          "X-Return-Format": "text",
        },
        signal: AbortSignal.timeout(7000),
      }).catch(() => null);

      if (jinaRes && jinaRes.ok) {
        const text = await jinaRes.text();
        if (text && text.length > 80) {
          snippets.push(`CONTENIDO EXTRAÍDO DE ${targetUrl}:\n${text.slice(0, 4500)}`);
        }
      }
    }
  } catch (e) {
    console.warn("[competitor-spy] Jina fetch warning:", e);
  }

  // 2. Búsqueda web en vivo de ofertas, anuncios e Instagram públicos del competidor o rubro
  try {
    const searchQuery = `${cleanQuery} promociones ofertas instagram anuncios ${country}`;
    const ddgUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`;
    const res = await fetch(ddgUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(6000),
    }).catch(() => null);

    if (res && res.ok) {
      const html = await res.text();
      const cleaned = html
        .replace(/<script[^>]*>([\S\s]*?)<\/script>/gim, "")
        .replace(/<style[^>]*>([\S\s]*?)<\/style>/gim, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      if (cleaned.length > 100) {
        snippets.push(`RESULTADOS DE BÚSQUEDA EN VIVO PARA "${cleanQuery}":\n${cleaned.slice(0, 4500)}`);
      }
    }
  } catch (e) {
    console.warn("[competitor-spy] Search scrape warning:", e);
  }

  // 3. Si existe APIFY_API_TOKEN en variables de entorno, consultar anuncios reales
  const apifyToken = process.env.APIFY_API_TOKEN;
  if (apifyToken) {
    try {
      const apifyUrl = `https://api.apify.com/v2/acts/apify~facebook-ads-scraper/run-sync-get-dataset-items?token=${apifyToken}`;
      const apifyRes = await fetch(apifyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          searchTerms: [cleanQuery],
          country: country || "ALL",
          maxItems: 5,
        }),
        signal: AbortSignal.timeout(12000),
      }).catch(() => null);

      if (apifyRes && apifyRes.ok) {
        const items = await apifyRes.json();
        if (Array.isArray(items) && items.length > 0) {
          snippets.push(`ANUNCIOS EXTRAÍDOS DE META AD LIBRARY:\n${JSON.stringify(items.slice(0, 5)).slice(0, 4000)}`);
        }
      }
    } catch (e) {
      console.warn("[competitor-spy] Apify optional connector warning:", e);
    }
  }

  return snippets.join("\n\n---\n\n");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      query = "",
      businessName = "Mi Negocio",
      businessType = "Comercio / Servicios",
      postType = "Post",
      carouselCount = 5,
      country = "CL",
    }: {
      query?: string;
      businessName?: string;
      businessType?: string;
      postType?: string;
      carouselCount?: number;
      country?: string;
    } = body;

    const searchTarget = query.trim() || businessType || "Negocios locales";

    // 1. Ejecutar scraping en vivo de fuentes públicas
    const liveScrapedContext = await scrapeLiveCompetitorContext(searchTarget, country);

    // 2. Analizar y estructurar los 3 anuncios/publicaciones ganadoras con nuestros agentes
    const systemInstruction = `Eres el Agente Espía de Competencia y Estratega de Anuncios Ganadores de Santisoft.
Tu misión es analizar el mercado, los datos extraídos en vivo y los patrones probados de Meta Ad Library y TikTok Creative Center para entregar 3 publicaciones/anuncios ganadores reales y accionables del competidor o rubro buscado, junto con su adaptación lista en 1 clic para el negocio del usuario.

REGLAS OBLIGATORIAS:
1. NUNCA menciones que eres una IA o Inteligencia Artificial. Habla siempre como "nuestros agentes" o "tu equipo de agentes".
2. Aplica el principio de supervivencia publicitaria: destaca anuncios y estructuras que llevan +30 a +60 días activos porque generan retorno positivo (ROAS), ganchos de curiosidad, ofertas de respuesta directa o pruebas sociales.
3. Todo el texto debe estar en español natural, directo ("tú a tú") y sin muletillas robóticas.
4. En "scenePrompt" (y en "imageExpectation" de slides), describe la escena visual publicitaria SIN incluir porcentajes numéricos (no uses 14%, 20%, 60%) para evitar que se dibujen líneas de margen.
5. Devuelve EXCLUSIVAMENTE un objeto JSON válido con esta estructura exacta:
{
  "winningAds": [
    {
      "id": "win-1",
      "competitorName": "Nombre del competidor o referente del rubro",
      "activeDaysBadge": "🔥 +45 días activo · Ganador en Meta",
      "format": "${postType === "Carrusel" ? `Carrusel (${carouselCount} Slides)` : "Afiche 1:1 / 4:5"}",
      "hook": "El gancho exacto que usa la publicación ganadora de la competencia",
      "adCopyPreview": "Extracto de 1-2 líneas del texto persuasivo que usa el anuncio",
      "whyItWorks": "Explicación directa de 1 línea de por qué este anuncio convierte tan bien",
      "adapted": {
        "sloganText": "Insignia superior adaptada al negocio del usuario (máx 30 caracteres)",
        "mainText": "Titular principal adaptado al negocio del usuario (máx 50 caracteres)",
        "priceText": "Oferta o gancho de valor adaptado (ej. Evaluacion Gratis o 20% OFF Hoy) o vacío",
        "ctaText": "Llamado a la acción corto (ej. Pide por WhatsApp 👉)",
        "scenePrompt": "Descripción fotográfica publicitaria detallada en español para generar la imagen del cartel (sin porcentajes)",
        "postCopy": "Copy persuasivo completo de 3 a 4 líneas para el post de Instagram/Facebook adaptado al negocio del usuario"${postType === "Carrusel" ? `,
        "slides": [
          {
            "slideNumber": 1,
            "sloganText": "Insignia Slide 1",
            "mainText": "Titular Gancho Slide 1",
            "ctaText": "Desliza 👉",
            "imageExpectation": "Escena visual para el Slide 1"
          }
        ]` : ""}
      }
    }
  ]
}`;

    const userPrompt = `Investiga y extrae 3 anuncios/publicaciones ganadoras para la búsqueda: "${searchTarget}"
Datos del negocio del usuario que adaptará el anuncio:
- Nombre del negocio del usuario: "${businessName}"
- Giro / Rubro del usuario: "${businessType}"
- Formato actual seleccionado: "${postType}" ${postType === "Carrusel" ? `(${carouselCount} láminas — incluye el arreglo 'slides' con las ${carouselCount} láminas dentro de 'adapted')` : ""}

${liveScrapedContext ? `DATOS EXTRAÍDOS EN VIVO POR EL SCRAPER:\n${liveScrapedContext}\n` : ""}

Genera exactamente 3 opciones ganadoras distintas (ej. 1 enfocada en derribar objeción/curiosidad, 1 enfocada en oferta directa/urgencia, y 1 enfocada en autoridad/antes y después) en formato JSON válido.`;

    const rawResponse = await generateFreeText(userPrompt, systemInstruction, true, undefined, "strategy");

    let cleanJson = rawResponse.trim();
    if (cleanJson.startsWith("```json")) {
      cleanJson = cleanJson.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (cleanJson.startsWith("```")) {
      cleanJson = cleanJson.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    let parsed: { winningAds?: WinningCompetitorAd[] } = {};
    try {
      parsed = JSON.parse(cleanJson);
    } catch (err) {
      console.warn("[competitor-spy] Fallback JSON parse:", err);
      parsed = { winningAds: [] };
    }

    const winningAds: WinningCompetitorAd[] = (parsed.winningAds || []).map((ad, idx) => ({
      ...ad,
      id: ad.id || `win-${idx + 1}`,
      metaLibraryUrl: `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=ALL&q=${encodeURIComponent(
        ad.competitorName || searchTarget
      )}`,
    }));

    return NextResponse.json({
      success: true,
      query: searchTarget,
      scrapedLiveData: Boolean(liveScrapedContext),
      winningAds,
    });
  } catch (error: any) {
    console.error("[competitor-spy API Error]:", error);
    return NextResponse.json(
      { error: error.message || "Error al escanear anuncios ganadores de la competencia." },
      { status: 500 }
    );
  }
}
