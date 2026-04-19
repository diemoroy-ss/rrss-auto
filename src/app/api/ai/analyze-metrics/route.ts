import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

export async function POST(req: NextRequest) {
  try {
    const { posts, profileName } = await req.json();

    if (!posts || !Array.isArray(posts)) {
      return NextResponse.json({ error: "Posts data is required" }, { status: 400 });
    }

    const apiKey = process.env.GOOGLE_GENAI_API_KEY;
    if (!apiKey) {
      console.error("GOOGLE_GENAI_API_KEY is not defined in environment variables.");
      return NextResponse.json({ error: "API Key configuration missing" }, { status: 500 });
    }

    // Prepare data summary to reduce token usage
    const metricsSummary = posts.map((p: any) => {
        const date = p.scheduledFor?.toDate ? p.scheduledFor.toDate().toLocaleDateString('es-ES') : 
                    (p.scheduledFor ? new Date(p.scheduledFor).toLocaleDateString('es-ES') : 'Fecha desconocida');
                    
        return `Fecha: ${date} | Red: ${p.networks.join(', ')} | Tipo: ${p.type || 'Post'} | Texto/Idea: "${p.idea?.substring(0, 100)}..." -> Métricas: Alcance(${p.metrics?.reach || 0}), Interacciones(${ (p.metrics?.likes || 0) + (p.metrics?.comments || 0) + (p.metrics?.shares || 0) })`;
    }).join('\n');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        systemInstruction: `Eres un experto Analista de Datos y Estratega de Marketing Digital Nivel Senior.
Tu objetivo es analizar un reporte de métricas de publicaciones en redes sociales y devolver una auditoría accionable.

REGLAS ESTRICTAS DE FORMATO:
1. Devuelve tu respuesta formateada ÚNICAMENTE usando etiquetas HTML básicas válidas (<h3>, <p>, <ul>, <li>, <strong>, <br/>).
2. NO uses Markdown en absoluto (sin asteriscos **, sin signos de número #, sin bloques de código \`\`\`). Sólo etiquetas HTML puras.
3. No envuelvas la respuesta en bloques preformateados como \`\`\`html. Retorna el string directo.
4. Usa un tono motivador, directo y profesional.

ESTRUCTURA SUGERIDA:
<h3>Resumen Ejecutivo</h3>
<p>Breve párrafo sobre la salud de la cuenta.</p>
<h3>Lo que mejor funcionó</h3>
<ul>
  <li><strong>El formato ganador:</strong> (identificar si Reels o Posts rindieron más).</li>
  <li><strong>El contenido top:</strong> (mencionar brevemente el post con más impacto).</li>
</ul>
<h3>Oportunidades de Mejora</h3>
<ul>
  <li>...</li>
</ul>
<h3>Recomendación para la próxima Estrategia</h3>
<p>Dile qué objetivo generar la próxima vez y un pequeño tip táctico.</p>`
    });

    const prompt = `Analiza el el siguiente reporte de las últimas ${posts.length} publicaciones de la marca "${profileName}".
Datos de rendimiento:
${metricsSummary}

Por favor, genera el reporte en HTML estructurado según tus instrucciones. Saca inferencias claras: si una red rinde mejor que otra, si un formato trajo más alcance interacciones, etc.`;
    
    console.log(`[ANALYZE-METRICS] Generating AI report for ${posts.length} posts of profile ${profileName}`);
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let analysisHtml = response.text().trim();
    
    // Clean up if Gemini accidentally outputted markdown codeblocks around the HTML
    if (analysisHtml.startsWith('```html')) {
        analysisHtml = analysisHtml.substring(7);
    }
    if (analysisHtml.startsWith('```')) {
        analysisHtml = analysisHtml.substring(3);
    }
    if (analysisHtml.endsWith('```')) {
        analysisHtml = analysisHtml.substring(0, analysisHtml.length - 3);
    }
    
    analysisHtml = analysisHtml.trim();

    return NextResponse.json({ analysis: analysisHtml });
  } catch (error: any) {
    console.error("[ANALYZE-METRICS] Error generating analysis with AI:", error);
    return NextResponse.json({ error: error.message || "Failed to generate analysis" }, { status: 500 });
  }
}
