import { NextRequest, NextResponse } from 'next/server';
import { generateFreeText } from "../../../../lib/gemini-free";
import * as cheerio from 'cheerio';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "Se requiere una URL válida" }, { status: 400 });
    }

    let targetUrl = url;
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
    }

    console.log(`[SEO-SCRAPER] Fetching URL: ${targetUrl}`);
    
    // Fetch the URL
    const response = await fetch(targetUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
    });

    if (!response.ok) {
        throw new Error(`Error al acceder al sitio web: ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    
    // Parse HTML with Cheerio
    const $ = cheerio.load(html);
    
    // Remove unwanted elements
    $('script, style, noscript, iframe, img, svg, nav, footer, header').remove();
    
    // Extract text and clean it
    let rawText = $('body').text();
    rawText = rawText.replace(/\s+/g, ' ').trim();

    // Limit text to roughly 10,000 characters to avoid huge token usage
    const truncatedText = rawText.substring(0, 10000);

    if (!truncatedText || truncatedText.length < 50) {
        return NextResponse.json({ error: "No se pudo extraer suficiente contenido legible del sitio web" }, { status: 400 });
    }

    // Call Gemini
    const systemInstruction = `Eres un Experto SEO y Consultor de Marketing Digital.
Tu tarea es analizar el texto extraído de un sitio web y determinar 3 cosas clave para configurar el 'Cerebro SEO' de una empresa.
Debes devolver tu respuesta EXCLUSIVAMENTE en formato JSON, sin texto adicional ni formateo markdown fuera del JSON válido.
El formato del JSON debe ser exactamente:
{
  "tone": "Describir el tono de voz ideal basado en el sitio web (ej: Profesional, tecnológico, innovador y persuasivo... máximo 2 líneas)",
  "audience": "Describir el público objetivo ideal (ej: Agencias de marketing, emprendedores... máximo 2 líneas)",
  "keywords": "Extraer o proponer entre 5 y 10 palabras clave principales de tipo Long-Tail separadas por comas"
}`;

    const prompt = `Analiza el siguiente contenido extraído del sitio web:
---
${truncatedText}
---

Extrae y propón el tono de voz (tone), el público objetivo (audience) y las palabras clave (keywords) en formato JSON.`;
    
    console.log(`[SEO-SCRAPER] Calling Gemini for analysis...`);
    
    const responseText = await generateFreeText(prompt, systemInstruction, false);
    
    if (!responseText) {
        throw new Error("No hubo respuesta del modelo de IA");
    }

    // Clean JSON response
    const cleanedText = responseText.replace(/```json\n/g, '').replace(/```/g, '').trim();
    let result;
    try {
        result = JSON.parse(cleanedText);
    } catch (parseError) {
        console.error("JSON parse error:", cleanedText);
        throw new Error("La IA devolvió un formato inválido");
    }

    return NextResponse.json({ success: true, data: result });

  } catch (error: any) {
    console.error("[SEO-SCRAPER] Error:", error);
    return NextResponse.json({ error: error.message || "Error interno del servidor al procesar la solicitud" }, { status: 500 });
  }
}
