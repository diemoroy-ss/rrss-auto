import { NextRequest, NextResponse } from 'next/server';
import { generateFreeText } from "../../../../lib/gemini-free";

export async function POST(req: NextRequest) {
  try {
    const { posts, profileName } = await req.json();

    if (!posts || !Array.isArray(posts)) {
      return NextResponse.json({ error: "Posts data is required" }, { status: 400 });
    }

    // Prepare data summary to reduce token usage
    const metricsSummary = posts.map((p: any) => {
        const date = p.scheduledFor?.toDate ? p.scheduledFor.toDate().toLocaleDateString('es-ES') : 
                    (p.scheduledFor ? new Date(p.scheduledFor).toLocaleDateString('es-ES') : 'Fecha desconocida');
                    
        return `Fecha: ${date} | Red: ${p.networks.join(', ')} | Tipo: ${p.type || 'Post'} | Texto/Idea: "${p.idea?.substring(0, 100)}..." -> Métricas: Alcance(${p.metrics?.reach || 0}), Interacciones(${ (p.metrics?.likes || 0) + (p.metrics?.comments || 0) + (p.metrics?.shares || 0) })`;
    }).join('\n');

    const systemInstruction = `Eres un experto Analista de Datos y Estratega de Marketing Digital Nivel Senior.
Tu objetivo es analizar un reporte de métricas de publicaciones en redes sociales y devolver una auditoría accionable.

REGLAS ESTRICTAS DE FORMATO:
1. Devuelve tu respuesta formateada ÚNICAMENTE usando etiquetas HTML básicas válidas (<h3>, <p>, <ul>, <li>, <strong>, <br/>).
2. NO uses Markdown en absoluto (sin asteriscos **, sin signos de número #, sin bloques de código \`\`\`). Sólo etiquetas HTML puras.
3. No envuelvas la respuesta en bloques preformateados como \`\`\`html. Retorna el string directo.
4. Usa un tono motivador, directo y profesional.

ESTRUCCURA SUGERIDA:
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
<p>Dile qué objetivo generar la próxima vez y un pequeño tip táctico.</p>`;

    const prompt = `Analiza el el siguiente reporte de las últimas ${posts.length} publicaciones de la marca "${profileName}".
Datos de rendimiento:
${metricsSummary}

Por favor, genera el reporte en HTML estructurado según tus instrucciones. Saca inferencias claras: si una red rinde mejor que otra, si un formato trajo más alcance interacciones, etc.`;
    
    console.log(`[GEMINI-FREE] Generating AI report for ${posts.length} posts of profile ${profileName}`);
    
    let analysisHtml = (await generateFreeText(prompt, systemInstruction)) || "No se pudo generar la auditoría.";
    
    // Limpiar si Gemini devuelve markdown alrededor del HTML
    analysisHtml = analysisHtml.replace(/```html/g, "").replace(/```/g, "").trim();
    
    return NextResponse.json({ analysis: analysisHtml });
  } catch (error: any) {
    console.error("[GEMINI-FREE ERROR] Error generating analysis:", error);
    return NextResponse.json({ error: error.message || "Failed to generate analysis" }, { status: 500 });
  }
}
