export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { generateFreeText } from '../../../../lib/gemini-free';
import { HARDCODED_STYLES } from '../../../../lib/prompt-templates';

export async function POST(req: NextRequest) {
  try {
    const { websiteUrl, logoUrl, rubro, businessName, businessDescription } = await req.json();

    if (!websiteUrl && !logoUrl && !businessDescription) {
      return NextResponse.json(
        { error: 'Debes proporcionar al menos una URL de sitio web, un logo o una descripción del negocio.' },
        { status: 400 }
      );
    }

    let webContentSnippet = '';
    let extractedColorsFromWeb: string[] = [];

    // 1. Scraping ligero de la web si viene websiteUrl
    if (websiteUrl) {
      try {
        let normalizedUrl = websiteUrl.trim();
        if (!/^https?:\/\//i.test(normalizedUrl)) {
          normalizedUrl = `https://${normalizedUrl}`;
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(normalizedUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml',
          },
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const html = await res.text();
          // Extraer colores hex que aparezcan repetidamente en el HTML/CSS inline
          const hexMatches = html.match(/#(?:[0-9a-fA-F]{3}){1,2}\b/g) || [];
          const colorCount: Record<string, number> = {};
          hexMatches.forEach((hex: string) => {
            const h = hex.toUpperCase();
            if (h !== '#FFF' && h !== '#FFFFFF' && h !== '#000' && h !== '#000000') {
              colorCount[h] = (colorCount[h] || 0) + 1;
            }
          });
          extractedColorsFromWeb = Object.entries(colorCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([c]) => c);

          // Extraer texto limpio de títulos, meta descripción y párrafos
          const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
          const metaDescMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
          const bodyText = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 2500);

          webContentSnippet = `Título: ${titleMatch?.[1]?.trim() || ''}\nMeta Descripción: ${metaDescMatch?.[1]?.trim() || ''}\nContenido clave: ${bodyText}`;
        }
      } catch (scrapErr: any) {
        console.warn('[extract-identity] Error escaneando sitio web:', scrapErr.message);
      }
    }

    const safeBusinessName = (businessName || '').trim();
    const safeRubro = (rubro || '').trim();
    const safeDescription = (businessDescription || '').trim();

    // 2. Preparar el prompt para que nuestros agentes analicen y definan el ADN visual
    const availableStyles = HARDCODED_STYLES.map((s) => ({
      id: s.id,
      title: s.title,
      category: s.category,
      behavior: s.imageGenBehavior,
    }));

    const analysisPrompt = `Eres un Director de Arte y Estratega de Branding Senior.
Tu misión es analizar la información disponible de una marca y extraer/proponer su IDENTIDAD VISUAL única (ADN visual) para generar imágenes y videos alineados con su estética.

INFORMACIÓN DISPONIBLE DE LA MARCA:
- Nombre: ${safeBusinessName || 'No especificado'}
- Rubro: ${safeRubro || 'General'}
- Descripción: ${safeDescription || 'No especificada'}
${websiteUrl ? `- Sitio Web: ${websiteUrl}\n- Resumen extraído de la web:\n${webContentSnippet || 'No se pudo leer contenido directo, analiza el dominio/marca'}\n- Colores detectados en la web: ${extractedColorsFromWeb.join(', ') || 'ninguno'}` : ''}
${logoUrl ? `- URL del Logo Corporativo: ${logoUrl}` : ''}

CATÁLOGO DE ESTILOS VISUALES DISPONIBLES:
${availableStyles.slice(0, 20).map((s) => `- ID: "${s.id}" | Título: "${s.title}" (${s.category})`).join('\n')}

INSTRUCCIONES DE RESPUESTA:
Devuelve ÚNICAMENTE un JSON con la siguiente estructura exacta (SIN backticks markdown, solo JSON puro):
{
  "primaryColor": "#HEX",
  "secondaryColor": "#HEX",
  "accentColor": "#HEX",
  "colorDescription": "descripción de 3-5 palabras de la paleta en inglés (ej: warm terracotta, linen white, forest green)",
  "toneAdjectives": ["adjetivo1", "adjetivo2", "adjetivo3", "adjetivo4"],
  "recurringElements": "lista de 3 a 5 elementos visuales u objetos recurrentes acordes al negocio en inglés o español (ej: coffee cups, wooden tables, soft natural window light)",
  "subjectType": "product | person | mixed | abstract",
  "audienceDescription": "descripción de 1 línea de a quién le habla visualmente",
  "styleMix": [
    { "styleId": "ID del estilo principal de la lista", "weight": 70 },
    { "styleId": "ID de un estilo secundario complementario de la lista", "weight": 30 }
  ],
  "lockStyle": false,
  "summaryReason": "explicación de 2 líneas de por qué esta estética representa a la marca"
}`;

    // Si viene logoUrl, lo enviamos como imagen a Gemini para que analice colores directamente
    const rawResult = await generateFreeText(
      analysisPrompt,
      'Eres un Director de Arte experto en branding visual y prompt engineering. Responde exclusivamente con el JSON pedido.',
      true,
      logoUrl || undefined
    );

    let parsed: any = {};
    try {
      const cleaned = rawResult.replace(/```json/g, '').replace(/```/g, '').trim();
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        parsed = JSON.parse(cleaned);
      }
    } catch (parseErr) {
      console.warn('[extract-identity] Error parseando JSON de Gemini, usando defaults inteligentes:', rawResult);
      parsed = {
        primaryColor: extractedColorsFromWeb[0] || '#4F46E5',
        secondaryColor: extractedColorsFromWeb[1] || '#F8FAFC',
        accentColor: extractedColorsFromWeb[2] || '#1E1B4B',
        colorDescription: 'clean modern tones with brand accent',
        toneAdjectives: ['profesional', 'moderno', 'innovador'],
        recurringElements: 'clean surfaces, natural lighting, professional environment',
        subjectType: 'product',
        audienceDescription: 'profesionales y empresas',
        styleMix: [
          { styleId: 'style-everyday-real', weight: 70 },
          { styleId: 'style-ads-hero-shot', weight: 30 }
        ],
        lockStyle: false,
        summaryReason: 'Estilo corporativo y profesional adaptado a la presencia digital de tu marca.'
      };
    }

    return NextResponse.json({
      success: true,
      identity: {
        ...parsed,
        websiteUrl: websiteUrl || undefined,
        extractedFrom: websiteUrl && logoUrl ? 'mixed' : websiteUrl ? 'website' : logoUrl ? 'logo' : 'manual',
        setupAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[extract-identity] Error general:', error);
    return NextResponse.json(
      { error: error?.message || 'Error al analizar la identidad visual' },
      { status: 500 }
    );
  }
}

